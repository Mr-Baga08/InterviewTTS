import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { NextRequest } from "next/server";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

// App configuration constants
const APP_CONFIG = {
  version: "1.0.0",
  limits: {
    minQuestionsPerInterview: 3,
    maxQuestionsPerInterview: 15
  }
} as const;

/* ==========================================================================
   UTILITY FUNCTIONS FOR REQUEST HANDLING
   ========================================================================== */

interface ClientInfo {
  ip: string;
  userAgent: string;
  country: string | null;
  city: string | null;
  isp: string | null;
  acceptLanguage?: string;
  referer?: string;
  origin?: string;
}

function getClientIP(request: NextRequest): string {
  // Try different headers for IP address
  const xForwardedFor = request.headers.get('x-forwarded-for');
  const xRealIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  if (xRealIP) {
    return xRealIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  return 'unknown';
}

async function getClientInfo(request: NextRequest): Promise<ClientInfo> {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const acceptLanguage = request.headers.get('accept-language') || undefined;
  const referer = request.headers.get('referer') || undefined;
  const origin = request.headers.get('origin') || undefined;

  return {
    ip,
    userAgent,
    country: null, // Would need external service for geo data
    city: null,
    isp: null,
    acceptLanguage,
    referer,
    origin
  };
}

async function safeParseJSON(request: NextRequest): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const text = await request.text();
    if (!text.trim()) {
      return { success: false, error: "Empty request body" };
    }
    const data = JSON.parse(text);
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Invalid JSON format" 
    };
  }
}

function formatZodError(error: z.ZodError): string[] {
  return error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
}

function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): 
  { success: true; data: T } | { success: false; details: string[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, details: formatZodError(error) };
    }
    return { success: false, details: ["Validation failed"] };
  }
}

/* ==========================================================================
   ENHANCED VALIDATION SCHEMAS
   ========================================================================== */

const InterviewRequestSchema = z.object({
  type: z.enum(["Technical", "Behavioral", "Mixed", "System Design", "Coding"], {
    errorMap: () => ({ message: "Invalid interview type" })
  }),
  role: z.string()
    .min(2, "Role must be at least 2 characters")
    .max(100, "Role must be less than 100 characters")
    .regex(/^[a-zA-Z\s\-\.\/\(\)]+$/, "Role contains invalid characters")
    .transform(str => str.trim()),
  level: z.enum(["Entry", "Junior", "Mid", "Senior", "Staff", "Principal", "Director"], {
    errorMap: () => ({ message: "Invalid experience level" })
  }),
  techstack: z.string()
    .min(1, "At least one technology is required")
    .max(500, "Tech stack description too long")
    .transform(str => str.trim()),
  amount: z.number()
    .int("Amount must be a whole number")
    .min(APP_CONFIG.limits.minQuestionsPerInterview, `Minimum ${APP_CONFIG.limits.minQuestionsPerInterview} questions required`)
    .max(APP_CONFIG.limits.maxQuestionsPerInterview, `Maximum ${APP_CONFIG.limits.maxQuestionsPerInterview} questions allowed`),
  userid: z.string()
    .min(1, "User ID is required")
    .max(50, "User ID too long"),
  
  // Optional advanced parameters
  difficulty: z.enum(["Easy", "Medium", "Hard", "Expert"]).optional(),
  focus: z.array(z.string()).max(5).optional(),
  industry: z.string().max(50).optional(),
  companySize: z.enum(["Startup", "SME", "Enterprise"]).optional(),
  remote: z.boolean().optional(),
});

type InterviewRequestData = z.infer<typeof InterviewRequestSchema>;

/* ==========================================================================
   RATE LIMITING & SECURITY
   ========================================================================== */

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { 
  requests: number; 
  windowStart: number; 
  lastRequest: number 
}>();

const RATE_LIMITS = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 interviews per 15 minutes
  burstLimit: 2, // Max 2 requests per minute
} as const;

async function checkRateLimit(userId: string, ip: string): Promise<{ 
  allowed: boolean; 
  resetTime?: number; 
  remaining?: number 
}> {
  const now = Date.now();
  const key = `${userId}-${ip}`;
  const current = rateLimitStore.get(key) || { 
    requests: 0, 
    windowStart: now, 
    lastRequest: 0 
  };

  // Reset window if expired
  if (now - current.windowStart > RATE_LIMITS.windowMs) {
    current.requests = 0;
    current.windowStart = now;
  }

  // Check burst limit (2 requests per minute)
  if (now - current.lastRequest < 60000 && current.requests >= RATE_LIMITS.burstLimit) {
    return {
      allowed: false,
      resetTime: current.lastRequest + 60000,
      remaining: 0
    };
  }

  // Check window limit
  if (current.requests >= RATE_LIMITS.maxRequests) {
    return {
      allowed: false,
      resetTime: current.windowStart + RATE_LIMITS.windowMs,
      remaining: 0
    };
  }

  // Update counters
  current.requests++;
  current.lastRequest = now;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: RATE_LIMITS.maxRequests - current.requests
  };
}

/* ==========================================================================
   ENHANCED PROMPT ENGINEERING
   ========================================================================== */

const createInterviewPrompt = (params: {
  role: string;
  level: string;
  techstack: string;
  type: string;
  amount: number;
  difficulty?: string;
  focus?: string[];
  industry?: string;
  companySize?: string;
}) => {
  const { 
    role, 
    level, 
    techstack, 
    type, 
    amount, 
    difficulty = "Medium", 
    focus, 
    industry, 
    companySize 
  } = params;

  const focusMap = {
    "Technical": "80% technical questions focusing on problem-solving, coding concepts, system design, and technology-specific knowledge",
    "Behavioral": "80% behavioral questions using STAR method, focusing on leadership, teamwork, conflict resolution, and cultural fit",
    "Mixed": "50% technical and 50% behavioral questions for comprehensive assessment",
    "System Design": "90% system design questions focusing on scalability, architecture, and distributed systems",
    "Coding": "90% coding and algorithmic questions with practical implementation focus"
  };

  const difficultyGuidelines = {
    "Easy": "Focus on fundamental concepts, basic implementation, and entry-level scenarios",
    "Medium": "Include moderate complexity problems, some system thinking, and practical experience",
    "Hard": "Advanced concepts, complex scenarios, architectural decisions, and leadership situations",
    "Expert": "Expert-level problems, innovative solutions, strategic thinking, and industry leadership"
  };

  const levelContext = {
    "Entry": "New graduate or career changer, focus on fundamentals and learning ability",
    "Junior": "1-2 years experience, basic implementation skills and some project experience",
    "Mid": "3-5 years experience, independent work, mentoring capability, and technical depth",
    "Senior": "5+ years experience, leadership skills, architectural thinking, and strategic decisions",
    "Staff": "8+ years experience, cross-team impact, technical strategy, and mentoring",
    "Principal": "10+ years experience, organization-wide impact, technical vision, and innovation",
    "Director": "Leadership role, team management, technical strategy, and business alignment"
  };

  return `You are a senior technical interviewer at a leading technology company, creating interview questions for a ${level} ${role} position.

POSITION CONTEXT:
- Role: ${role}
- Experience Level: ${level} (${levelContext[level as keyof typeof levelContext]})
- Technologies: ${techstack}
- Question Distribution: ${focusMap[type as keyof typeof focusMap]}
- Difficulty: ${difficulty} (${difficultyGuidelines[difficulty as keyof typeof difficultyGuidelines]})
- Total Questions: ${amount}
${industry ? `- Industry: ${industry}` : ''}
${companySize ? `- Company Size: ${companySize}` : ''}
${focus?.length ? `- Focus Areas: ${focus.join(', ')}` : ''}

QUESTION GENERATION GUIDELINES:

Technical Questions (when applicable):
- Start with foundational concepts, then progress to advanced topics
- Include practical implementation scenarios relevant to the role
- Cover system design appropriate for the experience level
- Ask about best practices, optimization, and trade-offs
- Include debugging and troubleshooting scenarios
- Focus on real-world applications of technologies

Behavioral Questions (when applicable):
- Use STAR method compatible questions (Situation, Task, Action, Result)
- Include leadership scenarios appropriate for the level
- Cover teamwork, communication, and conflict resolution
- Ask about learning experiences and growth mindset
- Include questions about handling pressure and deadlines
- Cover cultural fit and values alignment

System Design Questions (when applicable):
- Scale complexity based on experience level
- Cover scalability, reliability, and performance considerations
- Include technology choices and trade-offs
- Ask about monitoring, logging, and observability
- Cover security and compliance considerations

QUALITY REQUIREMENTS:
- Each question should be clear, specific, and actionable
- Questions should be appropriate for voice interviews (avoid complex diagrams)
- Include follow-up potential in each question
- Ensure questions test different aspects of competency
- Make questions realistic and job-relevant
- Avoid overly academic or theoretical questions unless relevant

OUTPUT FORMAT:
Return ONLY a valid JSON array of strings. No additional text, explanations, or formatting.
Each question should be a complete, standalone question ready for an interview.
Avoid special characters that could break JSON parsing.

Example format: ["Question 1 here", "Question 2 here", "Question 3 here"]

Generate exactly ${amount} high-quality, diverse interview questions now.`;
};

/* ==========================================================================
   ENHANCED RESPONSE HELPERS
   ========================================================================== */

interface ApiError {
  code: string;
  message: string;
  details?: any;
  suggestion?: string;
  retryAfter?: number;
}

interface ApiSuccess<T = any> {
  success: true;
  message: string;
  data: T;
  metadata: {
    timestamp: string;
    requestId: string;
    version: string;
    processingTime?: number;
  };
}

const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createErrorResponse = (error: ApiError, status: number = 400) => {
  return Response.json({
    success: false,
    error: {
      ...error,
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
    }
  }, { 
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': generateRequestId(),
      ...(error.retryAfter && { 'Retry-After': error.retryAfter.toString() }),
    }
  });
};

const createSuccessResponse = <T>(
  data: T, 
  message: string, 
  processingTime?: number
): Response => {
  const response: ApiSuccess<T> = {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: generateRequestId(),
      version: APP_CONFIG.version,
      ...(processingTime && { processingTime }),
    }
  };

  return Response.json(response, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': response.metadata.requestId,
    }
  });
};

/* ==========================================================================
   QUESTION VALIDATION & ENHANCEMENT
   ========================================================================== */

const validateAndEnhanceQuestions = (
  questions: string[], 
  expectedAmount: number, 
  role: string
): string[] => {
  const validQuestions = questions
    .filter(q => typeof q === 'string' && q.trim().length > 15)
    .map(q => q.trim())
    .filter(q => !q.includes('undefined') && !q.includes('null'))
    .slice(0, expectedAmount);

  // Ensure minimum quality threshold
  if (validQuestions.length < Math.max(1, expectedAmount - 2)) {
    throw new Error(
      `Generated only ${validQuestions.length} valid questions out of ${expectedAmount} requested`
    );
  }

  return validQuestions;
};

/* ==========================================================================
   MAIN API HANDLERS
   ========================================================================== */

// export async function POST(request: NextRequest) {
//   const startTime = Date.now();
  
//   try {
//     // Get client information
//     const clientInfo = await getClientInfo(request);
//     const clientIP = getClientIP(request);

//     // Parse and validate request body
//     const jsonResult = await safeParseJSON(request);
//     if (!jsonResult.success) {
//       return createErrorResponse({
//         code: 'INVALID_JSON',
//         message: 'Invalid JSON in request body',
//         details: jsonResult.error,
//         suggestion: 'Ensure request body contains valid JSON'
//       }, 400);
//     }

//     // Validate request schema
//     const validation = validateRequest(InterviewRequestSchema, jsonResult.data);
//     if (!validation.success) {
//       return createErrorResponse({
//         code: 'VALIDATION_ERROR',
//         message: 'Invalid request data',
//         details: validation.details,
//         suggestion: 'Check the API documentation for required fields and formats'
//       }, 400);
//     }

//     const { 
//       type, 
//       role, 
//       level, 
//       techstack, 
//       amount, 
//       userid, 
//       difficulty, 
//       focus, 
//       industry, 
//       companySize 
//     } = validation.data;

//     // Rate limiting
//     const rateLimitResult = await checkRateLimit(userid, clientIP);
//     if (!rateLimitResult.allowed) {
//       return createErrorResponse({
//         code: 'RATE_LIMIT_EXCEEDED',
//         message: 'Too many requests. Please try again later.',
//         suggestion: 'Wait before making another request',
//         retryAfter: Math.ceil((rateLimitResult.resetTime! - Date.now()) / 1000)
//       }, 429);
//     }

//     // Generate questions with AI
//     let questions: string[];
//     try {
//       const prompt = createInterviewPrompt({
//         role, 
//         level, 
//         techstack, 
//         type, 
//         amount, 
//         difficulty, 
//         focus, 
//         industry, 
//         companySize
//       });
      
//       const { text: questionsText } = await generateText({
//         model: google("gemini-2.0-flash-001"),
//         prompt,
//         maxTokens: 3000,
//         temperature: 0.7,
//         topP: 0.9,
//       });

//       // Parse and validate AI response
//       let parsedQuestions;
//       try {
//         parsedQuestions = JSON.parse(questionsText);
//       } catch {
//         throw new Error("AI returned invalid JSON format");
//       }

//       if (!Array.isArray(parsedQuestions)) {
//         throw new Error("AI response is not an array");
//       }

//       questions = validateAndEnhanceQuestions(parsedQuestions, amount, role);
      
//     } catch (aiError: any) {
//       console.error("AI Generation Error:", {
//         error: aiError.message,
//         role,
//         level,
//         type,
//         userid,
//         timestamp: new Date().toISOString()
//       });

//       return createErrorResponse({
//         code: 'AI_GENERATION_FAILED',
//         message: 'Failed to generate interview questions',
//         details: 'Our AI service is temporarily unavailable',
//         suggestion: 'Please try again in a few moments'
//       }, 503);
//     }

//     // Create enhanced interview object
//     const interview = {
//       role: role.trim(),
//       type,
//       level,
//       techstack: techstack.split(",").map(tech => tech.trim()).filter(Boolean),
//       questions,
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
      
//       // Enhanced metadata
//       metadata: {
//         requestedAmount: amount,
//         actualAmount: questions.length,
//         difficulty: difficulty || "Medium",
//         focus: focus || [],
//         industry: industry || null,
//         companySize: companySize || null,
//         generatedBy: "AI",
//         userAgent: clientInfo.userAgent,
//         clientIP: clientInfo.ip !== 'unknown' ? clientInfo.ip : null,
//         processingTime: Date.now() - startTime,
//       },
      
//       // Additional fields
//       estimatedDuration: Math.max(20, questions.length * 3), // 3 minutes per question minimum
//       status: "active",
//       tags: [type, level, ...techstack.split(",").map(t => t.trim()).slice(0, 3)],
//     };

//     // Save to database
//     try {
//       const docRef = await db.collection("interviews").add(interview);
      
//       // Log successful creation for analytics
//       console.log("Interview created successfully:", {
//         interviewId: docRef.id,
//         role,
//         type,
//         level,
//         questionsCount: questions.length,
//         userid,
//         processingTime: Date.now() - startTime,
//       });

//       const processingTime = Date.now() - startTime;
      
//       return createSuccessResponse({
//         interviewId: docRef.id,
//         questionsGenerated: questions.length,
//         role: interview.role,
//         type: interview.type,
//         level: interview.level,
//         estimatedDuration: interview.estimatedDuration,
//         tags: interview.tags,
//         previewQuestions: questions.slice(0, 2), // Show first 2 questions as preview
//       }, `Successfully created ${type.toLowerCase()} interview for ${role} (${level} level)`, processingTime);
      
//     } catch (dbError: any) {
//       console.error("Database Error:", {
//         error: dbError.message,
//         code: dbError.code,
//         userid,
//         timestamp: new Date().toISOString()
//       });

//       return createErrorResponse({
//         code: 'DATABASE_ERROR',
//         message: 'Failed to save interview',
//         details: 'Database temporarily unavailable',
//         suggestion: 'Please try again in a few moments'
//       }, 503);
//     }

//   } catch (error: any) {
//     console.error("Interview Generation Error:", {
//       error: error.message,
//       stack: error.stack,
//       timestamp: new Date().toISOString(),
//     });
    
//     return createErrorResponse({
//       code: 'INTERNAL_ERROR',
//       message: 'An unexpected error occurred',
//       suggestion: 'Please try again or contact support if the problem persists'
//     }, 500);
//   }
// }

// // Fixed version of your API route with correct endpoint documentation
// export async function GET() {
//   const healthData = {
//     service: "TheTruthSchool.ai Interview Generation API",
//     version: APP_CONFIG.version,
//     status: "operational",
//     timestamp: new Date().toISOString(),
    
//     features: [
//       "AI-powered question generation",
//       "Multiple interview types",
//       "Role-specific customization", 
//       "Experience level targeting",
//       "Tech stack optimization",
//       "Difficulty adjustment",
//       "Industry-specific questions",
//       "Rate limiting protection"
//     ],
    
//     configuration: {
//       supportedTypes: ["Technical", "Behavioral", "Mixed", "System Design", "Coding"],
//       supportedLevels: ["Entry", "Junior", "Mid", "Senior", "Staff", "Principal", "Director"],
//       questionLimits: {
//         min: APP_CONFIG.limits.minQuestionsPerInterview,
//         max: APP_CONFIG.limits.maxQuestionsPerInterview
//       },
//       rateLimits: RATE_LIMITS,
//     },
    
//     // Fixed: Use the correct path based on your file structure
//     endpoints: {
//       "POST /vapi/generate": "Generate new interview questions",
//       "GET /vapi/generate": "API health check and documentation", 
//       "HEAD /vapi/generate": "Service health check"
//     }
//   };

//   return createSuccessResponse(healthData, "Interview Generation API is operational");
// }

// export async function HEAD() {
//   return new Response(null, { 
//     status: 200,
//     headers: {
//       'X-Service-Status': 'healthy',
//       'X-Version': APP_CONFIG.version,
//       'X-Last-Updated': new Date().toISOString(),
//       'X-Rate-Limit-Window': RATE_LIMITS.windowMs.toString(),
//       'X-Rate-Limit-Max': RATE_LIMITS.maxRequests.toString(),
//     }
//   });
// }

// export async function OPTIONS() {
//   return new Response(null, {
//     status: 200,
//     headers: {
//       'Access-Control-Allow-Origin': '*',
//       'Access-Control-Allow-Methods': 'POST, GET, HEAD, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//       'Access-Control-Max-Age': '86400',
//     }
//   });
// }

// Updated /vapi/generate route with better error handling and debugging


export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('🚀 Interview generation request received');
    
    // Parse and validate request body
    const jsonResult = await safeParseJSON(request);
    if (!jsonResult.success) {
      console.error('❌ JSON parsing failed:', jsonResult.error);
      return createErrorResponse({
        code: 'INVALID_JSON',
        message: 'Invalid JSON in request body',
        details: jsonResult.error,
        suggestion: 'Ensure request body contains valid JSON'
      }, 400);
    }

    console.log('📋 Request data:', jsonResult.data);

    // Validate request schema
    const validation = validateRequest(InterviewRequestSchema, jsonResult.data);
    if (!validation.success) {
      console.error('❌ Validation failed:', validation.details);
      return createErrorResponse({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: validation.details,
        suggestion: 'Check the required fields: type, role, level, techstack, amount, userid'
      }, 400);
    }

    const { 
      type, 
      role, 
      level, 
      techstack, 
      amount, 
      userid, 
      difficulty, 
      focus, 
      industry, 
      companySize 
    } = validation.data;

    console.log('✅ Validation passed:', { type, role, level, amount, userid });

    // Check Google AI API key
    const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!googleApiKey) {
      console.error('❌ Google AI API key not found');
      return createErrorResponse({
        code: 'AI_CONFIG_ERROR',
        message: 'AI service configuration missing',
        details: 'GOOGLE_GENERATIVE_AI_API_KEY not set',
        suggestion: 'Set GOOGLE_GENERATIVE_AI_API_KEY in your environment variables'
      }, 503);
    }

    console.log('🔑 Google AI API key found:', googleApiKey.substring(0, 8) + '...');

    // Generate questions with AI - FIXED MODEL NAME
    let questions: string[];
    try {
      console.log('🧠 Starting AI question generation...');
      
      const prompt = createInterviewPrompt({
        role, 
        level, 
        techstack, 
        type, 
        amount, 
        difficulty, 
        focus, 
        industry, 
        companySize
      });
      
      console.log('📝 Prompt created, length:', prompt.length);
      
      // FIXED: Use working model name - try multiple models for reliability
      const modelsToTry = [
        "gemini-1.5-flash",      // Most reliable
        "gemini-1.5-pro",        // Fallback 1
        "gemini-pro",            // Fallback 2
        "gemini-2.0-flash-001"   // Original (might not work)
      ];

      let questionsText = "";
      let usedModel = "";
      
      for (const modelName of modelsToTry) {
        try {
          console.log(`🔗 Trying model: ${modelName}`);
          
          const result = await generateText({
            model: google(modelName),
            prompt,
            maxTokens: 3000,
            temperature: 0.7,
            topP: 0.9,
          });

          questionsText = result.text;
          usedModel = modelName;
          console.log(`✅ Success with model: ${modelName}`);
          break;
          
        } catch (modelError: any) {
          console.warn(`⚠️ Model ${modelName} failed:`, modelError.message);
          continue;
        }
      }

      if (!questionsText) {
        throw new Error("All AI models failed to generate questions");
      }

      console.log('✅ AI response received, length:', questionsText.length);
      console.log('🤖 Used model:', usedModel);

      // Parse and validate AI response
      let parsedQuestions;
      try {
        // Clean the response - remove markdown formatting
        const cleanedText = questionsText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .replace(/^[^[{]*/, '') // Remove any text before JSON starts
          .replace(/[^}\]]*$/, '') // Remove any text after JSON ends
          .trim();
        
        console.log('🧹 Cleaned response preview:', cleanedText.substring(0, 200) + '...');
        
        parsedQuestions = JSON.parse(cleanedText);
        console.log('✅ JSON parsing successful');
      } catch (parseError: any) {
        console.error('❌ JSON parsing failed:', parseError.message);
        console.error('📄 Raw response:', questionsText.substring(0, 500));
        
        // Try to extract JSON from the response more aggressively
        try {
          const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            parsedQuestions = JSON.parse(jsonMatch[0]);
            console.log('✅ Extracted JSON successfully');
          } else {
            throw new Error("No JSON array found in response");
          }
        } catch (extractError) {
          throw new Error(`AI returned invalid JSON format. Raw response: ${questionsText.substring(0, 200)}...`);
        }
      }

      if (!Array.isArray(parsedQuestions)) {
        console.error('❌ AI response is not an array:', typeof parsedQuestions);
        throw new Error("AI response is not an array");
      }

      console.log('📊 Parsed questions count:', parsedQuestions.length);
      
      questions = validateAndEnhanceQuestions(parsedQuestions, amount, role);
      console.log('✅ Questions validated, final count:', questions.length);
      
    } catch (aiError: any) {
      console.error("❌ AI Generation Error:", {
        error: aiError.message,
        stack: aiError.stack,
        role,
        level,
        type,
        userid,
        timestamp: new Date().toISOString()
      });

      // More specific error handling
      if (aiError.message?.includes('API_KEY') || aiError.message?.includes('401')) {
        return createErrorResponse({
          code: 'AI_AUTH_ERROR',
          message: 'AI service authentication failed',
          details: 'Invalid or missing Google AI API key',
          suggestion: 'Verify your GOOGLE_GENERATIVE_AI_API_KEY at https://aistudio.google.com/app/apikey'
        }, 503);
      }

      if (aiError.message?.includes('quota') || aiError.message?.includes('limit') || aiError.message?.includes('429')) {
        return createErrorResponse({
          code: 'AI_QUOTA_EXCEEDED',
          message: 'AI service quota exceeded',
          details: 'Google AI API quota or rate limit reached',
          suggestion: 'Please try again later or check your API quota in Google AI Studio'
        }, 503);
      }

      if (aiError.message?.includes('model') || aiError.message?.includes('404')) {
        return createErrorResponse({
          code: 'AI_MODEL_ERROR',
          message: 'AI model not available',
          details: 'The requested AI model is not accessible',
          suggestion: 'Model may not be available in your region or account'
        }, 503);
      }

      return createErrorResponse({
        code: 'AI_GENERATION_FAILED',
        message: 'Failed to generate interview questions',
        details: aiError.message || 'Unknown AI service error',
        suggestion: 'Please try again in a few moments or contact support'
      }, 503);
    }

    // Create enhanced interview object (same as before)
    const interview = {
      role: role.trim(),
      type,
      level,
      techstack: techstack.split(",").map(tech => tech.trim()).filter(Boolean),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      
      metadata: {
        requestedAmount: amount,
        actualAmount: questions.length,
        difficulty: difficulty || "Medium",
        focus: focus || [],
        industry: industry || null,
        companySize: companySize || null,
        generatedBy: "AI",
        processingTime: Date.now() - startTime,
      },
      
      estimatedDuration: Math.max(20, questions.length * 3),
      status: "active",
      tags: [type, level, ...techstack.split(",").map(t => t.trim()).slice(0, 3)],
    };

    console.log('💾 Saving to database...');

    // Save to database
    try {
      const docRef = await db.collection("interviews").add(interview);
      
      console.log("✅ Interview created successfully:", {
        interviewId: docRef.id,
        role,
        type,
        level,
        questionsCount: questions.length,
        userid,
        processingTime: Date.now() - startTime,
      });

      const processingTime = Date.now() - startTime;
      
      return createSuccessResponse({
        interviewId: docRef.id,
        questionsGenerated: questions.length,
        role: interview.role,
        type: interview.type,
        level: interview.level,
        estimatedDuration: interview.estimatedDuration,
        tags: interview.tags,
        previewQuestions: questions.slice(0, 2),
      }, `Successfully created ${type.toLowerCase()} interview for ${role} (${level} level)`, processingTime);
      
    } catch (dbError: any) {
      console.error("❌ Database Error:", {
        error: dbError.message,
        code: dbError.code,
        userid,
        timestamp: new Date().toISOString()
      });

      return createErrorResponse({
        code: 'DATABASE_ERROR',
        message: 'Failed to save interview',
        details: 'Database temporarily unavailable',
        suggestion: 'Please try again in a few moments'
      }, 503);
    }

  } catch (error: any) {
    console.error("❌ Interview Generation Error:", {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    return createErrorResponse({
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      details: error.message,
      suggestion: 'Please try again or contact support if the problem persists'
    }, 500);
  }
}

// Enhanced GET endpoint with model testing
export async function GET() {
  try {
    // Test which models are working
    const workingModels = [];
    const testModels = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro"];
    
    for (const model of testModels) {
      try {
        await generateText({
          model: google(model),
          prompt: "Say hello",
          maxTokens: 5,
        });
        workingModels.push(model);
      } catch {
        // Model doesn't work, skip
      }
    }

    const healthData = {
      service: "TheTruthSchool.ai Interview Generation API",
      version: "2.0.0",
      status: "operational",
      timestamp: new Date().toISOString(),
      
      configuration: {
        googleAI: {
          configured: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
          keyPreview: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 8) + '...' || 'Not set',
          workingModels: workingModels,
          recommendedModel: workingModels[0] || 'none'
        },
        supportedTypes: ["Technical", "Behavioral", "Mixed", "System Design", "Coding"],
        supportedLevels: ["Entry", "Junior", "Mid", "Senior", "Staff", "Principal", "Director"],
      },
      
      endpoints: {
        "POST /vapi/generate": "Generate new interview questions",
        "GET /vapi/generate": "API health check and documentation",
      }
    };

    return createSuccessResponse(healthData, "Interview Generation API is operational");
  } catch (error: any) {
    return createErrorResponse({
      code: 'HEALTH_CHECK_FAILED',
      message: 'Health check failed',
      details: error.message
    }, 503);
  }
}
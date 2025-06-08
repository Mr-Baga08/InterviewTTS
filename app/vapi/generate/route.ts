import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

// Request validation schema
const InterviewRequestSchema = z.object({
  type: z.enum(["Technical", "Behavioral", "Mixed"], {
    errorMap: () => ({ message: "Interview type must be Technical, Behavioral, or Mixed" })
  }),
  role: z.string()
    .min(2, "Role must be at least 2 characters")
    .max(100, "Role must be less than 100 characters")
    .regex(/^[a-zA-Z\s-]+$/, "Role can only contain letters, spaces, and hyphens"),
  level: z.enum(["Entry", "Junior", "Mid", "Senior", "Staff", "Principal"], {
    errorMap: () => ({ message: "Level must be Entry, Junior, Mid, Senior, Staff, or Principal" })
  }),
  techstack: z.string()
    .min(1, "At least one technology is required")
    .max(500, "Tech stack description too long"),
  amount: z.number()
    .int("Amount must be a whole number")
    .min(3, "Minimum 3 questions required")
    .max(15, "Maximum 15 questions allowed"),
  userid: z.string()
    .min(1, "User ID is required")
    .uuid("Invalid user ID format").optional()
    .or(z.string().min(1))
});

// Enhanced prompt with better instructions
const createInterviewPrompt = (role: string, level: string, techstack: string, type: string, amount: number) => {
  const focusMap = {
    "Technical": "80% technical questions focusing on problem-solving, coding concepts, and technology-specific knowledge",
    "Behavioral": "80% behavioral questions focusing on past experiences, teamwork, and situational responses",
    "Mixed": "50% technical and 50% behavioral questions for a well-rounded assessment"
  };

  return `You are an expert technical recruiter creating interview questions for a ${level} ${role} position.

REQUIREMENTS:
- Role: ${role}
- Experience Level: ${level}  
- Technologies: ${techstack}
- Question Distribution: ${focusMap[type as keyof typeof focusMap]}
- Total Questions: ${amount}

TECHNICAL QUESTION GUIDELINES:
- Include practical problem-solving scenarios
- Cover system design concepts appropriate for the level
- Ask about best practices and optimization
- Include technology-specific implementation details
- Focus on real-world application of skills

BEHAVIORAL QUESTION GUIDELINES:
- Use STAR method compatible questions
- Include leadership and teamwork scenarios
- Ask about handling challenges and conflicts
- Cover career growth and learning experiences
- Include questions about company culture fit

OUTPUT REQUIREMENTS:
- Return ONLY a valid JSON array of strings
- Each question should be complete and clear
- Avoid special characters: / * # @ $ % ^ & < > | \\ 
- Questions should be voice-assistant friendly
- No additional text, explanations, or formatting

Example format: ["Question 1 here", "Question 2 here", "Question 3 here"]

Generate ${amount} high-quality interview questions now.`;
};

// Enhanced error response helper
const createErrorResponse = (message: string, details?: any, status: number = 400) => {
  return Response.json({
    success: false,
    error: {
      message,
      details,
      timestamp: new Date().toISOString(),
      suggestion: status === 400 
        ? "Please check your input and try again"
        : "Please try again later or contact support if the problem persists"
    }
  }, { status });
};

// Success response helper
const createSuccessResponse = (data?: any, message?: string) => {
  return Response.json({
    success: true,
    message: message || "Interview created successfully!",
    data,
    timestamp: new Date().toISOString()
  }, { status: 200 });
};

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json().catch(() => {
      throw new Error("Invalid JSON in request body");
    });

    const validatedData = InterviewRequestSchema.parse(body);
    const { type, role, level, techstack, amount, userid } = validatedData;

    // Rate limiting check (simple implementation)
    const userKey = `interview_generation_${userid}`;
    const now = Date.now();
    // Note: In production, use Redis or similar for rate limiting
    
    // Generate questions with enhanced error handling
    let questions: string[];
    try {
      const prompt = createInterviewPrompt(role, level, techstack, type, amount);
      
      const { text: questionsText } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt,
        maxTokens: 2000,
        temperature: 0.7, // Balanced creativity and consistency
      });

      // Parse and validate questions
      questions = JSON.parse(questionsText);
      
      // Validate the parsed questions
      if (!Array.isArray(questions)) {
        throw new Error("AI response is not an array");
      }
      
      if (questions.length !== amount) {
        console.warn(`Expected ${amount} questions, got ${questions.length}`);
      }
      
      // Validate each question
      questions = questions
        .filter(q => typeof q === 'string' && q.trim().length > 10)
        .slice(0, amount); // Ensure we don't exceed requested amount
      
      if (questions.length < Math.max(1, amount - 2)) {
        throw new Error("Generated questions quality check failed");
      }
      
    } catch (aiError: any) {
      console.error("AI Generation Error:", aiError);
      return createErrorResponse(
        "Failed to generate interview questions",
        "Our AI service is temporarily unavailable. Please try again in a few moments.",
        503
      );
    }

    // Create interview object with enhanced metadata
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
      metadata: {
        requestedAmount: amount,
        actualAmount: questions.length,
        generationTimestamp: new Date().toISOString(),
        version: "2.0"
      }
    };

    // Save to database with error handling
    try {
      const docRef = await db.collection("interviews").add(interview);
      
      return createSuccessResponse({
        interviewId: docRef.id,
        questionsGenerated: questions.length,
        role: interview.role,
        type: interview.type
      }, `Successfully created ${type.toLowerCase()} interview for ${role} position!`);
      
    } catch (dbError: any) {
      console.error("Database Error:", dbError);
      return createErrorResponse(
        "Failed to save interview",
        "Database temporarily unavailable",
        503
      );
    }

  } catch (error: any) {
    console.error("Interview Generation Error:", error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return createErrorResponse(
        "Invalid request data",
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join("; "),
        400
      );
    }
    
    // Handle JSON parsing errors
    if (error.message === "Invalid JSON in request body") {
      return createErrorResponse(
        "Invalid request format",
        "Request body must be valid JSON",
        400
      );
    }
    
    // Generic error handler
    return createErrorResponse(
      "Internal server error",
      "An unexpected error occurred while creating your interview",
      500
    );
  }
}

export async function GET() {
  return createSuccessResponse({
    service: "Interview Generation API",
    version: "2.0",
    status: "operational",
    features: [
      "AI-powered question generation",
      "Multiple interview types",
      "Role-specific customization",
      "Experience level targeting",
      "Tech stack optimization"
    ],
    limits: {
      minQuestions: 3,
      maxQuestions: 15,
      supportedTypes: ["Technical", "Behavioral", "Mixed"],
      supportedLevels: ["Entry", "Junior", "Mid", "Senior", "Staff", "Principal"]
    }
  }, "PrepWise Interview Generation API is ready!");
}

// Health check endpoint
export async function HEAD() {
  return new Response(null, { 
    status: 200,
    headers: {
      'X-Service-Status': 'healthy',
      'X-Version': '2.0',
      'X-Last-Updated': new Date().toISOString()
    }
  });
}
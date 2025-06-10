// app/api/llm/route.ts - Language Model API
import { NextRequest, NextResponse } from 'next/server';

interface LLMRequest {
  message: string;
  context?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
  }>;
  systemPrompt?: string;
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  questions?: string[];
  currentQuestionIndex?: number;
  temperature?: number;
  maxTokens?: number;
}

interface LLMResponse {
  success: boolean;
  response?: string;
  nextQuestion?: string;
  isComplete?: boolean;
  suggestions?: string[];
  error?: string;
  metadata?: {
    model: string;
    tokens: number;
    processingTime: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<LLMResponse>> {
  const startTime = Date.now();

  try {
    const body: LLMRequest = await request.json();
    const {
      message,
      context = [],
      systemPrompt,
      interviewType,
      questions = [],
      currentQuestionIndex = 0,
      temperature = 0.7,
      maxTokens = 300
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Build conversation messages
    const messages = [];

    // Add system prompt
    const finalSystemPrompt = systemPrompt || buildSystemPrompt(interviewType, questions, currentQuestionIndex);
    messages.push({
      role: 'system' as const,
      content: finalSystemPrompt
    });

    // Add conversation context (last 10 messages to stay within token limits)
    const recentContext = context.slice(-10);
    messages.push(...recentContext);

    // Add current user message
    messages.push({
      role: 'user' as const,
      content: message
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const result = await response.json();
    const aiResponse = result.choices[0]?.message?.content?.trim() || '';

    // Determine if interview is complete
    const isComplete = questions.length > 0 && currentQuestionIndex >= questions.length;

    // Get next question if applicable
    let nextQuestion = '';
    if (!isComplete && questions.length > 0 && currentQuestionIndex < questions.length) {
      nextQuestion = questions[currentQuestionIndex];
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      response: aiResponse,
      nextQuestion: nextQuestion || undefined,
      isComplete,
      suggestions: generateSuggestions(message, interviewType),
      metadata: {
        model: 'gpt-4o-mini',
        tokens: result.usage?.total_tokens || 0,
        processingTime
      }
    });

  } catch (error: any) {
    console.error('❌ LLM API Error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Language model processing failed',
      metadata: {
        model: 'gpt-4o-mini',
        tokens: 0,
        processingTime
      }
    }, { status: 500 });
  }
}

function buildSystemPrompt(
  interviewType?: string, 
  questions: string[] = [], 
  currentQuestionIndex: number = 0
): string {
  const basePrompt = `You are a professional AI interviewer conducting a ${interviewType || 'comprehensive'} interview. `;
  
  const questionsContext = questions.length > 0 ? `
INTERVIEW QUESTIONS:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

CURRENT PROGRESS: Question ${currentQuestionIndex + 1} of ${questions.length}
` : '';

  const guidelines = `
GUIDELINES:
- Keep responses concise (2-3 sentences max for voice conversation)
- Ask one question at a time and wait for complete responses
- Provide brief acknowledgments ("That's insightful", "Good example")
- If an answer needs clarification, ask a brief follow-up
- For incomplete answers, guide: "Could you elaborate on your role in that?"
- When satisfied with an answer, move to the next question
- Be encouraging and professional throughout
- End responses with clear transitions to keep conversation flowing
`;

  const typeSpecificGuidance = getTypeSpecificGuidance(interviewType);

  return basePrompt + questionsContext + guidelines + typeSpecificGuidance;
}

function getTypeSpecificGuidance(interviewType?: string): string {
  switch (interviewType) {
    case 'technical':
      return `\nTECHNICAL FOCUS: Ask about implementation details, trade-offs, and problem-solving approaches. Probe for specific technologies and methodologies used.`;
    
    case 'behavioral':
      return `\nBEHAVIORAL FOCUS: Use STAR method (Situation, Task, Action, Result). Focus on teamwork, leadership, and conflict resolution experiences.`;
    
    case 'mixed':
      return `\nMIXED APPROACH: Alternate between technical depth and behavioral insights. Adapt questioning style based on current question type.`;
    
    default:
      return `\nGENERAL APPROACH: Maintain professional tone while being supportive. Help candidate showcase their best qualities.`;
  }
}

function generateSuggestions(message: string, interviewType?: string): string[] {
  const suggestions = [];
  
  // General suggestions based on message content
  if (message.length < 50) {
    suggestions.push("Consider providing more specific details");
  }
  
  if (!message.includes('I') && interviewType === 'behavioral') {
    suggestions.push("Focus on your personal role and contributions");
  }
  
  if (interviewType === 'technical' && !/\b(implement|build|design|code|system)\b/i.test(message)) {
    suggestions.push("Include technical implementation details");
  }
  
  return suggestions;
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'language-model',
    provider: 'openai-gpt',
    timestamp: new Date().toISOString(),
  });
}
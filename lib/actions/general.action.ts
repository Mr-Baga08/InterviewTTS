"use server";

import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

import { db } from "@/firebase/admin";
import { feedbackSchema } from "@/constants";

// Enhanced types for better error handling
interface ActionResult<T = undefined> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  code?: string;
  metadata?: {
    timestamp: string;
    processingTime?: number;
    version?: string;
  };
}

// Specific result types for better type safety
interface FeedbackResult {
  feedbackId: string;
  totalScore: number;
  categoriesAnalyzed: number;
  strengthsIdentified: number;
  improvementAreas: number;
}

interface InterviewStatsResult {
  totalInterviews: number;
  averageScore: number;
  improvementTrend: number;
  recentActivity: { date: string; score: number; role: string }[];
}

// Validation schemas
const CreateFeedbackSchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  userId: z.string().min(1, "User ID is required"),
  transcript: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1, "Content cannot be empty")
  })).min(1, "Transcript cannot be empty"),
  feedbackId: z.string().optional()
});

const GetFeedbackSchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  userId: z.string().min(1, "User ID is required")
});

const GetLatestInterviewsSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  limit: z.number().int().min(1).max(50).default(20)
});

// Enhanced prompt engineering for better feedback
const createFeedbackPrompt = (
  formattedTranscript: string,
  interviewContext?: {
    role?: string;
    level?: string;
    type?: string;
    techStack?: string[];
  }
) => {
  const contextSection = interviewContext ? `
Interview Context:
- Role: ${interviewContext.role || 'Not specified'}
- Experience Level: ${interviewContext.level || 'Not specified'}
- Interview Type: ${interviewContext.type || 'Not specified'}
- Tech Stack: ${interviewContext.techStack?.join(', ') || 'Not specified'}
` : '';

  return `${contextSection}

You are a senior technical interviewer with 15+ years of experience conducting interviews at top tech companies. Your task is to provide comprehensive, actionable feedback on this mock interview.

ANALYSIS GUIDELINES:
- Be thorough but constructive in your evaluation
- Provide specific examples from the transcript when possible
- Consider the role and experience level in your assessment
- Focus on actionable improvements rather than just criticism
- Score fairly but maintain high standards

TRANSCRIPT:
${formattedTranscript}

SCORING CRITERIA (0-100 scale):
- **Communication Skills**: Clarity, articulation, structured responses, active listening
- **Technical Knowledge**: Depth of understanding, accuracy, relevant experience
- **Problem-Solving**: Analytical thinking, systematic approach, creativity
- **Cultural & Role Fit**: Values alignment, collaboration, leadership potential
- **Confidence & Clarity**: Self-assurance, engagement, clear explanations

FEEDBACK REQUIREMENTS:
- Provide 3-5 specific strengths with examples
- Identify 3-5 areas for improvement with actionable advice
- Write a comprehensive final assessment (100-200 words)
- Ensure total score reflects overall performance accurately
- Be encouraging while maintaining professional standards`;
};

// Performance monitoring utilities
const performanceTimer = () => {
  const start = Date.now();
  return () => Date.now() - start;
};

// Enhanced error helper with proper typing
const createActionResult = <T = undefined>(
  success: boolean,
  message: string,
  data?: T,
  errors?: string[],
  code?: string,
  processingTime?: number
): ActionResult<T> => ({
  success,
  message,
  ...(data !== undefined && { data }),
  ...(errors && { errors }),
  ...(code && { code }),
  metadata: {
    timestamp: new Date().toISOString(),
    ...(processingTime !== undefined && { processingTime }),
    version: "2.0"
  }
});

export async function createFeedback(
  params: CreateFeedbackParams
): Promise<ActionResult<FeedbackResult>> {
  const timer = performanceTimer();
  
  try {
    // Validate input parameters
    const validatedParams = CreateFeedbackSchema.parse(params);
    const { interviewId, userId, transcript, feedbackId } = validatedParams;

    // Verify interview exists and get context
    let interviewContext;
    try {
      const interviewDoc = await db.collection("interviews").doc(interviewId).get();
      if (!interviewDoc.exists) {
        return createActionResult<FeedbackResult>(
          false,
          "Interview not found",
          undefined,
          ["The specified interview does not exist"],
          "INTERVIEW_NOT_FOUND"
        );
      }
      interviewContext = interviewDoc.data();
    } catch (error) {
      console.error("Error fetching interview context:", error);
      // Continue without context - not critical for feedback generation
    }

    // Format transcript with better structure
    const formattedTranscript = transcript
      .map((sentence, index) => {
        const speaker = sentence.role === "user" ? "Candidate" : 
                      sentence.role === "assistant" ? "Interviewer" : "System";
        return `${index + 1}. ${speaker}: ${sentence.content.trim()}`;
      })
      .join("\n");

    // Validate transcript quality
    if (formattedTranscript.length < 100) {
      return createActionResult<FeedbackResult>(
        false,
        "Transcript too short for meaningful analysis",
        undefined,
        ["Please ensure the interview session is substantial enough for evaluation"],
        "INSUFFICIENT_TRANSCRIPT"
      );
    }

    // Generate AI feedback with enhanced error handling
    let feedbackObject;
    try {
      const prompt = createFeedbackPrompt(formattedTranscript, interviewContext);
      
      const { object } = await generateObject({
        model: google("gemini-2.0-flash-001", {
          structuredOutputs: false,
        }),
        schema: feedbackSchema,
        prompt,
        system: "You are a professional senior interviewer with expertise in technical and behavioral assessment. Provide detailed, constructive feedback that helps candidates improve their interview performance.",
        maxTokens: 3000,
        temperature: 0.3 // Lower temperature for more consistent feedback
      });

      feedbackObject = object;

      // Validate AI response quality
      if (!feedbackObject.totalScore || feedbackObject.totalScore < 0 || feedbackObject.totalScore > 100) {
        throw new Error("Invalid total score generated");
      }

      if (!feedbackObject.categoryScores || feedbackObject.categoryScores.length !== 5) {
        throw new Error("Invalid category scores generated");
      }

      if (!feedbackObject.finalAssessment || feedbackObject.finalAssessment.length < 50) {
        throw new Error("Final assessment too brief");
      }

    } catch (aiError: any) {
      console.error("AI feedback generation error:", aiError);
      return createActionResult<FeedbackResult>(
        false,
        "Unable to generate feedback analysis",
        undefined,
        ["Our AI analysis service is temporarily unavailable", "Please try again in a few moments"],
        "AI_GENERATION_FAILED",
        timer()
      );
    }

    // Create comprehensive feedback object
    const feedback = {
      interviewId,
      userId,
      totalScore: Math.round(feedbackObject.totalScore),
      categoryScores: feedbackObject.categoryScores.map(category => ({
        ...category,
        score: Math.round(category.score)
      })),
      strengths: feedbackObject.strengths.filter(s => s && s.trim().length > 0),
      areasForImprovement: feedbackObject.areasForImprovement.filter(a => a && a.trim().length > 0),
      finalAssessment: feedbackObject.finalAssessment.trim(),
      createdAt: new Date().toISOString(),
      metadata: {
        transcriptLength: formattedTranscript.length,
        transcriptMessages: transcript.length,
        aiModel: "gemini-2.0-flash-001",
        version: "2.0",
        interviewContext: interviewContext ? {
          role: interviewContext.role,
          level: interviewContext.level,
          type: interviewContext.type
        } : null
      }
    };

    // Save to database with enhanced error handling
    try {
      let feedbackRef;
      
      if (feedbackId) {
        feedbackRef = db.collection("feedback").doc(feedbackId);
        await feedbackRef.set(feedback, { merge: true });
      } else {
        feedbackRef = db.collection("feedback").doc();
        await feedbackRef.set(feedback);
      }

      // Update user statistics
      await updateUserStats(userId, feedback.totalScore);

      const processingTime = timer();
      
      return createActionResult<FeedbackResult>(
        true,
        "Feedback generated successfully",
        { 
          feedbackId: feedbackRef.id, 
          totalScore: feedback.totalScore,
          categoriesAnalyzed: feedback.categoryScores.length,
          strengthsIdentified: feedback.strengths.length,
          improvementAreas: feedback.areasForImprovement.length
        },
        undefined,
        undefined,
        processingTime
      );

    } catch (dbError: any) {
      console.error("Database error saving feedback:", dbError);
      return createActionResult<FeedbackResult>(
        false,
        "Failed to save feedback analysis",
        undefined,
        ["Database temporarily unavailable", "Your analysis was completed but could not be saved"],
        "DATABASE_ERROR",
        timer()
      );
    }

  } catch (error: any) {
    console.error("Create feedback error:", error);
    
    if (error instanceof z.ZodError) {
      return createActionResult<FeedbackResult>(
        false,
        "Invalid feedback parameters",
        undefined,
        error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
        "VALIDATION_ERROR",
        timer()
      );
    }

    return createActionResult<FeedbackResult>(
      false,
      "Failed to create feedback",
      undefined,
      ["An unexpected error occurred during feedback generation"],
      "UNKNOWN_ERROR",
      timer()
    );
  }
}

// Helper function to update user statistics
async function updateUserStats(userId: string, score: number): Promise<void> {
  try {
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentStats = userData?.stats || {};
      
      const newStats = {
        interviewsCompleted: (currentStats.interviewsCompleted || 0) + 1,
        totalScore: (currentStats.totalScore || 0) + score,
        averageScore: Math.round(((currentStats.totalScore || 0) + score) / ((currentStats.interviewsCompleted || 0) + 1)),
        lastInterviewScore: score,
        lastInterviewDate: new Date().toISOString()
      };

      await userRef.update({
        stats: newStats,
        updatedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.warn("Failed to update user stats:", error);
    // Non-critical error, don't throw
  }
}

export async function getInterviewById(id: string): Promise<ActionResult<Interview>> {
  const timer = performanceTimer();
  
  try {
    if (!id || id.trim().length === 0) {
      return createActionResult<Interview>(
        false,
        "Interview ID is required",
        undefined,
        ["Please provide a valid interview ID"],
        "INVALID_ID",
        timer()
      );
    }

    const interviewDoc = await db.collection("interviews").doc(id.trim()).get();
    
    if (!interviewDoc.exists) {
      return createActionResult<Interview>(
        false,
        "Interview not found",
        undefined,
        ["The requested interview does not exist or has been deleted"],
        "NOT_FOUND",
        timer()
      );
    }

    const interviewData = { id: interviewDoc.id, ...interviewDoc.data() } as Interview;
    
    return createActionResult<Interview>(
      true,
      "Interview retrieved successfully",
      interviewData,
      undefined,
      undefined,
      timer()
    );

  } catch (error: any) {
    console.error("Get interview error:", error);
    return createActionResult<Interview>(
      false,
      "Failed to retrieve interview",
      undefined,
      ["Database temporarily unavailable"],
      "DATABASE_ERROR",
      timer()
    );
  }
}

export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<ActionResult<Feedback>> {
  const timer = performanceTimer();
  
  try {
    const validatedParams = GetFeedbackSchema.parse(params);
    const { interviewId, userId } = validatedParams;

    const querySnapshot = await db
      .collection("feedback")
      .where("interviewId", "==", interviewId)
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return createActionResult<Feedback>(
        false,
        "No feedback found",
        undefined,
        ["Feedback has not been generated for this interview yet"],
        "NOT_FOUND",
        timer()
      );
    }

    const feedbackDoc = querySnapshot.docs[0];
    const feedbackData = { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;

    return createActionResult<Feedback>(
      true,
      "Feedback retrieved successfully",
      feedbackData,
      undefined,
      undefined,
      timer()
    );

  } catch (error: any) {
    console.error("Get feedback error:", error);
    
    if (error instanceof z.ZodError) {
      return createActionResult<Feedback>(
        false,
        "Invalid parameters",
        undefined,
        error.errors.map(e => e.message),
        "VALIDATION_ERROR",
        timer()
      );
    }

    return createActionResult<Feedback>(
      false,
      "Failed to retrieve feedback",
      undefined,
      ["Database temporarily unavailable"],
      "DATABASE_ERROR",
      timer()
    );
  }
}

export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<ActionResult<Interview[]>> {
  const timer = performanceTimer();
  
  try {
    const validatedParams = GetLatestInterviewsSchema.parse(params);
    const { userId, limit } = validatedParams;

    const querySnapshot = await db
      .collection("interviews")
      .where("finalized", "==", true)
      .where("userId", "!=", userId)
      .orderBy("userId") // Required for != queries
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    const interviews = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];

    // Re-sort by createdAt since we had to order by userId first
    interviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return createActionResult<Interview[]>(
      true,
      `Retrieved ${interviews.length} interviews`,
      interviews,
      undefined,
      undefined,
      timer()
    );

  } catch (error: any) {
    console.error("Get latest interviews error:", error);
    
    if (error instanceof z.ZodError) {
      return createActionResult<Interview[]>(
        false,
        "Invalid parameters",
        undefined,
        error.errors.map(e => e.message),
        "VALIDATION_ERROR",
        timer()
      );
    }

    return createActionResult<Interview[]>(
      false,
      "Failed to retrieve interviews",
      undefined,
      ["Database temporarily unavailable"],
      "DATABASE_ERROR",
      timer()
    );
  }
}

export async function getInterviewsByUserId(
  userId: string
): Promise<ActionResult<Interview[]>> {
  const timer = performanceTimer();
  
  try {
    if (!userId || userId.trim().length === 0) {
      return createActionResult<Interview[]>(
        false,
        "User ID is required",
        undefined,
        ["Please provide a valid user ID"],
        "INVALID_USER_ID",
        timer()
      );
    }

    const querySnapshot = await db
      .collection("interviews")
      .where("userId", "==", userId.trim())
      .orderBy("createdAt", "desc")
      .get();

    const interviews = querySnapshot.docs.map((doc: { id: any; data: () => any; }) => ({
      id: doc.id,
      ...doc.data(),
    })) as Interview[];

    return createActionResult<Interview[]>(
      true,
      `Retrieved ${interviews.length} user interviews`,
      interviews,
      undefined,
      undefined,
      timer()
    );

  } catch (error: any) {
    console.error("Get user interviews error:", error);
    return createActionResult<Interview[]>(
      false,
      "Failed to retrieve user interviews",
      undefined,
      ["Database temporarily unavailable"],
      "DATABASE_ERROR",
      timer()
    );
  }
}

// Additional utility functions
export async function getInterviewStats(userId: string): Promise<ActionResult<InterviewStatsResult>> {
  const timer = performanceTimer();
  
  try {
    // Get user interviews
    const interviewsResult = await getInterviewsByUserId(userId);
    if (!interviewsResult.success || !interviewsResult.data) {
      return createActionResult<InterviewStatsResult>(
        false,
        "Failed to retrieve interview data",
        undefined,
        undefined,
        "DATA_UNAVAILABLE",
        timer()
      );
    }

    const interviews = interviewsResult.data;
    
    // Get feedback for recent interviews
    const recentFeedback = await Promise.all(
      interviews.slice(0, 10).map(async (interview) => {
        try {
          const feedbackResult = await getFeedbackByInterviewId({
            interviewId: interview.id,
            userId
          });
          return feedbackResult.success ? {
            date: interview.createdAt,
            score: feedbackResult.data!.totalScore,
            role: interview.role
          } : null;
        } catch {
          return null;
        }
      })
    );

    const validFeedback = recentFeedback.filter(Boolean) as { date: string; score: number; role: string }[];
    
    // Calculate statistics
    const totalInterviews = interviews.length;
    const averageScore = validFeedback.length > 0 
      ? Math.round(validFeedback.reduce((sum, f) => sum + f.score, 0) / validFeedback.length)
      : 0;
    
    // Calculate improvement trend (comparing first half vs second half of recent interviews)
    let improvementTrend = 0;
    if (validFeedback.length >= 4) {
      const mid = Math.floor(validFeedback.length / 2);
      const recentAvg = validFeedback.slice(0, mid).reduce((sum, f) => sum + f.score, 0) / mid;
      const olderAvg = validFeedback.slice(mid).reduce((sum, f) => sum + f.score, 0) / (validFeedback.length - mid);
      improvementTrend = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
    }

    return createActionResult<InterviewStatsResult>(
      true,
      "Statistics calculated successfully",
      {
        totalInterviews,
        averageScore,
        improvementTrend,
        recentActivity: validFeedback.slice(0, 5)
      },
      undefined,
      undefined,
      timer()
    );

  } catch (error: any) {
    console.error("Get interview stats error:", error);
    return createActionResult<InterviewStatsResult>(
      false,
      "Failed to calculate statistics",
      undefined,
      ["Unable to process interview data"],
      "CALCULATION_ERROR",
      timer()
    );
  }
}
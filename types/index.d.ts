/* ==========================================================================
   ENHANCED TYPESCRIPT TYPES FOR THETRUTHSCHOOL.AI
   ========================================================================== */

   import { z } from "zod";

   /* ==========================================================================
      CORE DOMAIN TYPES
      ========================================================================== */
   
   // Base entity interface for all database entities
   interface BaseEntity {
     id: string;
     createdAt: string;
     updatedAt: string;
     version?: number;
   }
   
   // Enhanced User interface with comprehensive profile data
   export interface User extends BaseEntity {
     // Core identity
     name: string;
     email: string;
     avatar?: string;
     
     // Profile information
     profile?: {
       firstName?: string;
       lastName?: string;
       bio?: string;
       location?: string;
       website?: string;
       linkedin?: string;
       github?: string;
       portfolio?: string;
       timezone?: string;
       preferredLanguage?: string;
       isEmailVerified?: boolean;
       onboardingCompleted?: boolean;
       preferences?: {
         emailNotifications: boolean;
         interviewReminders: boolean;
         progressReports: boolean;
       };
     };
     
     // Career information
     career?: {
       currentRole?: string;
       experienceLevel?: ExperienceLevel;
       industries?: string[];
       skills?: string[];
       targetRoles?: string[];
       salaryRange?: {
         min: number;
         max: number;
         currency: string;
       };
     };
     
     // Statistics and progress
     stats?: {
       interviewsCompleted: number;
       totalPracticeTime: number; // in minutes
       averageScore: number;
       bestScore: number;
       streak: number; // consecutive days with practice
       lastActiveDate?: string;
       skillProgression?: Record<string, number>; // skill -> proficiency score
     };
     
     // Account status
     subscription?: {
       plan: "free" | "pro" | "enterprise";
       status: "active" | "canceled" | "expired";
       expiresAt?: string;
       features: string[];
     };
     
     // Security and audit
     security?: {
       emailVerified: boolean;
       lastLoginAt?: string;
       lastLoginIP?: string;
       twoFactorEnabled: boolean;
       passwordChangedAt?: string;
     };
   
     // Session info
     sessionExpires?: string;
     
     // Metadata
     metadata?: {
       signUpMethod?: string;
       version?: string;
     };
   }
   
   // Enhanced Interview interface with comprehensive metadata
   export interface Interview extends BaseEntity {
     // Core interview data
     role: string;
     level: ExperienceLevel;
     type: InterviewType;
     questions: InterviewQuestion[] | string[]; // Support both formats
     techstack: string[];
     userId: string;
     finalized: boolean;
     
     // Enhanced metadata
     metadata?: {
       difficulty?: QuestionDifficulty;
       estimatedDuration?: number; // in minutes
       industry?: string;
       companySize?: CompanySize;
       focus?: string[]; // Focus areas like "System Design", "Leadership"
       generatedBy?: "AI" | "Manual" | "Template";
       templateId?: string;
       version?: string;
       requestedAmount?: number;
       actualAmount?: number;
       processingTime?: number;
       userAgent?: string;
       clientIP?: string;
     };
     
     // Status and lifecycle
     status?: InterviewStatus;
     tags?: string[];
     coverImage?: string;
     estimatedDuration?: number;
     
     // Analytics and tracking
     analytics?: {
       viewCount: number;
       completionCount: number;
       averageScore?: number;
       popularityScore: number;
       lastAccessedAt?: string;
     };
     
     // Content organization
     organization?: {
       category?: string;
       subcategory?: string;
       isPublic?: boolean;
       isFeatured?: boolean;
       approvalStatus?: "pending" | "approved" | "rejected";
     };
   }
   
   // Enhanced Feedback interface with detailed analytics
   export interface Feedback extends BaseEntity {
     // Core feedback data
     interviewId: string;
     userId: string;
     totalScore: number;
     categoryScores: CategoryScore[];
     strengths: string[];
     areasForImprovement: string[];
     finalAssessment: string;
     
     // Enhanced insights
     insights?: {
       performanceLevel: PerformanceLevel;
       readinessScore: number; // 0-100, how ready for real interviews
       keyTakeaways: string[];
       nextSteps: string[];
       confidenceLevel: "Low" | "Medium" | "High";
       improvementPriority: "Technical" | "Behavioral" | "Communication" | "Mixed";
     };
     
     // Interview session data
     session?: {
       duration: number; // actual interview duration in minutes
       questionCount: number;
       completionRate: number; // percentage of questions answered
       averageResponseTime: number; // seconds per response
       pauseCount: number;
       reconnectionCount: number;
     };
     
     // Transcript and analysis
     transcript?: TranscriptMessage[];
     transcriptAnalysis?: {
       wordCount: number;
       averageWordsPerResponse: number;
       sentimentScore: number; // -1 to 1
       clarityScore: number; // 0-100
       confidenceIndicators: string[];
       communicationPatterns: string[];
     };
     
     // AI analysis metadata
     aiAnalysis?: {
       model: string;
       version: string;
       confidence: number; // 0-1, AI's confidence in the assessment
       processingTime: number;
       tokens?: {
         input: number;
         output: number;
       };
     };
     
     // Comparison and benchmarking
     benchmarks?: {
       industryAverage?: number;
       roleAverage?: number;
       levelAverage?: number;
       percentile?: number; // 0-100, where user stands compared to others
     };
   }
   
   /* ==========================================================================
      SUPPORTING TYPES AND ENUMS
      ========================================================================== */
   
   export type InterviewType = 
     | "Technical" 
     | "Behavioral" 
     | "Mixed" 
     | "System Design" 
     | "Coding" 
     | "Cultural Fit"
     | "Leadership"
     | "Product Management"
     | "Sales"
     | "Marketing";
   
   export type ExperienceLevel = 
     | "Entry" 
     | "Junior" 
     | "Mid" 
     | "Senior" 
     | "Staff" 
     | "Principal" 
     | "Director" 
     | "VP" 
     | "C-Level";
   
   export type QuestionDifficulty = 
     | "Easy" 
     | "Medium" 
     | "Hard" 
     | "Expert";
   
   export type InterviewStatus = 
     | "draft" 
     | "active" 
     | "completed" 
     | "archived" 
     | "deleted"
     | "in-progress";
   
   export type PerformanceLevel = 
     | "Exceptional" 
     | "Strong" 
     | "Good" 
     | "Fair" 
     | "Needs Improvement";
   
   export type CompanySize = 
     | "Startup" 
     | "SME" 
     | "Enterprise" 
     | "Fortune 500";
   
   export type FormType = 
     | "sign-in" 
     | "sign-up" 
     | "forgot-password" 
     | "reset-password";
   
   /* ==========================================================================
      DETAILED COMPONENT INTERFACES
      ========================================================================== */
   
   export interface InterviewQuestion {
     id?: string;
     question: string;
     type?: "technical" | "behavioral" | "situational" | "hypothetical";
     difficulty?: QuestionDifficulty;
     category?: string;
     skills?: string[]; // Skills this question tests
     expectedDuration?: number; // Expected time to answer in minutes
     followUpQuestions?: string[];
     hints?: string[];
     idealAnswer?: {
       keyPoints: string[];
       structure: string;
       examples: string[];
     };
   }
   
   export interface CategoryScore {
     name: string;
     score: number;
     comment: string;
     strengths?: string[];
     improvements?: string[];
     weight?: number; // Weight in overall score calculation
     subcategories?: {
       name: string;
       score: number;
       comment: string;
     }[];
   }
   
   export interface TranscriptMessage {
     id: string;
     role: "user" | "assistant" | "system";
     content: string;
     timestamp: number;
     duration?: number; // For voice messages
     confidence?: number; // Transcription confidence
     sentiment?: "positive" | "neutral" | "negative";
     metadata?: {
       pauseDuration?: number;
       volume?: number;
       clarity?: number;
     };
   }
   
   /* ==========================================================================
      API AND FORM INTERFACES
      ========================================================================== */
   
   export interface CreateFeedbackParams {
     interviewId: string;
     userId: string;
     transcript: TranscriptMessage[];
     feedbackId?: string;
     sessionMetrics?: {
       duration: number;
       pauseCount: number;
       reconnectionCount: number;
       averageResponseTime: number;
     };
     additionalContext?: {
       userNotes?: string;
       technicalIssues?: string[];
       interviewerFeedback?: string;
     };
   }
   
   export interface GetFeedbackByInterviewIdParams {
     interviewId: string;
     userId: string;
     includeTranscript?: boolean;
     includeBenchmarks?: boolean;
   }
   
   export interface GetLatestInterviewsParams {
     userId: string;
     limit?: number;
     type?: InterviewType;
     level?: ExperienceLevel;
     status?: InterviewStatus;
     sortBy?: "createdAt" | "updatedAt" | "popularityScore" | "averageScore";
     sortOrder?: "asc" | "desc";
     filters?: {
       techstack?: string[];
       difficulty?: QuestionDifficulty;
       industry?: string;
       hasCompletion?: boolean;
     };
   }
   
   export interface CreateInterviewParams {
     role: string;
     level: ExperienceLevel;
     type: InterviewType;
     techstack: string;
     amount: number;
     userId: string;
     difficulty?: QuestionDifficulty;
     focus?: string[];
     industry?: string;
     companySize?: CompanySize;
     customInstructions?: string;
   }
   
   /* ==========================================================================
      AUTHENTICATION INTERFACES
      ========================================================================== */
   
   export interface SignInParams {
     email: string;
     idToken: string;
     rememberMe?: boolean;
     userAgent?: string;
     ipAddress?: string;
     deviceInfo?: {
       userAgent: string;
       platform: string;
       ipAddress?: string;
     };
   }
   
   export interface SignUpParams {
     uid: string;
     name: string;
     email: string;
     password: string;
     agreedToTerms?: boolean;
     marketingConsent?: boolean;
     referralCode?: string;
     initialPreferences?: {
       experienceLevel?: ExperienceLevel;
       targetRoles?: string[];
       interests?: string[];
     };
   }
   
   export interface AuthResult {
     success: boolean;
     message: string;
     user?: User;
     token?: string;
     refreshToken?: string;
     expiresAt?: string;
     errors?: string[];
     code?: string;
     data?: any;
     metadata?: {
       sessionId?: string;
       deviceId?: string;
       ipAddress?: string;
       timestamp?: string;
       requestId?: string;
       version?: string;
     };
   }
   
   /* ==========================================================================
      COMPONENT PROP INTERFACES
      ========================================================================== */
   
   // Backward compatible InterviewCardProps
   export interface InterviewCardProps {
     // Required props (backward compatible)
     role: string;
     type: string; // Changed from InterviewType to string for compatibility
     techstack: string[];
     
     // Optional data props
     interviewId?: string;
     userId?: string;
     createdAt?: string;
     feedback?: any; // Made flexible for backward compatibility
     
     // Display configuration
     variant?: "default" | "compact" | "featured" | "list";
     showProgress?: boolean;
     showActions?: boolean;
     showMetadata?: boolean;
     
     // Interaction handlers
     onView?: (interviewId: string) => void;
     onRetake?: (interviewId: string) => void;
     onShare?: (interviewId: string) => void;
     onDelete?: (interviewId: string) => void;
     
     // Styling
     className?: string;
     style?: React.CSSProperties;
     isLoading?: boolean;
     isDisabled?: boolean;
   }
   
   // Agent component props
   export interface AgentProps {
     // Core configuration
     userName: string;
     userId?: string; // Made optional for backward compatibility
     type: "generate" | "interview" | "practice";
     
     // Interview configuration
     interviewId?: string;
     feedbackId?: string;
     questions?: string[]; // Simplified for backward compatibility
     
     // AI Configuration
     aiConfig?: {
       model?: string;
       temperature?: number;
       maxTokens?: number;
       systemPrompt?: string;
     };
     
     // Interaction callbacks
     onStatusChange?: (status: CallStatus) => void;
     onTranscriptUpdate?: (transcript: TranscriptMessage[]) => void;
     onError?: (error: Error) => void;
     onComplete?: (feedback: Feedback) => void;
     
     // Feature flags
     features?: {
       pauseResume?: boolean;
       realTimeTranscript?: boolean;
       backgroundNoise?: boolean;
       multiLanguage?: boolean;
     };
     
     // Styling and layout
     variant?: "default" | "compact" | "fullscreen";
     showTranscript?: boolean;
     showMetrics?: boolean;
     className?: string;
   }
   
   export interface TechIconProps {
     techStack: string[];
     maxIcons?: number;
     size?: "xs" | "sm" | "md" | "lg" | "xl";
     variant?: "circular" | "square" | "minimal";
     showTooltip?: boolean;
     showOverflow?: boolean;
     interactive?: boolean;
     className?: string;
     iconClassName?: string;
     onTechClick?: (tech: string) => void;
   }
   
   export interface InterviewFormProps {
     // Core interview data
     interviewId?: string;
     role: string;
     level: string; // Simplified for backward compatibility
     type: string; // Simplified for backward compatibility
     techstack: string[];
     amount: number;
     
     // Extended configuration
     difficulty?: QuestionDifficulty;
     industry?: string;
     focus?: string[];
     
     // Form configuration
     mode?: "create" | "edit" | "view";
     onSubmit?: (data: any) => void; // Simplified for backward compatibility
     onCancel?: () => void;
     onSave?: (data: any) => void; // Simplified for backward compatibility
     
     // Validation and state
     errors?: Record<string, string>;
     isLoading?: boolean;
     isSubmitting?: boolean;
     
     // Styling
     className?: string;
     variant?: "default" | "modal" | "sidebar";
   }
   
   /* ==========================================================================
      UTILITY AND ROUTING TYPES
      ========================================================================== */
   
   export interface RouteParams {
     params: Promise<Record<string, string>>;
     searchParams?: Promise<Record<string, string>>;
   }
   
   export interface ApiResponse<T = any> {
     success: boolean;
     message: string;
     data?: T;
     error?: {
       code: string;
       message: string;
       details?: any;
       field?: string;
     };
     errors?: string[];
     code?: string;
     metadata?: {
       timestamp: string;
       requestId: string;
       version: string;
       processingTime?: number;
       pagination?: {
         page: number;
         limit: number;
         total: number;
         hasNext: boolean;
         hasPrev: boolean;
       };
     };
   }
   
   export interface PaginationParams {
     page?: number;
     limit?: number;
     offset?: number;
   }
   
   export interface SortParams {
     sortBy?: string;
     sortOrder?: "asc" | "desc";
   }
   
   export interface FilterParams {
     startDate?: string;
     endDate?: string;
     status?: string[];
     type?: string[];
     [key: string]: any;
   }
   
   /* ==========================================================================
      CALL STATUS AND REAL-TIME TYPES
      ========================================================================== */
   
   export enum CallStatus {
     INACTIVE = "INACTIVE",
     CONNECTING = "CONNECTING",
     ACTIVE = "ACTIVE",
     PAUSED = "PAUSED",
     RECONNECTING = "RECONNECTING",
     FINISHED = "FINISHED",
     ERROR = "ERROR",
   }
   
   export interface CallMetrics {
     duration: number;
     messageCount: number;
     userSpeakTime: number;
     assistantSpeakTime: number;
     pauseTime: number;
     qualityScore: number;
     reconnectionCount: number;
   }
   
   export interface VoiceSettings {
     provider: "11labs" | "azure" | "google";
     voiceId: string;
     speed: number;
     pitch: number;
     stability: number;
     clarity: number;
     language: string;
   }
   
   /* ==========================================================================
      ENHANCED ACTION RESULT TYPES
      ========================================================================== */
   
   export interface ActionResult<T = any> {
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
   export interface FeedbackResult {
     feedbackId: string;
     totalScore: number;
     categoriesAnalyzed: number;
     strengthsIdentified: number;
     improvementAreas: number;
   }
   
   /* ==========================================================================
      ANALYTICS AND REPORTING TYPES
      ========================================================================== */
   
   export interface AnalyticsEvent {
     id: string;
     userId: string;
     event: string;
     properties: Record<string, any>;
     timestamp: string;
     sessionId?: string;
     deviceInfo?: {
       userAgent: string;
       platform: string;
       screenResolution: string;
     };
   }
   
   export interface PerformanceReport {
     userId: string;
     timeframe: {
       start: string;
       end: string;
     };
     metrics: {
       interviewsCompleted: number;
       averageScore: number;
       improvementRate: number;
       streakDays: number;
       totalPracticeTime: number;
     };
     breakdown: {
       byType: Record<InterviewType, number>;
       byLevel: Record<ExperienceLevel, number>;
       bySkill: Record<string, number>;
     };
     trends: {
       scoreProgression: { date: string; score: number }[];
       skillProgression: Record<string, { date: string; score: number }[]>;
     };
     recommendations: string[];
   }
   
   /* ==========================================================================
      VALIDATION SCHEMAS (ZOD)
      ========================================================================== */
   
   export const UserSchema = z.object({
     name: z.string().min(2).max(100),
     email: z.string().email(),
     avatar: z.string().url().optional(),
     profile: z.object({
       bio: z.string().max(500).optional(),
       location: z.string().max(100).optional(),
       website: z.string().url().optional(),
     }).optional(),
     preferences: z.object({
       emailNotifications: z.boolean().default(true),
       interviewReminders: z.boolean().default(true),
       theme: z.enum(["light", "dark", "system"]).default("system"),
     }).optional(),
   });
   
   export const InterviewSchema = z.object({
     role: z.string().min(2).max(100),
     level: z.enum(["Entry", "Junior", "Mid", "Senior", "Staff", "Principal", "Director"]),
     type: z.enum(["Technical", "Behavioral", "Mixed", "System Design", "Coding"]),
     techstack: z.array(z.string()).min(1).max(10),
     questions: z.array(z.string()).min(3).max(15),
     difficulty: z.enum(["Easy", "Medium", "Hard", "Expert"]).default("Medium"),
   });
   
   export const FeedbackSchema = z.object({
     totalScore: z.number().min(0).max(100),
     categoryScores: z.array(z.object({
       name: z.string(),
       score: z.number().min(0).max(100),
       comment: z.string().min(10),
     })),
     strengths: z.array(z.string()).min(1),
     areasForImprovement: z.array(z.string()).min(1),
     finalAssessment: z.string().min(50),
   });
   
   /* ==========================================================================
      TYPE UTILITIES AND HELPERS
      ========================================================================== */
   
   // Utility types for partial updates
   export type PartialUser = Partial<User>;
   export type PartialInterview = Partial<Interview>;
   export type PartialFeedback = Partial<Feedback>;
   
   // Utility types for creating new entities
   export type CreateUser = Omit<User, keyof BaseEntity | "stats" | "security">;
   export type CreateInterview = Omit<Interview, keyof BaseEntity | "analytics">;
   export type CreateFeedback = Omit<Feedback, keyof BaseEntity | "benchmarks">;
   
   // Utility types for API responses
   export type UserResponse = ApiResponse<User>;
   export type InterviewResponse = ApiResponse<Interview>;
   export type FeedbackResponse = ApiResponse<Feedback>;
   export type InterviewListResponse = ApiResponse<Interview[]>;
   
   // Utility types for form handling
   export type FormErrors<T> = Partial<Record<keyof T, string>>;
   export type FormState<T> = {
     data: T;
     errors: FormErrors<T>;
     isSubmitting: boolean;
     isValid: boolean;
   };
   
   /* ==========================================================================
      EXPORTS
      ========================================================================== */
   
   // Re-export commonly used types
   export type {
     BaseEntity,
     CreateUser,
     CreateInterview, 
     CreateFeedback,
     PartialUser,
     PartialInterview,
     PartialFeedback,
     FormErrors,
     FormState,
   };
   
   // Legacy type aliases for backward compatibility
   export type { InterviewCardProps as EnhancedInterviewCardProps };
   export type { InterviewType as InterviewVariant };
   export type { PerformanceLevel };
   
   // Default export for the main types
   export default {
     User,
     Interview,
     Feedback,
     TranscriptMessage,
     CallStatus,
     InterviewType,
     ExperienceLevel,
     QuestionDifficulty,
     FormType,
     ActionResult,
   };
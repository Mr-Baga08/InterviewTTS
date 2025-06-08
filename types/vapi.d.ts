/* ==========================================================================
   ENHANCED VAPI TYPES FOR THETRUTHSCHOOL.AI
   ========================================================================== */

   import { z } from "zod";

   /* ==========================================================================
      CORE ENUMS WITH ENHANCED VALUES
      ========================================================================== */
   
   export enum MessageTypeEnum {
     // Core message types
     TRANSCRIPT = "transcript",
     FUNCTION_CALL = "function-call",
     FUNCTION_CALL_RESULT = "function-call-result",
     ADD_MESSAGE = "add-message",
     
     // Enhanced message types for better functionality
     SPEECH_START = "speech-start",
     SPEECH_END = "speech-end",
     CONVERSATION_UPDATE = "conversation-update",
     TOOL_CALL = "tool-call",
     TOOL_RESULT = "tool-result",
     ERROR = "error",
     WARNING = "warning",
     INFO = "info",
     
     // Interview-specific message types
     INTERVIEW_START = "interview-start",
     INTERVIEW_END = "interview-end",
     QUESTION_START = "question-start",
     QUESTION_END = "question-end",
     EVALUATION_UPDATE = "evaluation-update",
     HINT_PROVIDED = "hint-provided",
     
     // Session management
     SESSION_START = "session-start",
     SESSION_PAUSE = "session-pause",
     SESSION_RESUME = "session-resume",
     SESSION_END = "session-end",
     HEARTBEAT = "heartbeat",
     PING = "ping",
     PONG = "pong",
   }
   
   export enum MessageRoleEnum {
     USER = "user",
     SYSTEM = "system", 
     ASSISTANT = "assistant",
     INTERVIEWER = "interviewer", // Specific to interview context
     CANDIDATE = "candidate",     // Specific to interview context
     TOOL = "tool",              // For tool/function responses
     MODERATOR = "moderator",    // For session management
   }
   
   export enum TranscriptMessageTypeEnum {
     PARTIAL = "partial",
     FINAL = "final",
     INTERIM = "interim",        // Intermediate partial results
     CORRECTED = "corrected",    // Corrected previous transcript
     PUNCTUATED = "punctuated",  // Added punctuation
   }
   
   export enum CallStatusEnum {
     INACTIVE = "inactive",
     CONNECTING = "connecting",
     CONNECTED = "connected",
     ACTIVE = "active",
     PAUSED = "paused",
     RESUMING = "resuming",
     ENDING = "ending",
     ENDED = "ended",
     FAILED = "failed",
     RECONNECTING = "reconnecting",
     TIMEOUT = "timeout",
   }
   
   export enum ErrorTypeEnum {
     CONNECTION_ERROR = "connection-error",
     AUTHENTICATION_ERROR = "authentication-error",
     RATE_LIMIT_ERROR = "rate-limit-error",
     TRANSCRIPTION_ERROR = "transcription-error",
     AI_ERROR = "ai-error",
     FUNCTION_ERROR = "function-error",
     VALIDATION_ERROR = "validation-error",
     TIMEOUT_ERROR = "timeout-error",
     UNKNOWN_ERROR = "unknown-error",
   }
   
   export enum AudioQualityEnum {
     EXCELLENT = "excellent",
     GOOD = "good",
     FAIR = "fair",
     POOR = "poor",
     CRITICAL = "critical",
   }
   
   /* ==========================================================================
      BASE INTERFACES WITH ENHANCED METADATA
      ========================================================================== */
   
   interface BaseMessage {
     type: MessageTypeEnum;
     id?: string;                    // Unique message identifier
     timestamp?: number;             // Unix timestamp
     sessionId?: string;             // Session identifier
     metadata?: MessageMetadata;     // Additional metadata
   }
   
   interface MessageMetadata {
     // Timing information
     processingTime?: number;        // Processing time in milliseconds
     latency?: number;              // Network latency
     queueTime?: number;            // Time spent in queue
     
     // Quality metrics
     confidence?: number;           // Confidence score (0-1)
     audioQuality?: AudioQualityEnum;
     transcriptionAccuracy?: number; // Estimated accuracy (0-1)
     
     // Context information
     conversationTurn?: number;     // Turn number in conversation
     questionNumber?: number;       // Current question number (for interviews)
     contextLength?: number;        // Context window size used
     
     // Technical details
     model?: string;                // AI model used
     modelVersion?: string;         // Model version
     provider?: string;             // Service provider
     region?: string;               // Processing region
     
     // User interaction
     userInterruption?: boolean;    // Was this an interruption?
     isRetry?: boolean;            // Is this a retry attempt?
     retryCount?: number;          // Number of retries
     
     // Custom properties
     [key: string]: unknown;
   }
   
   /* ==========================================================================
      ENHANCED MESSAGE INTERFACES
      ========================================================================== */
   
   export interface TranscriptMessage extends BaseMessage {
     type: MessageTypeEnum.TRANSCRIPT;
     role: MessageRoleEnum;
     transcriptType: TranscriptMessageTypeEnum;
     transcript: string;
     
     // Enhanced transcript data
     originalTranscript?: string;    // Before any processing
     normalizedTranscript?: string;  // After normalization
     confidence: number;             // Transcription confidence (0-1)
     language?: string;              // Detected language
     
     // Audio information
     audio?: {
       duration?: number;            // Audio duration in seconds
       sampleRate?: number;          // Audio sample rate
       bitRate?: number;             // Audio bit rate
       format?: string;              // Audio format (mp3, wav, etc.)
       volume?: number;              // Relative volume level (0-1)
     };
     
     // Speech analysis
     speechAnalysis?: {
       wordsPerMinute?: number;      // Speaking rate
       pauseCount?: number;          // Number of pauses
       longestPause?: number;        // Longest pause in seconds
       fillerWords?: string[];       // Detected filler words
       emotion?: {
         primary: string;            // Primary detected emotion
         confidence: number;         // Confidence in emotion detection
         secondary?: string;         // Secondary emotion
       };
     };
     
     // Word-level details
     words?: Array<{
       word: string;
       startTime: number;            // Start time in seconds
       endTime: number;              // End time in seconds
       confidence: number;           // Word-level confidence
       punctuation?: string;         // Associated punctuation
     }>;
   }
   
   export interface FunctionCallMessage extends BaseMessage {
     type: MessageTypeEnum.FUNCTION_CALL;
     functionCall: {
       name: string;
       parameters: Record<string, unknown>;
       callId?: string;              // Unique call identifier
       timeout?: number;             // Timeout in milliseconds
       retryPolicy?: {
         maxRetries: number;
         backoffMs: number;
         exponentialBackoff: boolean;
       };
     };
     
     // Enhanced context
     context?: {
       conversationState?: string;   // Current conversation state
       userIntent?: string;          // Detected user intent
       requiredCapabilities?: string[]; // Required function capabilities
       priority?: "low" | "normal" | "high" | "critical";
     };
   }
   
   export interface FunctionCallResultMessage extends BaseMessage {
     type: MessageTypeEnum.FUNCTION_CALL_RESULT;
     functionCallResult: {
       callId?: string;              // Matching call identifier
       success: boolean;             // Whether call succeeded
       result?: unknown;             // Function result
       error?: {
         code: string;
         message: string;
         details?: unknown;
         recoverable?: boolean;
       };
       forwardToClientEnabled?: boolean;
       executionTime?: number;       // Execution time in milliseconds
       
       // Enhanced result metadata
       metadata?: {
         cacheHit?: boolean;         // Was result from cache?
         dataSource?: string;        // Source of the data
         freshness?: number;         // Data freshness score (0-1)
         reliability?: number;       // Reliability score (0-1)
       };
     };
   }
   
   export interface AddMessageMessage extends BaseMessage {
     type: MessageTypeEnum.ADD_MESSAGE;
     message: {
       role: MessageRoleEnum;
       content: string;
       name?: string;                // Speaker name
       functionCall?: {
         name: string;
         arguments: string;
       };
     };
   }
   
   /* ==========================================================================
      ENHANCED MESSAGE TYPES
      ========================================================================== */
   
   export interface SpeechStartMessage extends BaseMessage {
     type: MessageTypeEnum.SPEECH_START;
     speaker: MessageRoleEnum;
     audioInfo?: {
       sampleRate?: number;
       channels?: number;
       bitDepth?: number;
     };
   }
   
   export interface SpeechEndMessage extends BaseMessage {
     type: MessageTypeEnum.SPEECH_END;
     speaker: MessageRoleEnum;
     duration?: number;              // Speech duration in seconds
     wordCount?: number;             // Estimated word count
   }
   
   export interface ErrorMessage extends BaseMessage {
     type: MessageTypeEnum.ERROR;
     error: {
       code: ErrorTypeEnum;
       message: string;
       details?: unknown;
       recoverable: boolean;
       retryAfter?: number;          // Seconds to wait before retry
       helpUrl?: string;             // Link to help documentation
     };
   }
   
   export interface WarningMessage extends BaseMessage {
     type: MessageTypeEnum.WARNING;
     warning: {
       code: string;
       message: string;
       severity: "low" | "medium" | "high";
       action?: string;              // Suggested action
     };
   }
   
   export interface InfoMessage extends BaseMessage {
     type: MessageTypeEnum.INFO;
     info: {
       message: string;
       category: "system" | "user" | "interview" | "technical";
       level: "debug" | "info" | "notice";
     };
   }
   
   /* ==========================================================================
      INTERVIEW-SPECIFIC MESSAGE TYPES
      ========================================================================== */
   
   export interface InterviewStartMessage extends BaseMessage {
     type: MessageTypeEnum.INTERVIEW_START;
     interview: {
       id: string;
       role: string;
       type: string;
       questionCount: number;
       estimatedDuration: number;    // In minutes
       difficulty: string;
     };
     participant: {
       id: string;
       name: string;
       role: MessageRoleEnum;
     };
   }
   
   export interface InterviewEndMessage extends BaseMessage {
     type: MessageTypeEnum.INTERVIEW_END;
     result: {
       completed: boolean;
       duration: number;             // Actual duration in seconds
       questionsAnswered: number;
       completionRate: number;       // Percentage completed
       reason: "completed" | "abandoned" | "timeout" | "error";
     };
     nextSteps?: {
       feedbackAvailable: boolean;
       feedbackUrl?: string;
       retakeAvailable: boolean;
     };
   }
   
   export interface QuestionStartMessage extends BaseMessage {
     type: MessageTypeEnum.QUESTION_START;
     question: {
       number: number;
       totalQuestions: number;
       category: string;
       difficulty: string;
       estimatedTime: number;        // Expected time in seconds
       question: string;
     };
   }
   
   export interface QuestionEndMessage extends BaseMessage {
     type: MessageTypeEnum.QUESTION_END;
     response: {
       questionNumber: number;
       responseTime: number;         // Actual time taken in seconds
       wordCount: number;
       completed: boolean;
       quality?: "excellent" | "good" | "fair" | "poor";
     };
   }
   
   export interface EvaluationUpdateMessage extends BaseMessage {
     type: MessageTypeEnum.EVALUATION_UPDATE;
     evaluation: {
       currentScore?: number;        // Current overall score
       categoryScores?: Array<{
         category: string;
         score: number;
         feedback?: string;
       }>;
       strengths?: string[];
       improvements?: string[];
       confidence: number;           // AI confidence in evaluation
     };
   }
   
   /* ==========================================================================
      SESSION MANAGEMENT MESSAGES
      ========================================================================== */
   
   export interface SessionStartMessage extends BaseMessage {
     type: MessageTypeEnum.SESSION_START;
     session: {
       id: string;
       userId: string;
       startTime: number;
       configuration: {
         audioSettings: AudioSettings;
         interviewSettings: InterviewSettings;
         aiSettings: AISettings;
       };
     };
   }
   
   export interface SessionPauseMessage extends BaseMessage {
     type: MessageTypeEnum.SESSION_PAUSE;
     reason: "user_request" | "technical_issue" | "automatic";
     resumeEstimate?: number;        // Estimated resume time in seconds
   }
   
   export interface SessionResumeMessage extends BaseMessage {
     type: MessageTypeEnum.SESSION_RESUME;
     pauseDuration: number;          // How long was paused in seconds
   }
   
   export interface SessionEndMessage extends BaseMessage {
     type: MessageTypeEnum.SESSION_END;
     summary: {
       totalDuration: number;        // Total session time in seconds
       activeDuration: number;       // Active conversation time
       pauseDuration: number;        // Total pause time
       messageCount: number;
       errorCount: number;
       qualityScore: number;         // Overall session quality (0-1)
     };
   }
   
   export interface HeartbeatMessage extends BaseMessage {
     type: MessageTypeEnum.HEARTBEAT;
     systemStatus: {
       aiOnline: boolean;
       transcriptionOnline: boolean;
       functionsOnline: boolean;
       latency: number;              // Current latency in ms
       queueDepth: number;           // Current queue depth
     };
   }
   
   /* ==========================================================================
      CONFIGURATION INTERFACES
      ========================================================================== */
   
   export interface AudioSettings {
     sampleRate: number;
     channels: number;
     bitDepth: number;
     format: "wav" | "mp3" | "opus" | "flac";
     noiseReduction: boolean;
     echoCancellation: boolean;
     automaticGainControl: boolean;
     volume: number;                 // 0-1
   }
   
   export interface InterviewSettings {
     type: "technical" | "behavioral" | "mixed" | "system-design";
     difficulty: "easy" | "medium" | "hard" | "expert";
     timeLimit?: number;             // Per question in seconds
     totalTimeLimit?: number;        // Total interview in seconds
     allowPauses: boolean;
     allowRetakes: boolean;
     hintsEnabled: boolean;
     realTimeFeedback: boolean;
   }
   
   export interface AISettings {
     model: string;
     temperature: number;
     maxTokens: number;
     systemPrompt?: string;
     functions?: FunctionDefinition[];
     responseTime: "fast" | "balanced" | "thoughtful";
     personality: "professional" | "friendly" | "encouraging" | "strict";
   }
   
   export interface FunctionDefinition {
     name: string;
     description: string;
     parameters: {
       type: "object";
       properties: Record<string, {
         type: string;
         description: string;
         enum?: string[];
         required?: boolean;
       }>;
       required?: string[];
     };
     timeout?: number;
     retryPolicy?: {
       maxRetries: number;
       backoffMs: number;
     };
   }
   
   /* ==========================================================================
      UNION TYPES AND TYPE GUARDS
      ========================================================================== */
   
   export type Message =
     | TranscriptMessage
     | FunctionCallMessage
     | FunctionCallResultMessage
     | AddMessageMessage
     | SpeechStartMessage
     | SpeechEndMessage
     | ErrorMessage
     | WarningMessage
     | InfoMessage
     | InterviewStartMessage
     | InterviewEndMessage
     | QuestionStartMessage
     | QuestionEndMessage
     | EvaluationUpdateMessage
     | SessionStartMessage
     | SessionPauseMessage
     | SessionResumeMessage
     | SessionEndMessage
     | HeartbeatMessage;
   
   /* ==========================================================================
      TYPE GUARDS FOR RUNTIME TYPE CHECKING
      ========================================================================== */
   
   export function isTranscriptMessage(message: Message): message is TranscriptMessage {
     return message.type === MessageTypeEnum.TRANSCRIPT;
   }
   
   export function isFunctionCallMessage(message: Message): message is FunctionCallMessage {
     return message.type === MessageTypeEnum.FUNCTION_CALL;
   }
   
   export function isFunctionCallResultMessage(message: Message): message is FunctionCallResultMessage {
     return message.type === MessageTypeEnum.FUNCTION_CALL_RESULT;
   }
   
   export function isErrorMessage(message: Message): message is ErrorMessage {
     return message.type === MessageTypeEnum.ERROR;
   }
   
   export function isInterviewMessage(message: Message): message is InterviewStartMessage | InterviewEndMessage | QuestionStartMessage | QuestionEndMessage {
     return [
       MessageTypeEnum.INTERVIEW_START,
       MessageTypeEnum.INTERVIEW_END,
       MessageTypeEnum.QUESTION_START,
       MessageTypeEnum.QUESTION_END,
     ].includes(message.type);
   }
   
   export function isSessionMessage(message: Message): message is SessionStartMessage | SessionPauseMessage | SessionResumeMessage | SessionEndMessage {
     return [
       MessageTypeEnum.SESSION_START,
       MessageTypeEnum.SESSION_PAUSE,
       MessageTypeEnum.SESSION_RESUME,
       MessageTypeEnum.SESSION_END,
     ].includes(message.type);
   }
   
   /* ==========================================================================
      VALIDATION SCHEMAS
      ========================================================================== */
   
   export const TranscriptMessageSchema = z.object({
     type: z.literal(MessageTypeEnum.TRANSCRIPT),
     role: z.nativeEnum(MessageRoleEnum),
     transcriptType: z.nativeEnum(TranscriptMessageTypeEnum),
     transcript: z.string().min(1),
     confidence: z.number().min(0).max(1),
     timestamp: z.number().optional(),
     id: z.string().optional(),
     sessionId: z.string().optional(),
   });
   
   export const FunctionCallMessageSchema = z.object({
     type: z.literal(MessageTypeEnum.FUNCTION_CALL),
     functionCall: z.object({
       name: z.string().min(1),
       parameters: z.record(z.unknown()),
       callId: z.string().optional(),
       timeout: z.number().positive().optional(),
     }),
     timestamp: z.number().optional(),
     id: z.string().optional(),
     sessionId: z.string().optional(),
   });
   
   export const ErrorMessageSchema = z.object({
     type: z.literal(MessageTypeEnum.ERROR),
     error: z.object({
       code: z.nativeEnum(ErrorTypeEnum),
       message: z.string().min(1),
       details: z.unknown().optional(),
       recoverable: z.boolean(),
       retryAfter: z.number().positive().optional(),
       helpUrl: z.string().url().optional(),
     }),
     timestamp: z.number().optional(),
     id: z.string().optional(),
     sessionId: z.string().optional(),
   });
   
   /* ==========================================================================
      UTILITY TYPES AND HELPERS
      ========================================================================== */
   
   export type MessageHandler<T extends Message = Message> = (message: T) => void | Promise<void>;
   
   export type MessageFilter<T extends Message = Message> = (message: Message) => message is T;
   
   export interface MessageBus {
     subscribe<T extends Message>(
       filter: MessageFilter<T>,
       handler: MessageHandler<T>
     ): () => void;
     
     publish(message: Message): void;
     
     unsubscribe(handler: MessageHandler): void;
     
     clear(): void;
   }
   
   export interface VapiEventHandlers {
     onMessage?: MessageHandler;
     onTranscript?: MessageHandler<TranscriptMessage>;
     onFunctionCall?: MessageHandler<FunctionCallMessage>;
     onError?: MessageHandler<ErrorMessage>;
     onSpeechStart?: MessageHandler<SpeechStartMessage>;
     onSpeechEnd?: MessageHandler<SpeechEndMessage>;
     onInterviewStart?: MessageHandler<InterviewStartMessage>;
     onInterviewEnd?: MessageHandler<InterviewEndMessage>;
     onSessionStart?: MessageHandler<SessionStartMessage>;
     onSessionEnd?: MessageHandler<SessionEndMessage>;
   }
   
   /* ==========================================================================
      CONSTANTS AND DEFAULTS
      ========================================================================== */
   
   export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
     sampleRate: 16000,
     channels: 1,
     bitDepth: 16,
     format: "wav",
     noiseReduction: true,
     echoCancellation: true,
     automaticGainControl: true,
     volume: 0.8,
   };
   
   export const DEFAULT_INTERVIEW_SETTINGS: InterviewSettings = {
     type: "mixed",
     difficulty: "medium",
     timeLimit: 300,              // 5 minutes per question
     totalTimeLimit: 3600,        // 1 hour total
     allowPauses: true,
     allowRetakes: false,
     hintsEnabled: true,
     realTimeFeedback: false,
   };
   
   export const DEFAULT_AI_SETTINGS: AISettings = {
     model: "gpt-4",
     temperature: 0.7,
     maxTokens: 300,
     responseTime: "balanced",
     personality: "professional",
   };
   
   /* ==========================================================================
      EXPORTS
      ========================================================================== */
   
   // Export all types and interfaces
   export type {
     BaseMessage,
     MessageMetadata,
     AudioSettings,
     InterviewSettings,
     AISettings,
     FunctionDefinition,
     MessageBus,
     VapiEventHandlers,
   };
   
   // Export validation schemas
   export {
     TranscriptMessageSchema,
     FunctionCallMessageSchema,
     ErrorMessageSchema,
   };
   
   // Export constants
   export {
     DEFAULT_AUDIO_SETTINGS,
     DEFAULT_INTERVIEW_SETTINGS, 
     DEFAULT_AI_SETTINGS,
   };
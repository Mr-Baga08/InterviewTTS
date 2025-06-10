import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

/* ==========================================================================
   TECHNOLOGY STACK MAPPINGS
   ========================================================================== */

export const mappings = {
  // Frontend Frameworks
  "react.js": "react",
  "reactjs": "react",
  "react": "react",
  "next.js": "nextjs",
  "nextjs": "nextjs",
  "next": "nextjs",
  "vue.js": "vuejs",
  "vuejs": "vuejs",
  "vue": "vuejs",
  "angular.js": "angular",
  "angularjs": "angular",
  "angular": "angular",
  "svelte": "svelte",
  "nuxt.js": "nuxt",
  "nuxtjs": "nuxt",
  "nuxt": "nuxt",
  "gatsby": "gatsby",

  // Backend Frameworks
  "express.js": "express",
  "expressjs": "express",
  "express": "express",
  "node.js": "nodejs",
  "nodejs": "nodejs",
  "node": "nodejs",
  "nestjs": "nestjs",
  "koa": "koa",
  "fastify": "fastify",
  "django": "django",
  "flask": "flask",
  "rails": "rails",
  "laravel": "laravel",
  "spring": "spring",
  "dotnet": "dotnet",
  ".net": "dotnet",

  // Databases
  "mongodb": "mongodb",
  "mongo": "mongodb",
  "mongoose": "mongoose",
  "mysql": "mysql",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "sqlite": "sqlite",
  "redis": "redis",
  "cassandra": "cassandra",
  "dynamodb": "dynamodb",
  "elasticsearch": "elasticsearch",
  "firebase": "firebase",
  "firestore": "firestore",
  "supabase": "supabase",

  // Languages
  "typescript": "typescript",
  "ts": "typescript",
  "javascript": "javascript",
  "js": "javascript",
  "python": "python",
  "java": "java",
  "csharp": "csharp",
  "c#": "csharp",
  "go": "go",
  "golang": "go",
  "rust": "rust",
  "php": "php",
  "ruby": "ruby",
  "kotlin": "kotlin",
  "swift": "swift",
  "dart": "dart",

  // Styling & UI
  "html5": "html5",
  "html": "html5",
  "css3": "css3",
  "css": "css3",
  "sass": "sass",
  "scss": "sass",
  "less": "less",
  "tailwindcss": "tailwindcss",
  "tailwind": "tailwindcss",
  "bootstrap": "bootstrap",
  "bulma": "bulma",
  "chakra": "chakra",
  "mui": "mui",
  "material-ui": "mui",
  "styled-components": "styled-components",

  // State Management
  "redux": "redux",
  "vuex": "vuex",
  "pinia": "pinia",
  "zustand": "zustand",
  "mobx": "mobx",
  "recoil": "recoil",
  "jotai": "jotai",

  // Build Tools
  "webpack": "webpack",
  "vite": "vite",
  "babel": "babel",
  "rollup.js": "rollup",
  "rollupjs": "rollup",
  "rollup": "rollup",
  "parcel.js": "parcel",
  "parceljs": "parcel",
  "parcel": "parcel",
  "esbuild": "esbuild",
  "turbopack": "turbopack",

  // Package Managers
  "npm": "npm",
  "yarn": "yarn",
  "pnpm": "pnpm",
  "bun": "bun",

  // Version Control & Deployment
  "git": "git",
  "github": "github",
  "gitlab": "gitlab",
  "bitbucket": "bitbucket",
  "vercel": "vercel",
  "netlify": "netlify",
  "heroku": "heroku",
  "aws amplify": "amplify",
  "amplify": "amplify",

  // Cloud & DevOps
  "docker": "docker",
  "kubernetes": "kubernetes",
  "k8s": "kubernetes",
  "aws": "aws",
  "azure": "azure",
  "gcp": "gcp",
  "google cloud": "gcp",
  "digitalocean": "digitalocean",
  "terraform": "terraform",
  "ansible": "ansible",
  "jenkins": "jenkins",
  "github actions": "github-actions",
  "circleci": "circleci",

  // Testing
  "jest": "jest",
  "cypress": "cypress",
  "playwright": "playwright",
  "selenium": "selenium",
  "mocha": "mocha",
  "chai": "chai",
  "karma": "karma",
  "vitest": "vitest",
  "testing-library": "testing-library",

  // GraphQL & API
  "graphql": "graphql",
  "graph ql": "graphql",
  "apollo": "apollo",
  "relay": "relay",
  "rest": "rest",
  "grpc": "grpc",
  "swagger": "swagger",
  "openapi": "openapi",

  // Mobile Development
  "react native": "react-native",
  "react-native": "react-native",
  "flutter": "flutter",
  "ionic": "ionic",
  "cordova": "cordova",
  "xamarin": "xamarin",

  // Design Tools
  "figma": "figma",
  "sketch": "sketch",
  "adobe xd": "adobe-xd",
  "photoshop": "photoshop",
  "adobe photoshop": "photoshop",
  "illustrator": "illustrator",

  // CMS & Backend Services
  "strapi": "strapi",
  "sanity": "sanity",
  "contentful": "contentful",
  "wordpress": "wordpress",
  "drupal": "drupal",
  "ghost": "ghost",

  // Monitoring & Analytics
  "sentry": "sentry",
  "datadog": "datadog",
  "newrelic": "newrelic",
  "google analytics": "google-analytics",

  // Blockchain & Web3
  "solidity": "solidity",
  "ethereum": "ethereum",
  "web3": "web3",
  "metamask": "metamask",

  // AI/ML
  "tensorflow": "tensorflow",
  "pytorch": "pytorch",
  "scikit-learn": "scikit-learn",
  "pandas": "pandas",
  "numpy": "numpy",
} as const;

/* ==========================================================================
   ENHANCED APP CONFIGURATION
   ========================================================================== */

export const APP_CONFIG = {
  version: "2.0.0",
  name: "TheTruthSchool.ai",
  limits: {
    minQuestionsPerInterview: 3,
    maxQuestionsPerInterview: 15,
    maxTechStackLength: 500,
    maxRoleLength: 100,
    maxUserIdLength: 50,
    maxFocusAreas: 5,
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    burstLimit: 2,
  },
  ai: {
    model: "gemini-2.0-flash-001",
    maxTokens: 30000,
    temperature: 0.7,
    topP: 0.9,
  }
} as const;

export const INTERVIEW_TYPES = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral", 
  MIXED: "Mixed",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding"
} as const;

export const EXPERIENCE_LEVELS = {
  ENTRY: "Entry",
  JUNIOR: "Junior",
  MID: "Mid", 
  SENIOR: "Senior",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
  DIRECTOR: "Director"
} as const;

export const DIFFICULTY_LEVELS = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard", 
  EXPERT: "Expert"
} as const;

export const COMPANY_SIZES = {
  STARTUP: "Startup",
  SME: "SME",
  ENTERPRISE: "Enterprise"
} as const;

/* ==========================================================================
   ROLE CONFIGURATIONS
   ========================================================================== */

export const ROLE_CONFIGS = {
  "Frontend Developer": {
    primaryTech: ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
    skillAreas: ["UI/UX", "Performance", "Accessibility", "State Management"],
    focusAreas: ["Component Design", "Browser APIs", "Build Tools"]
  },
  "Backend Developer": {
    primaryTech: ["Node.js", "Python", "Java", "SQL", "APIs"],
    skillAreas: ["Database Design", "API Development", "Security", "Performance"],
    focusAreas: ["Microservices", "Caching", "Authentication"]
  },
  "Full Stack Developer": {
    primaryTech: ["React", "Node.js", "TypeScript", "SQL", "MongoDB"],
    skillAreas: ["Frontend", "Backend", "Database", "DevOps"],
    focusAreas: ["System Architecture", "API Design", "User Experience"]
  },
  "DevOps Engineer": {
    primaryTech: ["AWS", "Docker", "Kubernetes", "Linux", "Python"],
    skillAreas: ["CI/CD", "Infrastructure", "Monitoring", "Security"],
    focusAreas: ["Automation", "Scalability", "Reliability"]
  },
  "Data Scientist": {
    primaryTech: ["Python", "SQL", "Machine Learning", "Statistics"],
    skillAreas: ["Data Analysis", "Modeling", "Visualization", "Statistics"],
    focusAreas: ["Feature Engineering", "Model Selection", "Business Intelligence"]
  }
} as const;

/* ==========================================================================
   ERROR CODES & MESSAGES
   ========================================================================== */

export const ERROR_CODES = {
  // Validation errors
  INVALID_JSON: "INVALID_JSON",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  
  // AI/Processing errors
  AI_GENERATION_FAILED: "AI_GENERATION_FAILED",
  QUESTION_VALIDATION_FAILED: "QUESTION_VALIDATION_FAILED",
  
  // Database errors
  DATABASE_ERROR: "DATABASE_ERROR",
  DOCUMENT_NOT_FOUND: "DOCUMENT_NOT_FOUND",
  
  // General errors
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE"
} as const;

export const ERROR_MESSAGES = {
  [ERROR_CODES.INVALID_JSON]: "Request body contains invalid JSON",
  [ERROR_CODES.VALIDATION_ERROR]: "Request data validation failed",
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: "Too many requests, please try again later",
  [ERROR_CODES.AI_GENERATION_FAILED]: "Failed to generate interview questions",
  [ERROR_CODES.DATABASE_ERROR]: "Database operation failed",
  [ERROR_CODES.INTERNAL_ERROR]: "An unexpected error occurred"
} as const;

/* ==========================================================================
   API RESPONSE TEMPLATES
   ========================================================================== */

export const API_RESPONSES = {
  SUCCESS: {
    INTERVIEW_CREATED: "Interview created successfully",
    FEEDBACK_GENERATED: "Feedback generated successfully", 
    DATA_RETRIEVED: "Data retrieved successfully"
  },
  ERROR: {
    INVALID_REQUEST: "Invalid request data",
    UNAUTHORIZED: "Authentication required",
    FORBIDDEN: "Access denied",
    NOT_FOUND: "Resource not found",
    RATE_LIMITED: "Rate limit exceeded",
    SERVER_ERROR: "Internal server error"
  }
} as const;

/* ==========================================================================
   ENHANCED AI INTERVIEWER CONFIGURATION
   ========================================================================== */

export const interviewer: CreateAssistantDTO = {
  name: "TheTruthSchool AI Interviewer",
  firstMessage: "Hello! Welcome to TheTruthSchool.ai. I'm your AI interviewer, and I'm excited to help you practice and improve your interview skills today. Thank you for taking the time to work on your professional development.",
  
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
    keywords: [
      "React", "JavaScript", "TypeScript", "Node.js", "Python", "AWS", 
      "Docker", "Kubernetes", "MongoDB", "SQL", "GraphQL", "REST API",
      "microservices", "CI/CD", "agile", "scrum", "leadership", "teamwork"
    ],
  },
  
  voice: {
    provider: "11labs",
    voiceId: "sarah", // Professional, clear female voice
    stability: 0.6,   // Slightly more stable for professional context
    similarityBoost: 0.85,
    speed: 0.85,      // Slightly slower for clarity
    style: 0.3,       // More neutral, professional tone
    useSpeakerBoost: true,
  },
  
  model: {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7, // Balanced creativity and consistency
    maxTokens: 300,   // Keep responses concise for voice
    
    messages: [
      {
        role: "system",
        content: `You are a senior technical interviewer at TheTruthSchool.ai, conducting a professional mock interview to help candidates improve their skills. Your goal is to provide realistic interview practice while being supportive and constructive.

INTERVIEW STRUCTURE:
Follow this question sequence:
{{questions}}

PROFESSIONAL GUIDELINES:
• Maintain a warm, professional, and encouraging tone
• Ask one question at a time and wait for complete responses
• Provide brief acknowledgments ("That's a good point", "I see", "Interesting")
• Ask natural follow-up questions for clarification or depth
• Keep responses concise (2-3 sentences max for voice conversations)
• Sound conversational, not robotic

INTERACTION STYLE:
• Listen actively and respond to what the candidate actually says
• If an answer is incomplete, ask: "Could you elaborate on that?" or "What was your role in that project?"
• For technical questions, ask for specific examples: "Can you walk me through how you implemented that?"
• For behavioral questions, guide them toward the STAR method if needed

SUPPORTIVE COACHING:
• If a candidate struggles, provide gentle guidance: "Take your time, there's no rush"
• Acknowledge good points: "That shows good problem-solving skills"
• For wrong answers, don't immediately correct - ask follow-up questions to guide them

INTERVIEW CONCLUSION:
• Thank the candidate professionally
• Mention they'll receive detailed feedback shortly
• End positively: "You've shared some great insights today. Best of luck with your interview preparation!"

VOICE CONVERSATION RULES:
• Keep all responses under 30 seconds when spoken
• Use natural speech patterns with appropriate pauses
• Avoid bullet points or lists in speech
• Sound like a real human interviewer, not an AI assistant

Remember: This is practice to help them succeed. Be professional but encouraging.`,
      },
    ],
  },
};

/* ==========================================================================
   ENHANCED FEEDBACK SCHEMA
   ========================================================================== */

export const feedbackSchema = z.object({
  totalScore: z.number().min(0).max(100),
  
  categoryScores: z.tuple([
    z.object({
      name: z.literal("Communication Skills"),
      score: z.number().min(0).max(100),
      comment: z.string().min(10).max(500),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
    }),
    z.object({
      name: z.literal("Technical Knowledge"),
      score: z.number().min(0).max(100),
      comment: z.string().min(10).max(500),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
    }),
    z.object({
      name: z.literal("Problem Solving"),
      score: z.number().min(0).max(100),
      comment: z.string().min(10).max(500),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
    }),
    z.object({
      name: z.literal("Cultural Fit"),
      score: z.number().min(0).max(100),
      comment: z.string().min(10).max(500),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
    }),
    z.object({
      name: z.literal("Confidence and Clarity"),
      score: z.number().min(0).max(100),
      comment: z.string().min(10).max(500),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
    }),
  ]),
  
  strengths: z.array(z.string()).min(3).max(8),
  areasForImprovement: z.array(z.string()).min(3).max(8),
  finalAssessment: z.string().min(100).max(1000),
  
  // Enhanced metadata
  performanceLevel: z.enum(["Exceptional", "Strong", "Good", "Fair", "Needs Improvement"]),
  readinessScore: z.number().min(0).max(100),
  keyTakeaways: z.array(z.string()).min(2).max(5),
  nextSteps: z.array(z.string()).min(2).max(5),
  
  // Interview-specific insights
  interviewFlow: z.object({
    pacing: z.enum(["Too Fast", "Good", "Too Slow"]),
    engagement: z.enum(["High", "Medium", "Low"]),
    responseQuality: z.enum(["Excellent", "Good", "Fair", "Poor"]),
  }).optional(),
});

/* ==========================================================================
   ENHANCED INTERVIEW COVERS
   ========================================================================== */

export const interviewCovers = [
  // Tech Companies
  "/adobe.png",
  "/amazon.png", 
  "/apple.png",
  "/facebook.png",
  "/google.png",
  "/microsoft.png",
  "/netflix.png",
  "/uber.png",
  "/airbnb.png",
  "/spotify.png",
  "/slack.png",
  "/zoom.png",
  
  // Startups & Modern Companies
  "/stripe.png",
  "/figma.png",
  "/notion.png",
  "/discord.png",
  "/github.png",
  "/vercel.png",
  "/supabase.png",
  
  // Traditional Companies
  "/ibm.png",
  "/oracle.png",
  "/salesforce.png",
  "/cisco.png",
  
  // Legacy/Original covers
  "/hostinger.png",
  "/pinterest.png",
  "/quora.png",
  "/reddit.png",
  "/skype.png",
  "/telegram.png",
  "/tiktok.png",
  "/yahoo.png",
] as const;

/* ==========================================================================
   TYPE EXPORTS
   ========================================================================== */

export type TechnologyMapping = keyof typeof mappings;
export type InterviewType = typeof INTERVIEW_TYPES[keyof typeof INTERVIEW_TYPES];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[keyof typeof EXPERIENCE_LEVELS];
export type QuestionDifficulty = typeof DIFFICULTY_LEVELS[keyof typeof DIFFICULTY_LEVELS];
export type InterviewCover = typeof interviewCovers[number];
export type RoleConfig = typeof ROLE_CONFIGS[keyof typeof ROLE_CONFIGS];
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
   INTERVIEW CONFIGURATIONS
   ========================================================================== */

export const INTERVIEW_TYPES = {
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral", 
  MIXED: "Mixed",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  CULTURAL_FIT: "Cultural Fit",
} as const;

export const EXPERIENCE_LEVELS = {
  ENTRY: "Entry",
  JUNIOR: "Junior", 
  MID: "Mid",
  SENIOR: "Senior",
  STAFF: "Staff",
  PRINCIPAL: "Principal",
  ARCHITECT: "Architect",
  DIRECTOR: "Director",
} as const;

export const QUESTION_DIFFICULTY = {
  EASY: "Easy",
  MEDIUM: "Medium", 
  HARD: "Hard",
  EXPERT: "Expert",
} as const;

// Add these to your existing constants/index.ts file
// Or create this section if you want to enhance your constants

/* ==========================================================================
   ENHANCED API CONFIGURATION
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
      maxTokens: 3000,
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
     QUESTION TEMPLATES
     ========================================================================== */
  
  export const QUESTION_TEMPLATES = {
    Technical: {
      Entry: [
        "Fundamentals and basic concepts",
        "Simple implementation problems",
        "Code reading and debugging",
        "Basic data structures"
      ],
      Junior: [
        "Practical implementation scenarios", 
        "Code optimization basics",
        "Testing approaches",
        "Version control practices"
      ],
      Mid: [
        "System design basics",
        "Performance considerations",
        "Design patterns",
        "Architecture decisions"
      ],
      Senior: [
        "Complex system design",
        "Leadership in technical decisions",
        "Mentoring capabilities",
        "Cross-team collaboration"
      ],
      Staff: [
        "Organization-wide technical strategy",
        "Technical vision and roadmap",
        "Complex problem solving",
        "Technical leadership"
      ],
      Principal: [
        "Industry-level technical innovation",
        "Strategic technical decisions",
        "Technical organizational impact",
        "Future technology trends"
      ]
    },
    Behavioral: {
      Entry: [
        "Learning and adaptability",
        "Basic teamwork scenarios",
        "Communication skills",
        "Problem-solving approach"
      ],
      Junior: [
        "Project collaboration",
        "Handling feedback",
        "Time management",
        "Professional growth"
      ],
      Mid: [
        "Leadership scenarios",
        "Conflict resolution", 
        "Mentoring others",
        "Process improvement"
      ],
      Senior: [
        "Team leadership",
        "Strategic thinking",
        "Cross-functional collaboration",
        "Cultural development"
      ],
      Staff: [
        "Organizational impact",
        "Strategic initiatives",
        "Change management",
        "Executive collaboration"
      ],
      Principal: [
        "Visionary leadership",
        "Industry influence",
        "Organizational transformation",
        "Strategic partnerships"
      ]
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
  
  // Enhanced function calling for dynamic interview flow
  // functions: [
  //   {
  //     name: "end_interview",
  //     description: "Call this when the interview should be concluded",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         reason: {
  //           type: "string",
  //           description: "Reason for ending the interview"
  //         }
  //       }
  //     }
  //   },
  //   {
  //     name: "request_clarification", 
  //     description: "Call this when the candidate's response needs clarification",
  //     parameters: {
  //       type: "object",
  //       properties: {
  //         topic: {
  //           type: "string",
  //           description: "The topic that needs clarification"
  //         }
  //       }
  //     }
  //   }
  // ]
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
  "/covers/adobe.png",
  "/covers/amazon.png", 
  "/covers/apple.png",
  "/covers/facebook.png",
  "/covers/google.png",
  "/covers/microsoft.png",
  "/covers/netflix.png",
  "/covers/uber.png",
  "/covers/airbnb.png",
  "/covers/spotify.png",
  "/covers/slack.png",
  "/covers/zoom.png",
  
  // Startups & Modern Companies
  "/covers/stripe.png",
  "/covers/figma.png",
  "/covers/notion.png",
  "/covers/discord.png",
  "/covers/github.png",
  "/covers/vercel.png",
  "/covers/supabase.png",
  
  // Traditional Companies
  "/covers/ibm.png",
  "/covers/oracle.png",
  "/covers/salesforce.png",
  "/covers/cisco.png",
  
  // Legacy/Original covers
  "/covers/hostinger.png",
  "/covers/pinterest.png",
  "/covers/quora.png",
  "/covers/reddit.png",
  "/covers/skype.png",
  "/covers/telegram.png",
  "/covers/tiktok.png",
  "/covers/yahoo.png",
] as const;

/* ==========================================================================
   QUESTION TEMPLATES BY TYPE
   ========================================================================== */

// export const QUESTION_TEMPLATES = {
//   [INTERVIEW_TYPES.TECHNICAL]: {
//     [EXPERIENCE_LEVELS.JUNIOR]: [
//       "What is {technology} and how have you used it in your projects?",
//       "Explain the difference between {concept1} and {concept2}.",
//       "How would you debug a {technology} application that's running slowly?",
//       "Walk me through how you would implement {feature} using {technology}.",
//     ],
//     [EXPERIENCE_LEVELS.MID]: [
//       "Describe a challenging technical problem you solved using {technology}.",
//       "How would you architect a {type} application using {technology}?",
//       "What are the trade-offs between {approach1} and {approach2} in {context}?",
//       "How do you ensure code quality and maintainability in {technology} projects?",
//     ],
//     [EXPERIENCE_LEVELS.SENIOR]: [
//       "How would you design a scalable {type} system for {scale} users?",
//       "Describe a time when you had to make a critical architectural decision.",
//       "How do you evaluate and introduce new technologies to your team?",
//       "Walk me through your approach to technical mentoring and code reviews.",
//     ],
//   },
  
//   [INTERVIEW_TYPES.BEHAVIORAL]: {
//     [EXPERIENCE_LEVELS.JUNIOR]: [
//       "Tell me about a time when you had to learn a new technology quickly.",
//       "Describe a project you're particularly proud of and your role in it.",
//       "How do you handle feedback on your code or work?",
//       "Tell me about a time when you made a mistake and how you handled it.",
//     ],
//     [EXPERIENCE_LEVELS.MID]: [
//       "Describe a time when you had to work with a difficult team member.",
//       "Tell me about a project where you had to balance multiple competing priorities.",
//       "How do you approach mentoring junior developers?",
//       "Describe a time when you had to advocate for a technical decision.",
//     ],
//     [EXPERIENCE_LEVELS.SENIOR]: [
//       "Tell me about a time when you led a team through a challenging project.",
//       "How do you handle conflicts between team members or stakeholders?",
//       "Describe your approach to building and maintaining engineering culture.",
//       "Tell me about a time when you had to make a decision with incomplete information.",
//     ],
//   },
// } as const;

// /* ==========================================================================
//    ROLE-SPECIFIC CONFIGURATIONS
//    ========================================================================== */

// export const ROLE_CONFIGS = {
//   "Frontend Developer": {
//     primaryTech: ["React", "JavaScript", "TypeScript", "CSS", "HTML"],
//     commonQuestions: [
//       "How do you optimize web application performance?",
//       "Explain the virtual DOM and its benefits.",
//       "How do you handle state management in React applications?",
//       "What's your approach to responsive design?",
//     ],
//     skillAreas: ["UI/UX Implementation", "Performance Optimization", "Browser Compatibility", "Accessibility"],
//   },
  
//   "Backend Developer": {
//     primaryTech: ["Node.js", "Python", "Java", "SQL", "Docker"],
//     commonQuestions: [
//       "How do you design RESTful APIs?",
//       "Explain database indexing and when you'd use it.",
//       "How do you handle authentication and authorization?",
//       "Describe your approach to error handling and logging.",
//     ],
//     skillAreas: ["API Design", "Database Management", "Security", "Scalability"],
//   },
  
//   "Full Stack Developer": {
//     primaryTech: ["React", "Node.js", "TypeScript", "SQL", "AWS"],
//     commonQuestions: [
//       "How do you ensure consistency between frontend and backend?",
//       "Describe your approach to full-stack application architecture.",
//       "How do you handle data flow in a full-stack application?",
//       "What's your deployment and DevOps strategy?",
//     ],
//     skillAreas: ["System Architecture", "Data Flow", "Integration", "DevOps"],
//   },
  
//   "DevOps Engineer": {
//     primaryTech: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"],
//     commonQuestions: [
//       "How do you design CI/CD pipelines?",
//       "Explain infrastructure as code and its benefits.",
//       "How do you monitor and troubleshoot production systems?",
//       "Describe your approach to security in DevOps practices.",
//     ],
//     skillAreas: ["Infrastructure", "Automation", "Monitoring", "Security"],
//   },
// } as const;

// /* ==========================================================================
//    APP CONFIGURATION
//    ========================================================================== */

// export const APP_CONFIG = {
//   name: "TheTruthSchool.ai",
//   version: "2.0.0",
//   description: "AI-Powered Interview Preparation Platform",
  
//   limits: {
//     maxQuestionsPerInterview: 15,
//     minQuestionsPerInterview: 3,
//     maxInterviewDuration: 60, // minutes
//     maxTechStackItems: 10,
//     maxCharactersPerResponse: 2000,
//   },
  
//   scoring: {
//     passingScore: 70,
//     excellentScore: 85,
//     expertScore: 95,
//   },
  
//   features: {
//     voiceInterviews: true,
//     realTimeFeedback: true,
//     progressTracking: true,
//     customQuestions: true,
//     teamCollaboration: false, // Premium feature
//     advancedAnalytics: false, // Premium feature
//   },
// } as const;

// /* ==========================================================================
//    DUMMY DATA FOR DEVELOPMENT
//    ========================================================================== */

// export const dummyInterviews: Interview[] = [
//   {
//     id: "interview-001",
//     userId: "user-001",
//     role: "Frontend Developer",
//     type: INTERVIEW_TYPES.TECHNICAL,
//     techstack: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
//     level: EXPERIENCE_LEVELS.JUNIOR,
//     questions: [
//       "What is React and why would you choose it for a project?",
//       "Explain the difference between state and props in React.",
//       "How do you handle API calls in a React application?",
//       "What is TypeScript and what benefits does it provide?",
//       "How would you optimize a React application for performance?",
//     ],
//     finalized: true,
//     createdAt: "2024-12-15T10:00:00Z",
//     updatedAt: "2024-12-15T10:00:00Z",
//     estimatedDuration: 30,
//     difficulty: QUESTION_DIFFICULTY.MEDIUM,
//   },
//   {
//     id: "interview-002", 
//     userId: "user-001",
//     role: "Full Stack Developer",
//     type: INTERVIEW_TYPES.MIXED,
//     techstack: ["Node.js", "Express", "MongoDB", "React", "AWS"],
//     level: EXPERIENCE_LEVELS.SENIOR,
//     questions: [
//       "Describe your experience with full-stack development.",
//       "How do you ensure data consistency between frontend and backend?",
//       "Tell me about a challenging technical problem you solved recently.",
//       "How do you approach system design for scalable applications?",
//       "Describe a time when you had to lead a technical project.",
//     ],
//     finalized: true,
//     createdAt: "2024-12-14T15:30:00Z",
//     updatedAt: "2024-12-14T15:30:00Z",
//     estimatedDuration: 45,
//     difficulty: QUESTION_DIFFICULTY.HARD,
//   },
//   {
//     id: "interview-003",
//     userId: "user-002",
//     role: "DevOps Engineer", 
//     type: INTERVIEW_TYPES.TECHNICAL,
//     techstack: ["Docker", "Kubernetes", "AWS", "Terraform", "Jenkins"],
//     level: EXPERIENCE_LEVELS.MID,
//     questions: [
//       "How do you design and implement CI/CD pipelines?",
//       "Explain the benefits of containerization with Docker.",
//       "How do you monitor and troubleshoot production systems?",
//       "What's your approach to infrastructure as code?",
//       "How do you ensure security in your DevOps practices?",
//     ],
//     finalized: true,
//     createdAt: "2024-12-13T09:15:00Z",
//     updatedAt: "2024-12-13T09:15:00Z",
//     estimatedDuration: 40,
//     difficulty: QUESTION_DIFFICULTY.HARD,
//   },
// ] as const;



/* ==========================================================================
   TYPE EXPORTS
   ========================================================================== */

export type TechnologyMapping = keyof typeof mappings;
export type InterviewType = typeof INTERVIEW_TYPES[keyof typeof INTERVIEW_TYPES];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[keyof typeof EXPERIENCE_LEVELS];
export type QuestionDifficulty = typeof QUESTION_DIFFICULTY[keyof typeof QUESTION_DIFFICULTY];
export type InterviewCover = typeof interviewCovers[number];
export type RoleConfig = typeof ROLE_CONFIGS[keyof typeof ROLE_CONFIGS];
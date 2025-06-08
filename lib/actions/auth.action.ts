"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { z } from "zod";

// Enhanced types for better error handling
interface AuthResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
  code?: string;
}

interface SessionMetadata {
  createdAt: string;
  userAgent?: string;
  ipAddress?: string;
  deviceInfo?: {
    type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    os?: string;
    browser?: string;
  };
}

// Validation schemas
const SignUpSchema = z.object({
  uid: z.string().min(1, "User ID is required"),
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be less than 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string()
    .email("Please enter a valid email address")
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain uppercase, lowercase, and number")
});

const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  idToken: z.string().min(1, "Authentication token is required")
});

// Session configuration
const SESSION_CONFIG = {
  DURATION: 60 * 60 * 24 * 7, // 1 week
  REFRESH_THRESHOLD: 60 * 60 * 24 * 2, // Refresh if expires in 2 days
  MAX_SESSIONS: 5, // Maximum concurrent sessions per user
  COOKIE_NAME: "session",
  SECURE_COOKIE_NAME: "session_secure"
} as const;

// Enhanced session cookie management
export async function setSessionCookie(
  idToken: string, 
  metadata?: Partial<SessionMetadata>
): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();

    // Create session cookie with enhanced security
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_CONFIG.DURATION * 1000,
    });

    // Verify the token to get user info
    const decodedToken = await auth.verifyIdToken(idToken);
    
    // Enhanced cookie options
    const cookieOptions = {
      maxAge: SESSION_CONFIG.DURATION,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax" as const,
      priority: "high" as const,
    };

    // Set primary session cookie
    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, sessionCookie, cookieOptions);

    // Set secure backup cookie for enhanced security
    if (process.env.NODE_ENV === "production") {
      cookieStore.set(SESSION_CONFIG.SECURE_COOKIE_NAME, 
        Buffer.from(JSON.stringify({
          uid: decodedToken.uid,
          exp: decodedToken.exp,
          iat: decodedToken.iat
        })).toString('base64'),
        { ...cookieOptions, secure: true, sameSite: "strict" }
      );
    }

    // Update user's last login and session metadata
    await updateUserSession(decodedToken.uid, {
      lastLogin: new Date().toISOString(),
      sessionMetadata: {
        createdAt: new Date().toISOString(),
        ...metadata
      }
    });

    return {
      success: true,
      message: "Session created successfully",
      data: { 
        userId: decodedToken.uid,
        expiresAt: new Date(decodedToken.exp * 1000).toISOString()
      }
    };

  } catch (error: any) {
    console.error("Session creation error:", error);
    
    return {
      success: false,
      message: "Failed to create secure session",
      code: "SESSION_CREATION_FAILED",
      errors: [error.message]
    };
  }
}

// Enhanced user session tracking
async function updateUserSession(uid: string, sessionData: any): Promise<void> {
  try {
    await db.collection("users").doc(uid).update({
      ...sessionData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn("Failed to update session metadata:", error);
    // Non-critical error, don't throw
  }
}

export async function signUp(params: SignUpParams): Promise<AuthResult> {
  try {
    // Validate input data
    const validatedData = SignUpSchema.parse(params);
    const { uid, name, email, password } = validatedData;

    // Check if user already exists
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "An account with this email already exists",
        code: "USER_EXISTS",
        errors: ["Please sign in instead, or use a different email address"]
      };
    }

    // Create user profile with enhanced data
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        isEmailVerified: false,
        onboardingCompleted: false,
        preferences: {
          emailNotifications: true,
          interviewReminders: true,
          progressReports: true
        }
      },
      stats: {
        interviewsCompleted: 0,
        totalPracticeTime: 0,
        averageScore: 0,
        streak: 0
      },
      metadata: {
        signUpMethod: "email",
        version: "2.0"
      }
    };

    await db.collection("users").doc(uid).set(userData);

    // Log successful registration (for analytics)
    console.info(`New user registered: ${email} (${uid})`);

    return {
      success: true,
      message: "Account created successfully! Please sign in to continue.",
      data: {
        userId: uid,
        email: email,
        requiresEmailVerification: true
      }
    };

  } catch (error: any) {
    console.error("Sign up error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Please check your information and try again",
        code: "VALIDATION_ERROR",
        errors: error.errors.map(e => e.message)
      };
    }

    // Handle Firebase specific errors
    if (error.code) {
      const firebaseErrorMap: Record<string, string> = {
        "auth/email-already-exists": "This email is already registered",
        "auth/invalid-email": "Please enter a valid email address",
        "auth/weak-password": "Password is too weak. Please choose a stronger password",
        "auth/operation-not-allowed": "Email/password accounts are not enabled",
      };

      return {
        success: false,
        message: firebaseErrorMap[error.code] || "Account creation failed",
        code: error.code,
        errors: [firebaseErrorMap[error.code] || error.message]
      };
    }

    return {
      success: false,
      message: "Unable to create account. Please try again.",
      code: "UNKNOWN_ERROR",
      errors: ["An unexpected error occurred"]
    };
  }
}

export async function signIn(params: SignInParams): Promise<AuthResult> {
  try {
    // Validate input data
    const validatedData = SignInSchema.parse(params);
    const { email, idToken } = validatedData;

    // Verify the user exists
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return {
          success: false,
          message: "No account found with this email address",
          code: "USER_NOT_FOUND",
          errors: ["Please sign up first or check your email address"]
        };
      }
      throw error;
    }

    // Check if user profile exists in database
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (!userDoc.exists) {
      // User exists in Auth but not in database - data inconsistency
      console.error(`User ${userRecord.uid} exists in Auth but not in database`);
      return {
        success: false,
        message: "Account data not found. Please contact support.",
        code: "DATA_INCONSISTENCY",
        errors: ["User profile is incomplete"]
      };
    }

    // Set session cookie with metadata
    const sessionResult = await setSessionCookie(idToken, {
      userAgent: params.userAgent,
      ipAddress: params.ipAddress
    });

    if (!sessionResult.success) {
      return sessionResult;
    }

    return {
      success: true,
      message: "Successfully signed in",
      data: {
        userId: userRecord.uid,
        email: userRecord.email,
        name: userDoc.data()?.name,
        sessionExpires: sessionResult.data?.expiresAt
      }
    };

  } catch (error: any) {
    console.error("Sign in error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Please check your login information",
        code: "VALIDATION_ERROR",
        errors: error.errors.map(e => e.message)
      };
    }

    // Handle Firebase auth errors
    if (error.code) {
      const firebaseErrorMap: Record<string, string> = {
        "auth/invalid-id-token": "Invalid authentication. Please try signing in again",
        "auth/id-token-expired": "Your session has expired. Please sign in again",
        "auth/user-disabled": "This account has been disabled. Please contact support",
        "auth/user-not-found": "No account found with this email address",
      };

      return {
        success: false,
        message: firebaseErrorMap[error.code] || "Sign in failed",
        code: error.code,
        errors: [firebaseErrorMap[error.code] || error.message]
      };
    }

    return {
      success: false,
      message: "Unable to sign in. Please try again.",
      code: "UNKNOWN_ERROR",
      errors: ["An unexpected error occurred"]
    };
  }
}

// Enhanced sign out with cleanup
export async function signOut(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const user = await getCurrentUser();

    // Clear all session cookies
    cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
    cookieStore.delete(SESSION_CONFIG.SECURE_COOKIE_NAME);

    // Update user's last activity
    if (user?.id) {
      await updateUserSession(user.id, {
        lastActivity: new Date().toISOString(),
        signedOutAt: new Date().toISOString()
      });
    }

    return {
      success: true,
      message: "Successfully signed out"
    };

  } catch (error: any) {
    console.error("Sign out error:", error);
    
    // Even if cleanup fails, clear the cookies
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
    cookieStore.delete(SESSION_CONFIG.SECURE_COOKIE_NAME);

    return {
      success: true,
      message: "Signed out (with cleanup warnings)"
    };
  }
}

// Enhanced user retrieval with caching and validation
export async function getCurrentUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    if (!sessionCookie) {
      return null;
    }

    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    
    // Check if session is close to expiry and needs refresh
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decodedClaims.exp - now;
    
    if (timeUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD) {
      console.info(`Session for user ${decodedClaims.uid} expires soon, consider refresh`);
    }

    // Get user data from database
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      console.error(`User document not found for UID: ${decodedClaims.uid}`);
      return null;
    }

    const userData = userDoc.data();
    
    // Update last activity timestamp
    await updateUserSession(decodedClaims.uid, {
      lastActivity: new Date().toISOString()
    });

    return {
      id: userDoc.id,
      ...userData,
      sessionExpires: new Date(decodedClaims.exp * 1000).toISOString()
    } as unknown as User;

  } catch (error: any) {
    console.error("Get current user error:", error);
    
    // Clear invalid session cookies
    if (error.code === 'auth/session-cookie-expired' || 
        error.code === 'auth/session-cookie-revoked') {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
      cookieStore.delete(SESSION_CONFIG.SECURE_COOKIE_NAME);
    }
    
    return null;
  }
}

// Enhanced authentication check with detailed status
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}

// Additional utility: Get authentication status with details
export async function getAuthStatus(): Promise<{
  isAuthenticated: boolean;
  user?: User | null;
  sessionExpires?: string;
  needsRefresh?: boolean;
}> {
  const user = await getCurrentUser();
  
  if (!user) {
    return { isAuthenticated: false };
  }

  const sessionExpires = user.sessionExpires;
  const needsRefresh = sessionExpires ? 
    new Date(sessionExpires).getTime() - Date.now() < SESSION_CONFIG.REFRESH_THRESHOLD * 1000 : 
    false;

  return {
    isAuthenticated: true,
    user,
    sessionExpires,
    needsRefresh
  };
}

// Utility: Refresh session if needed
export async function refreshSessionIfNeeded(): Promise<AuthResult> {
  const authStatus = await getAuthStatus();
  
  if (!authStatus.isAuthenticated) {
    return {
      success: false,
      message: "Not authenticated",
      code: "NOT_AUTHENTICATED"
    };
  }

  if (!authStatus.needsRefresh) {
    return {
      success: true,
      message: "Session is still valid"
    };
  }

  // In a real implementation, you would need to get a new ID token
  // from the client and create a new session cookie
  return {
    success: false,
    message: "Session refresh requires client-side token renewal",
    code: "REFRESH_REQUIRED"
  };
}
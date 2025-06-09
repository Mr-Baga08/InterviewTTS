// lib/actions/auth.action.ts
"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

// Session configuration
const SESSION_CONFIG = {
  DURATION: 60 * 60 * 24 * 7, // 1 week
  COOKIE_NAME: "session",
  SECURE_COOKIE_NAME: "session_secure"
} as const;

// Validation schemas
const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  idToken: z.string().min(1, "Authentication token is required")
});

const SignUpSchema = z.object({
  uid: z.string().min(1, "User ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Enhanced session cookie management
export async function setSessionCookie(idToken: string): Promise<{ success: boolean; message: string }> {
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
    };

    // Set primary session cookie
    cookieStore.set(SESSION_CONFIG.COOKIE_NAME, sessionCookie, cookieOptions);

    // Update user's last login
    await updateUserSession(decodedToken.uid, {
      lastLogin: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Session created successfully"
    };

  } catch (error: any) {
    console.error("Session creation error:", error);
    return {
      success: false,
      message: "Failed to create secure session"
    };
  }
}

async function updateUserSession(uid: string, sessionData: any): Promise<void> {
  try {
    await db.collection("users").doc(uid).update({
      ...sessionData,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.warn("Failed to update session metadata:", error);
  }
}

export async function signUp(params: any) {
  try {
    const validatedData = SignUpSchema.parse(params);
    const { uid, name, email } = validatedData;

    // Check if user already exists
    const userRecord = await db.collection("users").doc(uid).get();
    if (userRecord.exists) {
      return {
        success: false,
        message: "An account with this email already exists"
      };
    }

    // Create user profile
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      profile: {
        isEmailVerified: false,
        onboardingCompleted: false,
      },
      stats: {
        interviewsCompleted: 0,
        totalPracticeTime: 0,
        averageScore: 0,
        streak: 0
      }
    };

    await db.collection("users").doc(uid).set(userData);

    return {
      success: true,
      message: "Account created successfully! Please sign in to continue."
    };

  } catch (error: any) {
    console.error("Sign up error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Please check your information and try again",
        errors: error.errors.map(e => e.message)
      };
    }

    return {
      success: false,
      message: "Unable to create account. Please try again."
    };
  }
}

export async function signIn(params: any) {
  try {
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
          message: "No account found with this email address"
        };
      }
      throw error;
    }

    // Check if user profile exists in database
    const userDoc = await db.collection("users").doc(userRecord.uid).get();
    if (!userDoc.exists) {
      return {
        success: false,
        message: "Account data not found. Please contact support."
      };
    }

    // Set session cookie
    const sessionResult = await setSessionCookie(idToken);

    if (!sessionResult.success) {
      return sessionResult;
    }

    return {
      success: true,
      message: "Successfully signed in"
    };

  } catch (error: any) {
    console.error("Sign in error:", error);
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        message: "Please check your login information",
        errors: error.errors.map(e => e.message)
      };
    }

    return {
      success: false,
      message: "Unable to sign in. Please try again."
    };
  }
}

export async function signOut() {
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
      message: "Signed out"
    };
  }
}

export async function getCurrentUser() {
  try {
    console.log("getCurrentUser: Starting...");
    
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_CONFIG.COOKIE_NAME)?.value;
    
    console.log("getCurrentUser: Session cookie exists?", !!sessionCookie);
    
    if (!sessionCookie) {
      console.log("getCurrentUser: No session cookie found");
      return null;
    }

    console.log("getCurrentUser: Verifying session cookie...");
    
    // Verify session cookie
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    console.log("getCurrentUser: Session cookie verified, UID:", decodedClaims.uid);
    
    // Get user data from database
    const userDoc = await db.collection("users").doc(decodedClaims.uid).get();
    
    if (!userDoc.exists) {
      console.error(`getCurrentUser: User document not found for UID: ${decodedClaims.uid}`);
      // Clear invalid session
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
      return null;
    }

    const userData = userDoc.data();
    console.log("getCurrentUser: User data found for:", userData?.email);
    
    // Update last activity timestamp (don't await to avoid blocking)
    updateUserSession(decodedClaims.uid, {
      lastActivity: new Date().toISOString()
    }).catch(console.warn);

    return {
      id: userDoc.id,
      ...userData,
      sessionExpires: new Date(decodedClaims.exp * 1000).toISOString()
    } as any;

  } catch (error: any) {
    console.error("getCurrentUser error:", error?.message || error);
    
    // Clear invalid session cookies on any error
    try {
      const cookieStore = await cookies();
      cookieStore.delete(SESSION_CONFIG.COOKIE_NAME);
      cookieStore.delete(SESSION_CONFIG.SECURE_COOKIE_NAME);
      console.log("getCurrentUser: Cleared invalid session cookies");
    } catch (cleanupError) {
      console.error("getCurrentUser: Error clearing cookies:", cleanupError);
    }
    
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return !!user;
}
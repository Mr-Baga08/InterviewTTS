// app/api/firebase-diagnostic/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: [] as any[]
  };

  // Check 1: Environment Variables
  const envCheck = {
    name: "Environment Variables",
    status: "checking",
    details: {} as any
  };

  try {
    envCheck.details = {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "✅ Set" : "❌ Missing",
      FIREBASE_PRIVATE_KEY_LENGTH: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      FIREBASE_PRIVATE_KEY_STARTS_WITH: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50) + "...",
      HAS_BEGIN_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.includes("-----BEGIN PRIVATE KEY-----") ? "✅ Yes" : "❌ No",
      HAS_END_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.includes("-----END PRIVATE KEY-----") ? "✅ Yes" : "❌ No",
    };
    envCheck.status = "completed";
  } catch (error: any) {
    envCheck.status = "error";
    envCheck.details.error = error.message;
  }

  diagnostics.checks.push(envCheck);

  // Check 2: Firebase Admin Initialization
  const adminCheck = {
    name: "Firebase Admin Initialization",
    status: "checking",
    details: {} as any
  };

  try {
    const { initializeApp, getApps, cert } = await import("firebase-admin/app");
    
    adminCheck.details.existingApps = getApps().length;
    
    if (getApps().length === 0) {
      // Try to initialize
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      };

      adminCheck.details.serviceAccount = {
        projectId: serviceAccount.projectId ? "✅ Set" : "❌ Missing",
        clientEmail: serviceAccount.clientEmail ? "✅ Set" : "❌ Missing",
        privateKey: serviceAccount.privateKey ? "✅ Set" : "❌ Missing",
      };

      const app = initializeApp({
        credential: cert(serviceAccount as any),
      });

      adminCheck.details.initializationResult = "✅ Success";
      adminCheck.details.appName = app.name;
    } else {
      adminCheck.details.initializationResult = "✅ Already initialized";
    }

    adminCheck.status = "completed";
  } catch (error: any) {
    adminCheck.status = "error";
    adminCheck.details.error = error.message;
    adminCheck.details.errorCode = error.code;
    adminCheck.details.errorStack = error.stack;
  }

  diagnostics.checks.push(adminCheck);

  // Check 3: Firestore Connection
  const firestoreCheck = {
    name: "Firestore Connection",
    status: "checking",
    details: {} as any
  };

  try {
    const { getFirestore } = await import("firebase-admin/firestore");
    const db = getFirestore();
    
    firestoreCheck.details.firestoreInitialized = "✅ Yes";
    
    // Try a simple operation
    const testRef = db.collection('_diagnostic').doc('test');
    const testDoc = await testRef.get();
    
    firestoreCheck.details.connectionTest = "✅ Success";
    firestoreCheck.details.documentExists = testDoc.exists;
    firestoreCheck.status = "completed";
  } catch (error: any) {
    firestoreCheck.status = "error";
    firestoreCheck.details.error = error.message;
    firestoreCheck.details.errorCode = error.code;
  }

  diagnostics.checks.push(firestoreCheck);

  // Check 4: Auth Service
  const authCheck = {
    name: "Firebase Auth",
    status: "checking",
    details: {} as any
  };

  try {
    const { getAuth } = await import("firebase-admin/auth");
    const auth = getAuth();
    
    authCheck.details.authInitialized = "✅ Yes";
    
    // Try to list users (with limit to avoid performance issues)
    const listUsersResult = await auth.listUsers(1);
    authCheck.details.authConnectionTest = "✅ Success";
    authCheck.details.userCount = listUsersResult.users.length;
    authCheck.status = "completed";
  } catch (error: any) {
    authCheck.status = "error";
    authCheck.details.error = error.message;
    authCheck.details.errorCode = error.code;
  }

  diagnostics.checks.push(authCheck);

  // Check 5: Network and SSL
  const networkCheck = {
    name: "Network & SSL",
    status: "checking",
    details: {} as any
  };

  try {
    // Test Google API connectivity
    const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=invalid', {
      method: 'GET',
    });
    
    networkCheck.details.googleApisReachable = response.status === 400 ? "✅ Yes (400 expected)" : `❓ Unexpected status: ${response.status}`;
    networkCheck.details.sslWorking = "✅ Yes";
    networkCheck.status = "completed";
  } catch (error: any) {
    networkCheck.status = "error";
    networkCheck.details.error = error.message;
    networkCheck.details.sslError = error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE';
  }

  diagnostics.checks.push(networkCheck);

  // Overall status
  const hasErrors = diagnostics.checks.some(check => check.status === "error");
  const overallStatus = hasErrors ? "❌ Issues Found" : "✅ All Checks Passed";

  return NextResponse.json({
    overallStatus,
    ...diagnostics,
    recommendations: getRecommendations(diagnostics.checks)
  }, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

function getRecommendations(checks: any[]): string[] {
  const recommendations: string[] = [];

  const envCheck = checks.find(c => c.name === "Environment Variables");
  if (envCheck?.status === "error" || envCheck?.details?.FIREBASE_PROJECT_ID === "❌ Missing") {
    recommendations.push("Set up your Firebase environment variables in .env.local");
  }

  if (envCheck?.details?.HAS_BEGIN_PRIVATE_KEY === "❌ No") {
    recommendations.push("Your FIREBASE_PRIVATE_KEY is missing the proper format. Ensure it includes '-----BEGIN PRIVATE KEY-----'");
  }

  const adminCheck = checks.find(c => c.name === "Firebase Admin Initialization");
  if (adminCheck?.status === "error") {
    recommendations.push("Firebase Admin SDK initialization failed. Check your service account credentials.");
  }

  const firestoreCheck = checks.find(c => c.name === "Firestore Connection");
  if (firestoreCheck?.status === "error") {
    recommendations.push("Firestore connection failed. Verify your project ID and ensure Firestore is enabled.");
  }

  const authCheck = checks.find(c => c.name === "Firebase Auth");
  if (authCheck?.status === "error") {
    recommendations.push("Firebase Auth connection failed. Ensure Authentication is enabled in your Firebase project.");
  }

  const networkCheck = checks.find(c => c.name === "Network & SSL");
  if (networkCheck?.status === "error") {
    recommendations.push("Network connectivity issues detected. Check your internet connection and firewall settings.");
  }

  if (recommendations.length === 0) {
    recommendations.push("All checks passed! Your Firebase configuration should be working correctly.");
  }

  return recommendations;
}
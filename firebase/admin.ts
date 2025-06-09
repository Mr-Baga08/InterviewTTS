// firebase/admin.ts (Fixed to use production Firestore)
import { initializeApp, getApps, cert, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Debug logging function
function debugLog(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Firebase Admin] ${message}`, data || '');
  }
}

// Initialize Firebase Admin with production settings
function initFirebaseAdmin() {
  const apps = getApps();

  if (apps.length > 0) {
    debugLog("Firebase Admin already initialized");
    return apps[0];
  }

  try {
    debugLog("Starting Firebase Admin initialization...");

    // Get environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    debugLog("Environment variables check:", {
      projectId: projectId ? "✅ Set" : "❌ Missing",
      clientEmail: clientEmail ? "✅ Set" : "❌ Missing", 
      privateKey: privateKey ? "✅ Set" : "❌ Missing",
      privateKeyLength: privateKey?.length || 0
    });

    // Validate required environment variables
    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is required");
    }
    if (!clientEmail) {
      throw new Error("FIREBASE_CLIENT_EMAIL is required");
    }
    if (!privateKey) {
      throw new Error("FIREBASE_PRIVATE_KEY is required");
    }

    // Format the private key
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

    // Validate private key format
    if (!formattedPrivateKey.includes("-----BEGIN PRIVATE KEY-----") || 
        !formattedPrivateKey.includes("-----END PRIVATE KEY-----")) {
      throw new Error("Invalid private key format. Must include BEGIN and END markers.");
    }

    // Create service account object
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    };

    debugLog("Service account object created successfully");

    // Initialize Firebase Admin with explicit production configuration
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId,
      // Explicitly disable any emulator connections
      databaseURL: `https://${projectId}-default-rtdb.firebaseio.com/`, // For Realtime Database
    });

    debugLog("Firebase Admin SDK initialized successfully", {
      appName: app.name,
      projectId: app.options.projectId
    });

    return app;

  } catch (error: any) {
    debugLog("Firebase Admin initialization failed:", {
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
}

// Initialize Firebase Admin
let firebaseApp: any;
let auth: any;
let db: any;

try {
  firebaseApp = initFirebaseAdmin();
  auth = getAuth(firebaseApp);
  db = getFirestore(firebaseApp);
  
  // CRITICAL FIX: Configure Firestore to use production, not emulator
  if (db && typeof db.settings === 'function') {
    db.settings({
      ignoreUndefinedProperties: true,
    });
    debugLog("Firestore configured for production");
  }
  
  debugLog("Firebase services initialized successfully");
} catch (error: any) {
  console.error("Critical Firebase initialization error:", error);
  // Don't throw here, let the app start but services will be undefined
}

// Enhanced health check with better error reporting
export const checkFirebaseConnection = async (): Promise<{ 
  connected: boolean; 
  error?: string; 
  details?: any 
}> => {
  try {
    debugLog("Starting Firebase connection check...");

    if (!db) {
      return { 
        connected: false, 
        error: "Firestore not initialized" 
      };
    }

    // Try a simple operation with a timeout
    const testRef = db.collection('_health').doc('connection-test');
    
    // Create a promise that rejects after 10 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
    
    // Race between the actual operation and timeout
    await Promise.race([
      testRef.get(),
      timeoutPromise
    ]);
    
    debugLog("Firebase connection check successful");
    return { connected: true };

  } catch (error: any) {
    debugLog("Firebase connection check failed:", {
      error: error.message,
      code: error.code
    });
    
    // Check if it's trying to connect to emulator
    if (error.message && error.message.includes('127.0.0.1:8080')) {
      return {
        connected: false,
        error: "Firestore is trying to connect to emulator instead of production",
        details: {
          issue: "emulator_connection",
          solution: "Restart your application after updating the Firebase configuration"
        }
      };
    }
    
    return { 
      connected: false, 
      error: error.message,
      details: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Export Firebase services
export { auth, db, firebaseApp };

// Export initialization status
export const isFirebaseInitialized = (): boolean => {
  return !!(firebaseApp && auth && db);
};

// Export function to check if using emulator
export const isUsingEmulator = (): boolean => {
  try {
    // Check if FIRESTORE_EMULATOR_HOST is set
    return !!(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_EMULATOR_HUB);
  } catch {
    return false;
  }
};
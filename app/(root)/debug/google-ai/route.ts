// Create: app/api/debug/google-ai/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

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
      GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "✅ Set" : "❌ Missing",
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "✅ Set" : "❌ Missing", // Alternative name
      API_KEY_LENGTH: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
      API_KEY_PREFIX: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 15) + "..." || "N/A",
    };
    envCheck.status = "completed";
  } catch (error: any) {
    envCheck.status = "error";
    envCheck.details.error = error.message;
  }

  diagnostics.checks.push(envCheck);

  // Check 2: Model Availability Test
  const modelCheck = {
    name: "Model Availability",
    status: "checking",
    details: {} as any
  };

  const modelsToTest = [
    "gemini-2.0-flash-001",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-flash"
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`Testing model: ${modelName}`);
      
      const { text } = await generateText({
        model: google(modelName),
        prompt: "Say hello in exactly 3 words.",
        maxTokens: 10,
      });

      modelCheck.details[modelName] = {
        status: "✅ Working",
        response: text.substring(0, 50) + "...",
        length: text.length
      };
      
      // If we find a working model, stop testing
      break;
      
    } catch (error: any) {
      modelCheck.details[modelName] = {
        status: "❌ Failed",
        error: error.message,
        errorCode: error.code || 'unknown'
      };
    }
  }

  modelCheck.status = "completed";
  diagnostics.checks.push(modelCheck);

  // Check 3: Simple API Call Test
  const apiCheck = {
    name: "Basic API Test",
    status: "checking",
    details: {} as any
  };

  try {
    // Try with the most likely working model
    const { text } = await generateText({
      model: google("gemini-1.5-flash"),
      prompt: "Return only the number 42 and nothing else.",
      maxTokens: 5,
    });

    apiCheck.details = {
      status: "✅ API Working",
      testResponse: text,
      responseLength: text.length
    };
    apiCheck.status = "completed";
  } catch (error: any) {
    apiCheck.status = "error";
    apiCheck.details = {
      error: error.message,
      errorCode: error.code,
      stack: error.stack?.substring(0, 500)
    };
  }

  diagnostics.checks.push(apiCheck);

  // Overall status
  const hasErrors = diagnostics.checks.some(check => check.status === "error");
  const overallStatus = hasErrors ? "❌ Issues Found" : "✅ All Checks Passed";

  return NextResponse.json({
    overallStatus,
    ...diagnostics,
    recommendations: getRecommendations(diagnostics.checks)
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt = "Generate 3 simple interview questions for a developer", model = "gemini-1.5-flash" } = body;

    console.log(`Testing with model: ${model}, prompt: ${prompt.substring(0, 50)}...`);

    const { text } = await generateText({
      model: google(model),
      prompt,
      maxTokens: 500,
      temperature: 0.7,
    });

    return NextResponse.json({
      success: true,
      model,
      prompt: prompt.substring(0, 100) + "...",
      response: text,
      responseLength: text.length,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      stack: error.stack?.substring(0, 500),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

function getRecommendations(checks: any[]): string[] {
  const recommendations: string[] = [];

  const envCheck = checks.find(c => c.name === "Environment Variables");
  if (envCheck?.details?.GOOGLE_GENERATIVE_AI_API_KEY === "❌ Missing") {
    recommendations.push("Set GOOGLE_GENERATIVE_AI_API_KEY in your .env.local file");
    recommendations.push("Get your API key from: https://aistudio.google.com/app/apikey");
    recommendations.push("Restart your development server after adding the key");
  }

  const modelCheck = checks.find(c => c.name === "Model Availability");
  if (modelCheck?.details) {
    const workingModels = Object.entries(modelCheck.details)
      .filter(([_, details]: [string, any]) => details.status?.includes("Working"))
      .map(([model, _]) => model);
    
    if (workingModels.length > 0) {
      recommendations.push(`Working models found: ${workingModels.join(", ")}`);
      recommendations.push(`Use this model instead: ${workingModels[0]}`);
    } else {
      recommendations.push("No working models found - check your API key and permissions");
    }
  }

  const apiCheck = checks.find(c => c.name === "Basic API Test");
  if (apiCheck?.status === "error") {
    recommendations.push("Basic API test failed - verify your Google AI setup");
    if (apiCheck.details?.error?.includes("API_KEY")) {
      recommendations.push("API key issue detected - regenerate your key from Google AI Studio");
    }
  }

  return recommendations;
}
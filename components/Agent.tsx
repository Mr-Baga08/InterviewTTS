// components/Agent.tsx - FIXED for VAPI Workflows
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi, vapiUtils } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

// Types (keeping the same as before)
const CallStatus = {
  INACTIVE: "INACTIVE",
  CONNECTING: "CONNECTING", 
  ACTIVE: "ACTIVE",
  PAUSED: "PAUSED",
  RECONNECTING: "RECONNECTING",
  FINISHED: "FINISHED",
  ERROR: "ERROR",
} as const;

type CallStatus = typeof CallStatus[keyof typeof CallStatus];

interface TranscriptMessage {
  id: string;
  role: "user" | "system" | "assistant";
  content: string;
  timestamp: number;
}

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
}

const avatarFallbacks = {
  ai: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%234ade80' stroke-width='2'%3E%3Cpath d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1.27c.6.34 1 .99 1 1.73a2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-.74.4-1.39 1-1.73V17a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1v-1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1V8.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z'/%3E%3C/svg%3E",
  user: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
};

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
}: AgentProps) => {
  const router = useRouter();
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<TranscriptMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vapiUtils.isReady() || !vapi) {
      setError("VAPI not initialized. Please check your token configuration.");
      setCallStatus(CallStatus.ERROR);
      return;
    }

    setError(null);

    const onCallStart = () => {
      console.log('📞 Call started event received');
      setCallStatus(CallStatus.ACTIVE);
      setError(null);
    };

    const onCallEnd = () => {
      console.log('📞 Call ended event received');
      setCallStatus(CallStatus.FINISHED);
    };

    const onMessage = (message: any) => {
      console.log('📨 Message received:', message);
      
      if (message.type === "transcript" && message.transcriptType === "final") {
        const newMessage: TranscriptMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          role: message.role === "user" ? "user" : message.role === "assistant" ? "assistant" : "system",
          content: message.transcript || "",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
      }

      // Handle function call results for interview generation
      if (message.type === "function-call-result" && type === "generate") {
        console.log('📋 Function call result:', message);
        if (message.functionCallResult?.result) {
          // Interview was generated successfully
          console.log('✅ Interview generated via workflow');
          setTimeout(() => {
            router.push("/dashboard");
          }, 2000); // Give time for final message
        }
      }
    };

    const onSpeechStart = () => {
      console.log("🎤 Speech started");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("🎤 Speech ended");
      setIsSpeaking(false);
    };

    const onError = (error: Error) => {
      console.error("❌ VAPI Error:", error);
      setError(error.message);
      
      // Enhanced error handling for workflows
      if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        setError('Workflow configuration error. Please check your workflow ID and parameters.');
      } else if (error.message?.includes('405') || error.message?.includes('Method Not Allowed')) {
        setError('API endpoint error. Please check your workflow configuration.');
      } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        setError('Authentication failed. Please check your VAPI token.');
      } else if (error.message?.includes('Workflow not found') || error.message?.includes('404')) {
        setError('Workflow not found. Please check your NEXT_PUBLIC_VAPI_WORKFLOW_ID.');
      }
      
      setCallStatus(CallStatus.ERROR);
    };

    // Setup event handlers
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      if (vapi) {
        vapi.off("call-start", onCallStart);
        vapi.off("call-end", onCallEnd);
        vapi.off("message", onMessage);
        vapi.off("speech-start", onSpeechStart);
        vapi.off("speech-end", onSpeechEnd);
        vapi.off("error", onError);
      }
    };
  }, [type, router]);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: TranscriptMessage[]) => {
      console.log("🔄 Generating feedback...");

      if (!interviewId || !userId) {
        console.error("Missing interviewId or userId for feedback generation");
        router.push("/dashboard");
        return;
      }

      try {
        const result = await createFeedback({
          interviewId,
          userId,
          transcript: messages,
          feedbackId,
        });

        if (result.success && result.data?.feedbackId) {
          console.log("✅ Feedback generated successfully");
          router.push(`/interview/${interviewId}/feedback`);
        } else {
          console.error("❌ Error saving feedback:", result.message);
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("❌ Error generating feedback:", error);
        router.push("/dashboard");
      }
    };

    if (callStatus === CallStatus.FINISHED) {
      if (type === "generate") {
        // For generate type, the workflow handles navigation
        console.log("✅ Interview generation completed");
      } else {
        handleGenerateFeedback(messages);
      }
    }
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  const handleCall = async () => {
    if (!vapiUtils.isReady() || !vapi) {
      setError("VAPI not initialized. Please check your token configuration.");
      return;
    }

    try {
      setCallStatus(CallStatus.CONNECTING);
      setError(null);

      if (type === "generate") {
        // FIXED: For workflow calls, use workflow ID as string with overrides
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        
        if (!workflowId) {
          throw new Error("VAPI Workflow ID is not configured. Please set NEXT_PUBLIC_VAPI_WORKFLOW_ID in your environment variables.");
        }

        console.log('🔄 Starting workflow call with ID:', workflowId);
        
        // FIXED: Use workflow ID as string with variableValues in overrides
        const overrides = {
          variableValues: {
            username: String(userName || ''),
            userid: String(userId || ''),
          }
        };

        console.log('📋 Workflow overrides:', overrides);

        // FIXED: Pass workflow ID as string, overrides as second parameter
        await vapi.start(workflowId, overrides);
        
      } else {
        // For interview type, use the assistant configuration
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        const assistantConfig = {
          ...interviewer,
        };

        const assistantOverrides = {
          variableValues: {
            questions: formattedQuestions,
          }
        };

        await vapi.start(assistantConfig, assistantOverrides);
      }

      console.log("✅ Call started successfully");
    } catch (error: any) {
      console.error("❌ Error starting call:", error);
      
      // Enhanced error handling
      let errorMessage = error.message;
      
      if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
        errorMessage = 'Workflow call failed. Please check your workflow configuration and variable names.';
      } else if (error.message?.includes('405')) {
        errorMessage = 'Server endpoint error. Please check your API configuration.';
      } else if (error.message?.includes('Workflow not found')) {
        errorMessage = 'Workflow not found. Please check your NEXT_PUBLIC_VAPI_WORKFLOW_ID.';
      } else if (error.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please check your VAPI token.';
      }
      
      setError(errorMessage);
      setCallStatus(CallStatus.INACTIVE);
    }
  };

  const handleDisconnect = () => {
    try {
      console.log("🛑 Stopping call...");
      setCallStatus(CallStatus.FINISHED);
      vapiUtils.stopCall();
    } catch (error: any) {
      console.error("❌ Error stopping call:", error);
      setError(error.message);
    }
  };

  // Helper functions (same as before)
  const canStartCall = (): boolean => {
    return (
      vapiUtils.isReady() && 
      vapi !== null && 
      (callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED)
    );
  };

  const isCallActive = (): boolean => {
    return callStatus === CallStatus.ACTIVE;
  };

  const hasError = (): boolean => {
    return callStatus === CallStatus.ERROR;
  };

  // Show error state if VAPI is not ready
  if (!vapiUtils.isReady() || !vapi || hasError()) {
    return (
      <div className="call-view">
        <div className="card-border">
          <div className="card-content">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-red-400 mb-2">Configuration Error</h3>
            <p className="text-white/60 text-sm text-center mb-4">
              {error || "VAPI is not properly configured"}
            </p>
            <div className="text-xs text-white/40 text-center space-y-2">
              <p>Please check your environment variables:</p>
              <div className="bg-black/30 p-3 rounded text-left">
                <code className="block">NEXT_PUBLIC_VAPI_WEB_TOKEN=your-token</code>
                <code className="block">NEXT_PUBLIC_VAPI_WORKFLOW_ID=your-workflow-id</code>
              </div>
              {type === "generate" && (
                <div className="text-yellow-400 space-y-1">
                  <p>For workflow calls, make sure:</p>
                  <ul className="text-left text-xs">
                    <li>• Your workflow is published in VAPI dashboard</li>
                    <li>• Variable names (username, userid) match your workflow</li>
                    <li>• Your workflow ID is correct</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="call-view">
        {/* AI Interviewer Card */}
        <div className="card-interviewer">
          <div className="avatar">
            <Image
              src="/ai-avatar.png"
              alt="AI Interviewer profile"
              width={65}
              height={54}
              className="object-cover rounded-full"
              priority
              onError={(e) => {
                e.currentTarget.src = avatarFallbacks.ai;
              }}
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>AI Interviewer</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png"
              alt={`${userName}'s profile`}
              width={120}
              height={120}
              className="rounded-full object-cover size-[120px]"
              priority
              onError={(e) => {
                e.currentTarget.src = avatarFallbacks.user;
              }}
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && !hasError() && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Transcript Display */}
      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Call Controls */}
      <div className="w-full flex justify-center">
        {!isCallActive() ? (
          <button 
            className="relative btn-call" 
            onClick={handleCall}
            disabled={!canStartCall()}
          >
            <span
              className={cn(
                "absolute animate-ping rounded-full opacity-75",
                callStatus !== CallStatus.CONNECTING && "hidden"
              )}
            />

            <span className="relative">
              {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED
                ? type === "generate" 
                  ? "Start Interview Creation"
                  : "Start Interview"
                : callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : "Start"}
            </span>
          </button>
        ) : (
          <button 
            className="btn-disconnect" 
            onClick={handleDisconnect}
          >
            End Session
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
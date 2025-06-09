// components/Agent.tsx - FIXED VERSION with proper TypeScript types
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { vapi, vapiUtils, setupVapiEventHandlers } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";

// Define all necessary types locally - using const assertion for better type inference
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

const MessageRoleEnum = {
  USER: "user",
  SYSTEM: "system",
  ASSISTANT: "assistant",
} as const;

type MessageRoleEnum = typeof MessageRoleEnum[keyof typeof MessageRoleEnum];

// Helper function to convert MessageRoleEnum to string
const convertRoleToString = (role: MessageRoleEnum): "user" | "system" | "assistant" => {
  switch (role) {
    case MessageRoleEnum.USER:
      return "user";
    case MessageRoleEnum.SYSTEM:
      return "system";
    case MessageRoleEnum.ASSISTANT:
      return "assistant";
    default:
      return "user";
  }
};

// TranscriptMessage interface
interface TranscriptMessage {
  id: string;
  role: "user" | "system" | "assistant";
  content: string;
  timestamp: number;
}

// AgentProps interface
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
    // Check if VAPI is ready
    if (!vapiUtils.isReady() || !vapi) {
      setError("VAPI not initialized. Please check your token configuration.");
      setCallStatus(CallStatus.ERROR);
      return;
    }

    // Clear any previous error
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
          role: convertRoleToString(message.role),
          content: message.transcript || "",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newMessage]);
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
      
      if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
        setError('Authentication failed. Please check your VAPI token.');
        setCallStatus(CallStatus.ERROR);
      }
    };

    // Setup event handlers - VAPI is guaranteed to be non-null here
    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      // Cleanup - check if vapi is still available
      if (vapi) {
        vapi.off("call-start", onCallStart);
        vapi.off("call-end", onCallEnd);
        vapi.off("message", onMessage);
        vapi.off("speech-start", onSpeechStart);
        vapi.off("speech-end", onSpeechEnd);
        vapi.off("error", onError);
      }
    };
  }, []);

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
        router.push("/dashboard");
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
        const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        if (!workflowId) {
          throw new Error("VAPI Workflow ID is not configured");
        }

        await vapiUtils.startCall(workflowId, {
          variableValues: {
            username: userName,
            userid: userId,
          },
        });
      } else {
        let formattedQuestions = "";
        if (questions && questions.length > 0) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }

        await vapiUtils.startCall(interviewer, {
          variableValues: {
            questions: formattedQuestions,
          },
        });
      }

      console.log("✅ Call started successfully");
    } catch (error: any) {
      console.error("❌ Error starting call:", error);
      setError(error.message);
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

  // Helper function to check if call can be started
  const canStartCall = (): boolean => {
    return (
      vapiUtils.isReady() && 
      vapi !== null && 
      (callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED)
    );
  };

  // Helper function to check if call is active
  const isCallActive = (): boolean => {
    return callStatus === CallStatus.ACTIVE;
  };

  // Helper function to check if there's an error state
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
            <h3 className="text-red-400 mb-2">VAPI Configuration Error</h3>
            <p className="text-white/60 text-sm text-center mb-4">
              {error || "VAPI is not properly configured"}
            </p>
            <div className="text-xs text-white/40 text-center">
              <p>Please check your .env.local file:</p>
              <code className="bg-black/30 px-2 py-1 rounded mt-1 inline-block">
                NEXT_PUBLIC_VAPI_WEB_TOKEN=your-token-here
              </code>
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
                ? "Start Interview"
                : callStatus === CallStatus.CONNECTING
                ? "Connecting..."
                : "Start Interview"}
            </span>
          </button>
        ) : (
          <button 
            className="btn-disconnect" 
            onClick={handleDisconnect}
          >
            End Interview
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
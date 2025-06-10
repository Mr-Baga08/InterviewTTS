// // components/Agent.tsx - FIXED for VAPI Workflows
// "use client";

// import Image from "next/image";
// import { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";

// import { cn } from "@/lib/utils";
// import { vapi, vapiUtils } from "@/lib/vapi.sdk";
// import { interviewer } from "@/constants";
// import { createFeedback } from "@/lib/actions/general.action";

// // Types (keeping the same as before)
// const CallStatus = {
//   INACTIVE: "INACTIVE",
//   CONNECTING: "CONNECTING", 
//   ACTIVE: "ACTIVE",
//   PAUSED: "PAUSED",
//   RECONNECTING: "RECONNECTING",
//   FINISHED: "FINISHED",
//   ERROR: "ERROR",
// } as const;

// type CallStatus = typeof CallStatus[keyof typeof CallStatus];

// interface TranscriptMessage {
//   id: string;
//   role: "user" | "system" | "assistant";
//   content: string;
//   timestamp: number;
// }

// interface AgentProps {
//   userName: string;
//   userId?: string;
//   interviewId?: string;
//   feedbackId?: string;
//   type: "generate" | "interview";
//   questions?: string[];
// }

// const avatarFallbacks = {
//   ai: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%234ade80' stroke-width='2'%3E%3Cpath d='M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1v1.27c.6.34 1 .99 1 1.73a2 2 0 0 1-2 2 2 2 0 0 1-2-2c0-.74.4-1.39 1-1.73V17a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1v-1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1V8.27c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z'/%3E%3C/svg%3E",
//   user: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E"
// };

// const Agent = ({
//   userName,
//   userId,
//   interviewId,
//   feedbackId,
//   type,
//   questions,
// }: AgentProps) => {
//   const router = useRouter();
//   const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
//   const [messages, setMessages] = useState<TranscriptMessage[]>([]);
//   const [isSpeaking, setIsSpeaking] = useState(false);
//   const [lastMessage, setLastMessage] = useState<string>("");
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     if (!vapiUtils.isReady() || !vapi) {
//       setError("VAPI not initialized. Please check your token configuration.");
//       setCallStatus(CallStatus.ERROR);
//       return;
//     }

//     setError(null);

//     const onCallStart = () => {
//       console.log('📞 Call started event received');
//       setCallStatus(CallStatus.ACTIVE);
//       setError(null);
//     };

//     const onCallEnd = () => {
//       console.log('📞 Call ended event received');
//       setCallStatus(CallStatus.FINISHED);
//     };

//     const onMessage = (message: any) => {
//       console.log('📨 Message received:', message);
      
//       if (message.type === "transcript" && message.transcriptType === "final") {
//         const newMessage: TranscriptMessage = {
//           id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//           role: message.role === "user" ? "user" : message.role === "assistant" ? "assistant" : "system",
//           content: message.transcript || "",
//           timestamp: Date.now(),
//         };
//         setMessages((prev) => [...prev, newMessage]);
//       }

//       // Handle function call results for interview generation
//       if (message.type === "function-call-result" && type === "generate") {
//         console.log('📋 Function call result:', message);
//         if (message.functionCallResult?.result) {
//           // Interview was generated successfully
//           console.log('✅ Interview generated via workflow');
//           setTimeout(() => {
//             router.push("/dashboard");
//           }, 2000); // Give time for final message
//         }
//       }
//     };

//     const onSpeechStart = () => {
//       console.log("🎤 Speech started");
//       setIsSpeaking(true);
//     };

//     const onSpeechEnd = () => {
//       console.log("🎤 Speech ended");
//       setIsSpeaking(false);
//     };

//     const onError = (error: Error) => {
//       console.error("❌ VAPI Error:", error);
//       setError(error.message);
      
//       // Enhanced error handling for workflows
//       if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
//         setError('Workflow configuration error. Please check your workflow ID and parameters.');
//       } else if (error.message?.includes('405') || error.message?.includes('Method Not Allowed')) {
//         setError('API endpoint error. Please check your workflow configuration.');
//       } else if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
//         setError('Authentication failed. Please check your VAPI token.');
//       } else if (error.message?.includes('Workflow not found') || error.message?.includes('404')) {
//         setError('Workflow not found. Please check your NEXT_PUBLIC_VAPI_WORKFLOW_ID.');
//       }
      
//       setCallStatus(CallStatus.ERROR);
//     };

//     // Setup event handlers
//     vapi.on("call-start", onCallStart);
//     vapi.on("call-end", onCallEnd);
//     vapi.on("message", onMessage);
//     vapi.on("speech-start", onSpeechStart);
//     vapi.on("speech-end", onSpeechEnd);
//     vapi.on("error", onError);

//     return () => {
//       if (vapi) {
//         vapi.off("call-start", onCallStart);
//         vapi.off("call-end", onCallEnd);
//         vapi.off("message", onMessage);
//         vapi.off("speech-start", onSpeechStart);
//         vapi.off("speech-end", onSpeechEnd);
//         vapi.off("error", onError);
//       }
//     };
//   }, [type, router]);

//   useEffect(() => {
//     if (messages.length > 0) {
//       setLastMessage(messages[messages.length - 1].content);
//     }

//     const handleGenerateFeedback = async (messages: TranscriptMessage[]) => {
//       console.log("🔄 Generating feedback...");

//       if (!interviewId || !userId) {
//         console.error("Missing interviewId or userId for feedback generation");
//         router.push("/dashboard");
//         return;
//       }

//       try {
//         const result = await createFeedback({
//           interviewId,
//           userId,
//           transcript: messages,
//           feedbackId,
//         });

//         if (result.success && result.data?.feedbackId) {
//           console.log("✅ Feedback generated successfully");
//           router.push(`/interview/${interviewId}/feedback`);
//         } else {
//           console.error("❌ Error saving feedback:", result.message);
//           router.push("/dashboard");
//         }
//       } catch (error) {
//         console.error("❌ Error generating feedback:", error);
//         router.push("/dashboard");
//       }
//     };

//     if (callStatus === CallStatus.FINISHED) {
//       if (type === "generate") {
//         // For generate type, the workflow handles navigation
//         console.log("✅ Interview generation completed");
//       } else {
//         handleGenerateFeedback(messages);
//       }
//     }
//   }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

//   const handleCall = async () => {
//     if (!vapiUtils.isReady() || !vapi) {
//       setError("VAPI not initialized. Please check your token configuration.");
//       return;
//     }

//     try {
//       setCallStatus(CallStatus.CONNECTING);
//       setError(null);

//       if (type === "generate") {
//         // FIXED: For workflow calls, use workflow ID as string with overrides
//         const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
        
//         if (!workflowId) {
//           throw new Error("VAPI Workflow ID is not configured. Please set NEXT_PUBLIC_VAPI_WORKFLOW_ID in your environment variables.");
//         }

//         console.log('🔄 Starting workflow call with ID:', workflowId);
        
//         // FIXED: Use workflow ID as string with variableValues in overrides
//         const overrides = {
//           variableValues: {
//             username: String(userName || ''),
//             userid: String(userId || ''),
//           }
//         };

//         console.log('📋 Workflow overrides:', overrides);

//         // FIXED: Pass workflow ID as string, overrides as second parameter
//         await vapi.start(workflowId, overrides);
        
//       } else {
//         // For interview type, use the assistant configuration
//         let formattedQuestions = "";
//         if (questions && questions.length > 0) {
//           formattedQuestions = questions
//             .map((question) => `- ${question}`)
//             .join("\n");
//         }

//         const assistantConfig = {
//           ...interviewer,
//         };

//         const assistantOverrides = {
//           variableValues: {
//             questions: formattedQuestions,
//           }
//         };

//         await vapi.start(assistantConfig, assistantOverrides);
//       }

//       console.log("✅ Call started successfully");
//     } catch (error: any) {
//       console.error("❌ Error starting call:", error);
      
//       // Enhanced error handling
//       let errorMessage = error.message;
      
//       if (error.message?.includes('400') || error.message?.includes('Bad Request')) {
//         errorMessage = 'Workflow call failed. Please check your workflow configuration and variable names.';
//       } else if (error.message?.includes('405')) {
//         errorMessage = 'Server endpoint error. Please check your API configuration.';
//       } else if (error.message?.includes('Workflow not found')) {
//         errorMessage = 'Workflow not found. Please check your NEXT_PUBLIC_VAPI_WORKFLOW_ID.';
//       } else if (error.message?.includes('Unauthorized')) {
//         errorMessage = 'Authentication failed. Please check your VAPI token.';
//       }
      
//       setError(errorMessage);
//       setCallStatus(CallStatus.INACTIVE);
//     }
//   };

//   const handleDisconnect = () => {
//     try {
//       console.log("🛑 Stopping call...");
//       setCallStatus(CallStatus.FINISHED);
//       vapiUtils.stopCall();
//     } catch (error: any) {
//       console.error("❌ Error stopping call:", error);
//       setError(error.message);
//     }
//   };

//   // Helper functions (same as before)
//   const canStartCall = (): boolean => {
//     return (
//       vapiUtils.isReady() && 
//       vapi !== null && 
//       (callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED)
//     );
//   };

//   const isCallActive = (): boolean => {
//     return callStatus === CallStatus.ACTIVE;
//   };

//   const hasError = (): boolean => {
//     return callStatus === CallStatus.ERROR;
//   };

//   // Show error state if VAPI is not ready
//   if (!vapiUtils.isReady() || !vapi || hasError()) {
//     return (
//       <div className="call-view">
//         <div className="card-border">
//           <div className="card-content">
//             <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
//               <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//               </svg>
//             </div>
//             <h3 className="text-red-400 mb-2">Configuration Error</h3>
//             <p className="text-white/60 text-sm text-center mb-4">
//               {error || "VAPI is not properly configured"}
//             </p>
//             <div className="text-xs text-white/40 text-center space-y-2">
//               <p>Please check your environment variables:</p>
//               <div className="bg-black/30 p-3 rounded text-left">
//                 <code className="block">NEXT_PUBLIC_VAPI_WEB_TOKEN=your-token</code>
//                 <code className="block">NEXT_PUBLIC_VAPI_WORKFLOW_ID=your-workflow-id</code>
//               </div>
//               {type === "generate" && (
//                 <div className="text-yellow-400 space-y-1">
//                   <p>For workflow calls, make sure:</p>
//                   <ul className="text-left text-xs">
//                     <li>• Your workflow is published in VAPI dashboard</li>
//                     <li>• Variable names (username, userid) match your workflow</li>
//                     <li>• Your workflow ID is correct</li>
//                   </ul>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="call-view">
//         {/* AI Interviewer Card */}
//         <div className="card-interviewer">
//           <div className="avatar">
//             <Image
//               src="/ai-avatar.png"
//               alt="AI Interviewer profile"
//               width={65}
//               height={54}
//               className="object-cover rounded-full"
//               priority
//               onError={(e) => {
//                 e.currentTarget.src = avatarFallbacks.ai;
//               }}
//             />
//             {isSpeaking && <span className="animate-speak" />}
//           </div>
//           <h3>AI Interviewer</h3>
//         </div>

//         {/* User Profile Card */}
//         <div className="card-border">
//           <div className="card-content">
//             <Image
//               src="/user-avatar.png"
//               alt={`${userName}'s profile`}
//               width={120}
//               height={120}
//               className="rounded-full object-cover size-[120px]"
//               priority
//               onError={(e) => {
//                 e.currentTarget.src = avatarFallbacks.user;
//               }}
//             />
//             <h3>{userName}</h3>
//           </div>
//         </div>
//       </div>

//       {/* Error Display */}
//       {error && !hasError() && (
//         <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
//           <div className="flex items-center gap-2 text-red-400">
//             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//             </svg>
//             <span className="text-sm">{error}</span>
//           </div>
//         </div>
//       )}

//       {/* Transcript Display */}
//       {messages.length > 0 && (
//         <div className="transcript-border">
//           <div className="transcript">
//             <p
//               key={lastMessage}
//               className={cn(
//                 "transition-opacity duration-500 opacity-0",
//                 "animate-fadeIn opacity-100"
//               )}
//             >
//               {lastMessage}
//             </p>
//           </div>
//         </div>
//       )}

//       {/* Call Controls */}
//       <div className="w-full flex justify-center">
//         {!isCallActive() ? (
//           <button 
//             className="relative btn-call" 
//             onClick={handleCall}
//             disabled={!canStartCall()}
//           >
//             <span
//               className={cn(
//                 "absolute animate-ping rounded-full opacity-75",
//                 callStatus !== CallStatus.CONNECTING && "hidden"
//               )}
//             />

//             <span className="relative">
//               {callStatus === CallStatus.INACTIVE || callStatus === CallStatus.FINISHED
//                 ? type === "generate" 
//                   ? "Start Interview Creation"
//                   : "Start Interview"
//                 : callStatus === CallStatus.CONNECTING
//                 ? "Connecting..."
//                 : "Start"}
//             </span>
//           </button>
//         ) : (
//           <button 
//             className="btn-disconnect" 
//             onClick={handleDisconnect}
//           >
//             End Session
//           </button>
//         )}
//       </div>
//     </>
//   );
// };

// export default Agent;

// components/Agent.tsx - Updated to use LiveKit Pipeline
"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import LiveKitVoiceAgent from './LiveKitVoiceAgent';

interface AgentProps {
  userName: string;
  userId: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  interviewType?: 'technical' | 'behavioral' | 'mixed';
  className?: string;
}

const Agent: React.FC<AgentProps> = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions = [],
  interviewType = 'mixed',
  className
}) => {
  // Determine interview type from questions if not specified
  const determineInterviewType = (questionList: string[]): 'technical' | 'behavioral' | 'mixed' => {
    if (questionList.length === 0) return 'mixed';
    
    const technicalKeywords = ['code', 'algorithm', 'system', 'database', 'api', 'framework', 'performance'];
    const behavioralKeywords = ['team', 'conflict', 'leadership', 'project', 'challenge', 'experience'];
    
    let technicalCount = 0;
    let behavioralCount = 0;
    
    questionList.forEach(question => {
      const lowerQuestion = question.toLowerCase();
      if (technicalKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        technicalCount++;
      }
      if (behavioralKeywords.some(keyword => lowerQuestion.includes(keyword))) {
        behavioralCount++;
      }
    });
    
    const ratio = technicalCount / (technicalCount + behavioralCount || 1);
    if (ratio > 0.7) return 'technical';
    if (ratio < 0.3) return 'behavioral';
    return 'mixed';
  };

  const finalInterviewType = interviewType || determineInterviewType(questions);

  return (
    <div className={cn('agent-container', className)}>
      {/* Header Information */}
      <div className="mb-6">
        <div className="apple-glass rounded-2xl p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              {type === 'generate' ? 'Interview Creation' : 'AI Interview Session'}
            </h2>
            <p className="text-white/70">
              {type === 'generate' 
                ? 'Configure and create your personalized interview'
                : `${finalInterviewType.charAt(0).toUpperCase() + finalInterviewType.slice(1)} Interview - ${questions.length} questions`
              }
            </p>
            
            {type === 'interview' && questions.length > 0 && (
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Est. {Math.max(20, questions.length * 3)} minutes</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span>AI-Powered</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pre-Interview Instructions */}
      {type === 'interview' && (
        <div className="mb-6">
          <div className="apple-glass rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Before You Begin
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Microphone Ready</h4>
                    <p className="text-white/60 text-sm">Ensure your microphone is working and positioned correctly</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Take Your Time</h4>
                    <p className="text-white/60 text-sm">Think before answering, quality over speed</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">Natural Conversation</h4>
                    <p className="text-white/60 text-sm">Speak naturally as you would in a real interview</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <div>
                    <h4 className="text-white font-medium">AI-Powered Analysis</h4>
                    <p className="text-white/60 text-sm">Receive detailed feedback on your performance</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LiveKit Voice Agent */}
      <LiveKitVoiceAgent
        userName={userName}
        userId={userId}
        interviewId={interviewId}
        feedbackId={feedbackId}
        type={type}
        questions={questions}
        interviewType={finalInterviewType}
        className="animate-apple-slide"
      />

      {/* Technology Information */}
      <div className="mt-6">
        <div className="apple-glass rounded-2xl p-4">
          <div className="flex items-center justify-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>Powered by LiveKit</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>Real-time Voice</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Agent;
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import Image from "next/image";
import { 
  Calendar, 
  Star, 
  Clock, 
  TrendingUp, 
  Play, 
  CheckCircle, 
  AlertCircle,
  MoreHorizontal,
  BookOpen,
  Target,
  Code,
  Users,
  Brain
} from "lucide-react";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";

import { cn, getRandomInterviewCover } from "@/lib/utils";
import { getFeedbackByInterviewId } from "@/lib/actions/general.action";

// Extend dayjs with relativeTime plugin
dayjs.extend(relativeTime);

// Enhanced types
type InterviewType = "Behavioral" | "Technical" | "Mixed" | "System Design" | "Coding" | "Leadership";
type InterviewVariant = "default" | "compact" | "featured";
type PerformanceLevel = "Exceptional" | "Excellent" | "Good" | "Fair" | "Needs Work";

interface EnhancedInterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
  variant?: InterviewVariant;
  showProgress?: boolean;
  showActions?: boolean;
  isLoading?: boolean;
  onRetake?: () => void;
  onDelete?: () => void;
  className?: string;
}

interface TypeConfig {
  bg: string;
  border: string;
  text: string;
  badge: string;
  icon: React.ReactNode;
}

interface PerformanceConfig {
  level: PerformanceLevel;
  color: string;
  bg: string;
}

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
  variant = "default",
  showProgress = true,
  showActions = true,
  isLoading = false,
  onRetake,
  onDelete,
  className,
}: EnhancedInterviewCardProps) => {
  // Safely get feedback data
  let feedback: any = null;
  if (userId && interviewId) {
    try {
      const feedbackResult = await getFeedbackByInterviewId({
        interviewId,
        userId,
      });
      // Extract data from ActionResult if successful
      feedback = feedbackResult?.success ? feedbackResult.data : null;
    } catch (error) {
      console.warn("Failed to fetch feedback:", error);
      feedback = null;
    }
  }

  // Normalize interview type with better mapping
  const normalizeInterviewType = (type: string): InterviewType => {
    const lowerType = type.toLowerCase().trim();
    
    if (/mix/gi.test(type)) return "Mixed";
    if (/behav/gi.test(type)) return "Behavioral";
    if (/tech/gi.test(type)) return "Technical";
    if (/system|design/gi.test(type)) return "System Design";
    if (/cod/gi.test(type)) return "Coding";
    if (/lead/gi.test(type)) return "Leadership";
    
    // Default fallback
    return "Technical";
  };

  const normalizedType = normalizeInterviewType(type);
  const hasCompleted = !!feedback;
  const score = feedback?.totalScore || 0;

  // Enhanced type styling with comprehensive coverage
  const typeConfig: Record<InterviewType, TypeConfig> = {
    Behavioral: {
      bg: "bg-gradient-to-br from-purple-500/20 to-purple-600/10",
      border: "border-purple-500/30",
      text: "text-purple-400",
      badge: "bg-purple-500/20 border-purple-500/30",
      icon: <Target className="w-4 h-4" />,
    },
    Technical: {
      bg: "bg-gradient-to-br from-blue-500/20 to-blue-600/10",
      border: "border-blue-500/30", 
      text: "text-blue-400",
      badge: "bg-blue-500/20 border-blue-500/30",
      icon: <BookOpen className="w-4 h-4" />,
    },
    Mixed: {
      bg: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
      badge: "bg-indigo-500/20 border-indigo-500/30",
      icon: <TrendingUp className="w-4 h-4" />,
    },
    "System Design": {
      bg: "bg-gradient-to-br from-emerald-500/20 to-emerald-600/10",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      badge: "bg-emerald-500/20 border-emerald-500/30",
      icon: <Brain className="w-4 h-4" />,
    },
    Coding: {
      bg: "bg-gradient-to-br from-orange-500/20 to-orange-600/10",
      border: "border-orange-500/30",
      text: "text-orange-400", 
      badge: "bg-orange-500/20 border-orange-500/30",
      icon: <Code className="w-4 h-4" />,
    },
    Leadership: {
      bg: "bg-gradient-to-br from-rose-500/20 to-rose-600/10",
      border: "border-rose-500/30",
      text: "text-rose-400",
      badge: "bg-rose-500/20 border-rose-500/30",
      icon: <Users className="w-4 h-4" />,
    },
  };

  const config = typeConfig[normalizedType];

  // Performance level calculation with proper typing
  const getPerformanceLevel = (score: number): PerformanceConfig => {
    if (score >= 90) return { level: "Exceptional", color: "text-emerald-400", bg: "bg-emerald-500/20" };
    if (score >= 80) return { level: "Excellent", color: "text-green-400", bg: "bg-green-500/20" };
    if (score >= 70) return { level: "Good", color: "text-blue-400", bg: "bg-blue-500/20" };
    if (score >= 60) return { level: "Fair", color: "text-yellow-400", bg: "bg-yellow-500/20" };
    return { level: "Needs Work", color: "text-orange-400", bg: "bg-orange-500/20" };
  };

  const performance = getPerformanceLevel(score);
  
  // Safe date formatting with fallbacks
  const safeCreatedAt = feedback?.createdAt || createdAt || new Date().toISOString();
  const formattedDate = dayjs(safeCreatedAt).format("MMM D, YYYY");
  const timeAgo = dayjs(safeCreatedAt).fromNow();

  // Variant configurations
  const variantConfig: Record<InterviewVariant, {
    container: string;
    content: string;
    image: string;
  }> = {
    default: {
      container: "w-[360px] max-sm:w-full min-h-[400px]",
      content: "p-6 gap-6",
      image: "w-20 h-20",
    },
    compact: {
      container: "w-[320px] max-sm:w-full min-h-[340px]",
      content: "p-5 gap-5",
      image: "w-16 h-16",
    },
    featured: {
      container: "w-[400px] max-sm:w-full min-h-[450px]",
      content: "p-7 gap-7",
      image: "w-24 h-24",
    },
  };

  const vConfig = variantConfig[variant];

  return (
    <div className={cn(
      "group relative overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
      vConfig.container,
      "hover:scale-[1.02] hover:-translate-y-1",
      isLoading && "opacity-50 pointer-events-none",
      className
    )}>
      {/* Apple Glass Border */}
      <div className={cn(
        "absolute inset-0 rounded-3xl p-0.5",
        "bg-gradient-to-br from-white/10 via-white/5 to-transparent",
        "backdrop-blur-xl border border-white/10",
        "group-hover:border-white/20 transition-all duration-500"
      )}>
        {/* Main Card Content */}
        <div className={cn(
          "relative h-full w-full rounded-3xl overflow-hidden",
          "bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95",
          "backdrop-blur-xl border border-white/5",
          config.bg
        )}>
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* Status Indicator */}
          <div className="absolute top-4 left-4 z-10">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
              hasCompleted 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
            )}>
              {hasCompleted ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {hasCompleted ? "Completed" : "Ready"}
            </div>
          </div>

          {/* Type Badge */}
          <div className="absolute top-4 right-4 z-10">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border",
              config.badge,
              config.text
            )}>
              {config.icon}
              {normalizedType}
            </div>
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="absolute top-4 right-16 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button 
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-4 h-4 text-white/70" />
              </button>
            </div>
          )}

          {/* Main Content */}
          <div className={cn("flex flex-col justify-between h-full", vConfig.content)}>
            <div className="space-y-4">
              {/* Cover Image and Title */}
              <div className="flex items-start gap-4 mt-12">
                <div className="relative">
                  <div className={cn(
                    "relative overflow-hidden rounded-2xl border-2 border-white/10",
                    "bg-gradient-to-br from-white/10 to-white/5",
                    vConfig.image
                  )}>
                    <Image
                      src={getRandomInterviewCover()}
                      alt={`${role} interview cover`}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  
                  {/* Score Badge on Image */}
                  {hasCompleted && (
                    <div className={cn(
                      "absolute -bottom-2 -right-2 px-2 py-1 rounded-lg text-xs font-bold",
                      "border backdrop-blur-sm",
                      performance.bg,
                      performance.color,
                      "border-current/30"
                    )}>
                      {score}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white capitalize leading-tight line-clamp-2">
                    {role} Interview
                  </h3>
                  
                  {hasCompleted && (
                    <div className={cn(
                      "inline-flex items-center gap-1 mt-1 px-2 py-1 rounded-md text-xs font-medium",
                      performance.bg,
                      performance.color
                    )}>
                      <TrendingUp className="w-3 h-3" />
                      {performance.level}
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="flex items-center gap-4 text-xs text-white/60">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{timeAgo}</span>
                </div>

                {hasCompleted && (
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-current text-yellow-400" />
                    <span className="font-medium text-white/80">{score}/100</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {showProgress && hasCompleted && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Performance</span>
                    <span className={performance.color}>{score}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000 ease-out",
                        score >= 80 ? "bg-gradient-to-r from-green-500 to-emerald-500" :
                        score >= 60 ? "bg-gradient-to-r from-blue-500 to-indigo-500" :
                        "bg-gradient-to-r from-orange-500 to-red-500"
                      )}
                      style={{ width: `${Math.min(score, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <p className="text-sm text-white/70 leading-relaxed line-clamp-3">
                {(feedback?.finalAssessment) ||
                  "Ready to practice? This AI-powered interview will help you improve your skills and build confidence for your next opportunity."}
              </p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              {/* Tech Stack */}
              <div className="flex-1 min-w-0">
                <DisplayTechIcons techStack={techstack} />
              </div>

              {/* Action Button */}
              <Button 
                asChild
                variant={hasCompleted ? "secondary" : "default"}
                size="sm"
                className={cn(
                  "ml-4 min-w-fit transition-all duration-300",
                  hasCompleted 
                    ? "apple-glass border-white/20 text-white/90 hover:bg-white/10" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl"
                )}
              >
                <Link
                  href={
                    feedback && interviewId
                      ? `/interview/${interviewId}/feedback`
                      : `/interview/${interviewId || ""}`
                  }
                  className="flex items-center gap-2"
                >
                  {feedback ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      View Results
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Interview
                    </>
                  )}
                </Link>
              </Button>
            </div>
          </div>

          {/* Hover Glow Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
            <div className={cn(
              "absolute inset-0 rounded-3xl",
              "bg-gradient-to-br from-white/5 via-transparent to-transparent"
            )} />
          </div>
        </div>
      </div>

      {/* External Glow */}
      <div className={cn(
        "absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 -z-10",
        "bg-gradient-to-br from-blue-500/20 via-purple-500/10 to-transparent blur-xl scale-110"
      )} />
    </div>
  );
};

// Skeleton Loading Component
export const InterviewCardSkeleton = ({ 
  variant = "default" 
}: { 
  variant?: InterviewVariant 
}) => {
  const vConfig: Record<InterviewVariant, string> = {
    default: "w-[360px] max-sm:w-full min-h-[400px]",
    compact: "w-[320px] max-sm:w-full min-h-[340px]", 
    featured: "w-[400px] max-sm:w-full min-h-[450px]",
  };

  return (
    <div className={cn("animate-pulse", vConfig[variant])}>
      <div className="apple-glass rounded-3xl p-6 h-full">
        <div className="space-y-4">
          <div className="flex justify-between">
            <div className="h-6 w-20 bg-white/10 rounded-full" />
            <div className="h-6 w-16 bg-white/10 rounded-full" />
          </div>
          
          <div className="flex gap-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl" />
            <div className="space-y-2 flex-1">
              <div className="h-5 bg-white/10 rounded w-3/4" />
              <div className="h-4 bg-white/10 rounded w-1/2" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-2/3" />
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-8 h-8 bg-white/10 rounded-full" />
              ))}
            </div>
            <div className="h-9 w-24 bg-white/10 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
export type { EnhancedInterviewCardProps, InterviewType, InterviewVariant, PerformanceLevel };
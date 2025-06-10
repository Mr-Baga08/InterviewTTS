// lib/livekit/agent/pipeline.ts
export interface InterviewPipelineConfig {
    interviewType: 'technical' | 'behavioral' | 'mixed';
    questions: string[];
    systemPrompt: string;
  }
  
  export class InterviewPipeline {
    private currentQuestionIndex = 0;
    private questions: string[] = [];
    private interviewType: string;
    private systemPrompt: string;
  
    constructor(private config: InterviewPipelineConfig) {
      this.questions = config.questions;
      this.interviewType = config.interviewType;
      this.systemPrompt = config.systemPrompt;
    }
  
    async initialize(): Promise<void> {
      console.log(`🎯 Initializing ${this.interviewType} interview pipeline with ${this.questions.length} questions`);
    }
  
    async getWelcomeMessage(): Promise<string> {
      const firstQuestion = this.questions[0];
      this.currentQuestionIndex = 1;
      
      return `Hello! Welcome to your ${this.interviewType} interview practice session. I'm excited to help you improve your interview skills today. Let's begin with our first question: ${firstQuestion}`;
    }
  
    async processUserResponse(userResponse: string, conversationHistory: any[]): Promise<string> {
      // Analyze response quality and determine next action
      const shouldAskFollowUp = this.shouldAskFollowUp(userResponse);
      
      if (shouldAskFollowUp) {
        return this.generateFollowUpQuestion(userResponse);
      } else {
        return this.moveToNextQuestion();
      }
    }
  
    private shouldAskFollowUp(response: string): boolean {
      // Simple heuristics to determine if we need a follow-up
      const wordCount = response.split(' ').length;
      const hasSpecifics = /\b(implemented|built|designed|created|managed)\b/i.test(response);
      
      // Ask follow-up if response is too short or lacks specifics
      return wordCount < 20 || !hasSpecifics;
    }
  
    private generateFollowUpQuestion(response: string): string {
      const followUps = [
        "Can you tell me more about your specific role in that?",
        "What challenges did you face and how did you overcome them?",
        "Can you walk me through your thought process?",
        "What would you do differently if you had to do it again?",
        "How did you measure the success of that project?",
      ];
      
      return followUps[Math.floor(Math.random() * followUps.length)];
    }
  
    private moveToNextQuestion(): string {
      if (this.currentQuestionIndex >= this.questions.length) {
        return "Thank you for answering all the questions. We'll now conclude the interview and generate your feedback.";
      }
  
      const nextQuestion = this.questions[this.currentQuestionIndex];
      this.currentQuestionIndex++;
      
      const acknowledgment = this.getRandomAcknowledgment();
      return `${acknowledgment} Let's move on to the next question: ${nextQuestion}`;
    }
  
    private getRandomAcknowledgment(): string {
      const acknowledgments = [
        "That's a great example.",
        "I appreciate the detail in your response.",
        "That shows good problem-solving skills.",
        "Thank you for that insight.",
        "That's exactly the kind of thinking we're looking for.",
      ];
      
      return acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    }
  
    isComplete(): boolean {
      return this.currentQuestionIndex >= this.questions.length;
    }
  
    getProgress(): { current: number; total: number; percentage: number } {
      return {
        current: this.currentQuestionIndex,
        total: this.questions.length,
        percentage: Math.round((this.currentQuestionIndex / this.questions.length) * 100)
      };
    }
  }
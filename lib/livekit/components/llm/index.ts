// lib/livekit/components/llm/index.ts - LLM Component Factory
import { LLMComponent, VoiceMessage } from '@/types/livekit';
import { PROVIDER_CONFIGS } from '@/lib/livekit/config';

export class OpenAILLMComponent implements LLMComponent {
  private systemPrompt: string = '';
  
  constructor(
    private config = PROVIDER_CONFIGS.llm.openai,
    private model = 'gpt-4o'
  ) {}

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  async generateResponse(prompt: string, context: VoiceMessage[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);
      
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 300,
          stream: false, // Set to true for streaming responses
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      console.log('🤖 OpenAI Response:', content.substring(0, 100) + '...');
      return content.trim();
      
    } catch (error) {
      console.error('❌ OpenAI LLM Error:', error);
      throw error;
    }
  }

  private buildMessages(prompt: string, context: VoiceMessage[]) {
    const messages: any[] = [];
    
    // Add system prompt
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Add conversation context (last 10 messages to stay within token limits)
    const recentContext = context.slice(-10);
    for (const msg of recentContext) {
      if (msg.type !== 'system') {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }
}

export class OllamaLLMComponent implements LLMComponent {
  private systemPrompt: string = '';
  
  constructor(
    private config = PROVIDER_CONFIGS.llm.ollama,
    private model = 'llama2'
  ) {}

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  async generateResponse(prompt: string, context: VoiceMessage[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);
      
      const response = await fetch(`${this.config.baseURL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 300,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.message?.content || '';
      
      console.log('🦙 Ollama Response:', content.substring(0, 100) + '...');
      return content.trim();
      
    } catch (error) {
      console.error('❌ Ollama LLM Error:', error);
      throw error;
    }
  }

  private buildMessages(prompt: string, context: VoiceMessage[]) {
    const messages: any[] = [];
    
    // Add system prompt
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Add conversation context
    const recentContext = context.slice(-8); // Smaller context for local models
    for (const msg of recentContext) {
      if (msg.type !== 'system') {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }
}

export class LMStudioLLMComponent implements LLMComponent {
  private systemPrompt: string = '';
  
  constructor(
    private config = PROVIDER_CONFIGS.llm.lmstudio
  ) {}

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }

  async generateResponse(prompt: string, context: VoiceMessage[]): Promise<string> {
    try {
      const messages = this.buildMessages(prompt, context);
      
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          temperature: 0.7,
          max_tokens: 300,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`LM Studio API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      console.log('🏠 LM Studio Response:', content.substring(0, 100) + '...');
      return content.trim();
      
    } catch (error) {
      console.error('❌ LM Studio LLM Error:', error);
      throw error;
    }
  }

  private buildMessages(prompt: string, context: VoiceMessage[]) {
    const messages: any[] = [];
    
    // Add system prompt
    if (this.systemPrompt) {
      messages.push({
        role: 'system',
        content: this.systemPrompt
      });
    }
    
    // Add conversation context
    const recentContext = context.slice(-6); // Conservative context for local models
    for (const msg of recentContext) {
      if (msg.type !== 'system') {
        messages.push({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      }
    }
    
    // Add current prompt
    messages.push({
      role: 'user',
      content: prompt
    });
    
    return messages;
  }
}

// LLM Factory
export function createLLMComponent(provider: string): LLMComponent {
  switch (provider) {
    case 'openai':
      return new OpenAILLMComponent();
    case 'ollama':
      return new OllamaLLMComponent();
    case 'lmstudio':
      return new LMStudioLLMComponent();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

// Interview-specific LLM wrapper
export class InterviewLLMComponent {
  private llm: LLMComponent;
  private questions: string[] = [];
  private currentQuestionIndex = 0;
  
  constructor(
    llm: LLMComponent,
    private interviewType: 'technical' | 'behavioral' | 'mixed'
  ) {
    this.llm = llm;
  }
  
  setQuestions(questions: string[]): void {
    this.questions = questions;
    this.currentQuestionIndex = 0;
  }
  
  setSystemPrompt(prompt: string): void {
    this.llm.setSystemPrompt(prompt);
  }
  
  async getNextQuestion(): Promise<string> {
    if (this.currentQuestionIndex >= this.questions.length) {
      return "Thank you for completing the interview. We'll now generate your feedback.";
    }
    
    const question = this.questions[this.currentQuestionIndex];
    this.currentQuestionIndex++;
    
    return `Question ${this.currentQuestionIndex}: ${question}`;
  }
  
  async processResponse(userResponse: string, context: VoiceMessage[]): Promise<string> {
    // Generate appropriate follow-up or move to next question
    const prompt = this.buildInterviewPrompt(userResponse);
    return await this.llm.generateResponse(prompt, context);
  }
  
  private buildInterviewPrompt(userResponse: string): string {
    const basePrompt = `
The candidate just responded: "${userResponse}"

Based on this response:
1. If the answer is complete and satisfactory, acknowledge it briefly and ask the next question
2. If the answer needs clarification, ask a brief follow-up question
3. If the answer is unclear, guide them to provide more specific details
4. Keep your response under 30 seconds when spoken
5. Maintain a professional but encouraging tone

Your response:`;

    return basePrompt;
  }
  
  isInterviewComplete(): boolean {
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
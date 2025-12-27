export type ModelID = 'gpt-5.2-codex' | 'gpt-5.2' | 'gpt-5-mini'; 

export type TaskType = 
  | 'STRATEGY'      
  | 'ARCHITECT'     
  | 'CODER'        
  | 'REVIEW';       

export interface AIRequest {
  taskType: TaskType;
  prompt: string;
}

export interface AIResponse {
  success: boolean;
  content: string;
  modelUsed: string;
  meta?: any;
}
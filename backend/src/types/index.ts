export type ModelID = 'gpt-4o' | 'gpt-4o-mini'; 

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
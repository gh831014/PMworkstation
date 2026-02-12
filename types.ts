
export interface WorkStats {
  resumesAnalyzed: number;
  knowledgePoints: number;
  questionsAnswered: number;
  prototypesCreated: number;
  flowchartsCreated: number;
  prdsCreated: number;
  roadmapsCreated: number;
}

export interface StudyPlanItem {
  id: string;
  date: string;
  task: string;
  status: 'pending' | 'completed' | 'in-progress';
  isMilestone: boolean;
  suggestion?: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  url: string;
  iconName: string; // We will map this string to an actual icon component
  description: string;
  image: string;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface Member {
  id: number;
  email: string;
  name: string;
  role: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  password?: string;
  expirationDate?: string;
}

export interface AppConfig {
  supabaseUrl: string;
  supabaseKey: string;
  tools: ToolConfig[];
  aiConfig: AiConfig;
}

export interface DbConnectionStatus {
  isConnected: boolean;
  message: string;
}

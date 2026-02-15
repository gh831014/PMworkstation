import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { AppConfig, DbConnectionStatus, WorkStats, StudyPlanItem, Member, ToolConfig } from '../types';
import { MOCK_STATS, MOCK_STUDY_PLAN, MOCK_MEMBERS, DEFAULT_TOOLS } from '../constants';

let supabase: SupabaseClient | null = null;

export const initSupabase = (config: AppConfig): DbConnectionStatus => {
  if (!config.supabaseUrl || !config.supabaseKey) {
    supabase = null;
    return { isConnected: false, message: '未配置数据库' };
  }
  try {
    supabase = createClient(config.supabaseUrl, config.supabaseKey);
    return { isConnected: true, message: '已连接 (客户端已初始化)' };
  } catch (error) {
    console.error("Supabase init error:", error);
    supabase = null;
    return { isConnected: false, message: '初始化失败，请检查配置' };
  }
};

export const testConnection = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    return true; 
  } catch (e) {
    return false;
  }
};

// --- Auth Services ---

export const getMemberRole = async (userId?: string): Promise<string> => {
  if (!supabase || !userId) return 'guest';
  try {
    const { data, error } = await supabase
      .from('pm_members')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
       // If searching by UUID fails, user might not be in pm_members yet
       return 'member'; 
    }
    return data?.role || 'member';
  } catch (e) {
    return 'member';
  }
};

export const signIn = async (email: string, password: string): Promise<{ user: User | null; error: any }> => {
  if (!supabase) return { user: null, error: 'Database not configured' };

  try {
    const { data: member, error: memberError } = await supabase
      .from('pm_members')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (memberError) {
       console.warn("Member lookup failed:", memberError);
    }

    if (member) {
      if (member.expiration_date) {
        const now = new Date();
        const exp = new Date(member.expiration_date);
        if (now > exp) {
          await supabase.from('pm_members').update({ status: 'inactive' }).eq('id', member.id);
          return { user: null, error: { message: '账号已过期，无法登录' } };
        }
      }

      if (member.status !== 'active') {
        return { user: null, error: { message: '账号已被禁用' } };
      }

      if (member.password && member.password !== password) {
        return { user: null, error: { message: '密码错误' } };
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data.user, error };

  } catch (err: any) {
    return { user: null, error: err };
  }
};

export const signOut = async (): Promise<{ error: any }> => {
  if (!supabase) return { error: 'Database not configured' };
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const getCurrentUser = async (): Promise<User | null> => {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user;
};

export const updatePassword = async (newPassword: string): Promise<{ success: boolean; error: any }> => {
  if (!supabase) return { success: false, error: 'Database not configured' };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { success: !error, error };
};

// --- Secure Link Generation ---

export const generateSecureLink = async (targetUrl: string, user: User | null): Promise<string> => {
  if (!targetUrl || targetUrl === '#' || targetUrl.trim() === '') return '#';
  
  const payload = JSON.stringify({
    uid: user ? user.id : 'guest',
    ts: Date.now(),
    nonce: Math.random().toString(36).substring(2),
    role: 'pm_user'
  });

  const encodedPayload = btoa(unescape(encodeURIComponent(payload)));
  
  const secret = "pm-workstation-secure-secret-2024";
  let hash = 0;
  const combined = encodedPayload + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const signature = Math.abs(hash).toString(16);

  const token = `${encodedPayload}.${signature}`;
  
  const separator = targetUrl.includes('?') ? '&' : '?';
  return `${targetUrl}${separator}auth_token=${token}`;
};

// --- Data Fetching ---

export const fetchTools = async (role: string = 'guest'): Promise<ToolConfig[]> => {
  if (!supabase) return DEFAULT_TOOLS;

  try {
    let query = supabase
      .from('links')
      .select('*')
      .order('id', { ascending: true });

    // Filter based on role
    // If user is NOT admin, show only public links (is_admin_only is false)
    if (role !== 'admin') {
      query = query.eq('is_admin_only', false);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      if (role === 'admin' && (!data || data.length === 0)) {
         // Return empty for admin to add
         return [];
      }
      return DEFAULT_TOOLS;
    }

    // Map DB links to ToolConfig
    return data.map((link: any, index: number) => {
      // Assign an image. Cycle through the default tools' images to maintain aesthetic.
      const imageIndex = index % DEFAULT_TOOLS.length;
      const fallbackImage = DEFAULT_TOOLS[imageIndex].image;

      return {
        id: link.id.toString(),
        name: link.title,
        url: link.url,
        iconName: link.icon_name || 'Globe',
        description: link.description || '',
        image: fallbackImage, // Database doesn't store images, reuse SVGs
        isAdminOnly: !!link.is_admin_only
      };
    });
  } catch (error) {
    console.error("Failed to fetch tools:", error);
    return DEFAULT_TOOLS;
  }
};

// --- Tool Management (CRUD) ---

export const addTool = async (tool: Partial<ToolConfig>): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('links').insert([{
      title: tool.name,
      url: tool.url,
      description: tool.description,
      icon_name: tool.iconName,
      type: 'tools', // Default type
      is_admin_only: tool.isAdminOnly
    }]);
    return !error;
  } catch (e) {
    return false;
  }
};

export const updateTool = async (id: string, updates: Partial<ToolConfig>): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('links').update({
      title: updates.name,
      url: updates.url,
      description: updates.description,
      icon_name: updates.iconName,
      is_admin_only: updates.isAdminOnly
    }).eq('id', parseInt(id));
    return !error;
  } catch (e) {
    return false;
  }
};

export const deleteTool = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('links').delete().eq('id', parseInt(id));
    return !error;
  } catch (e) {
    return false;
  }
};

export const fetchStats = async (userId?: string): Promise<WorkStats> => {
  if (!supabase || !userId) return MOCK_STATS;
  try {
    const { data, error } = await supabase
      .from('pm_work_stats')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (error || !data) {
       return MOCK_STATS;
    }
    
    return {
        resumesAnalyzed: data.resumes_analyzed || 0,
        knowledgePoints: data.knowledge_points || 0,
        questionsAnswered: data.questions_answered || 0,
        prototypesCreated: data.prototypes_created || 0,
        flowchartsCreated: data.flowcharts_created || 0,
        prdsCreated: data.prds_created || 0,
        roadmapsCreated: data.roadmaps_created || 0,
    };
  } catch (error) {
    return MOCK_STATS;
  }
};

export const fetchStudyPlan = async (userId?: string): Promise<StudyPlanItem[]> => {
  if (!supabase || !userId) return MOCK_STUDY_PLAN;

  try {
    // Check for a plan in study_plans table
    const { data: plans, error } = await supabase
      .from('study_plans')
      .select('tasks')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !plans || plans.length === 0) {
      // Fallback to old table if new one has no data (or return mock if prefer)
      const { data: oldData } = await supabase
        .from('pm_study_plan')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

      if (oldData && oldData.length > 0) {
          return oldData.map((item: any) => ({
            id: item.id,
            date: item.date,
            task: item.task,
            status: item.status,
            isMilestone: item.is_milestone,
            suggestion: item.suggestion
          }));
      }
      return MOCK_STUDY_PLAN;
    }
    
    // Parse tasks from JSONB
    const latestPlan = plans[0];
    const tasks = latestPlan.tasks;

    if (!Array.isArray(tasks)) return MOCK_STUDY_PLAN;

    // Map JSONB tasks to StudyPlanItem
    return tasks.map((t: any, idx: number) => ({
      id: t.id || `task-${idx}`,
      date: t.date || new Date().toISOString().split('T')[0],
      task: t.task || 'Unnamed Task',
      status: t.status || 'pending',
      isMilestone: !!t.isMilestone,
      suggestion: t.suggestion || ''
    }));

  } catch (error) {
    console.error("Error fetching study plan:", error);
    return MOCK_STUDY_PLAN;
  }
};

// --- Member Management ---

export const fetchMembers = async (): Promise<Member[]> => {
  if (!supabase) return MOCK_MEMBERS;
  try {
    const { data, error } = await supabase
      .from('pm_members')
      .select('*')
      .order('joined_at', { ascending: false });

    if (error || !data) return MOCK_MEMBERS;

    return data.map((m: any) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      role: m.role,
      status: m.status,
      joinedAt: m.joined_at,
      password: m.password,
      expirationDate: m.expiration_date
    }));
  } catch (e) {
    return MOCK_MEMBERS;
  }
};

export const updateMember = async (id: number, updates: Partial<Member>): Promise<boolean> => {
  if (!supabase) return true; // Mock success
  try {
    const { error } = await supabase
      .from('pm_members')
      .update({
        name: updates.name,
        role: updates.role,
        status: updates.status,
        password: updates.password,
        expiration_date: updates.expirationDate
      })
      .eq('id', id);
    return !error;
  } catch (e) {
    return false;
  }
};

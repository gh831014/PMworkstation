import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Settings as SettingsIcon, Database, Activity, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from '@supabase/supabase-js';

import { AppConfig, ToolConfig, WorkStats, StudyPlanItem } from './types';
import { DEFAULT_TOOLS, DEFAULT_SUPABASE_CONFIG, DEFAULT_AI_CONFIG } from './constants';
import { initSupabase, fetchStats, fetchStudyPlan, getCurrentUser, signOut } from './services/dataService';
import { StatsChart } from './components/StatsChart';
import { StudyCalendar } from './components/StudyCalendar';
import { ToolGrid } from './components/ToolGrid';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';

const STORAGE_KEY = 'pm_workstation_config';

// Helper to get location for active tab
const NavLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className="w-5 h-5 mr-2" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const HomePage: React.FC<{ 
  tools: ToolConfig[], 
  stats: WorkStats | null, 
  studyPlan: StudyPlanItem[], 
  loading: boolean,
  isConnected: boolean,
  user: User | null
}> = ({ tools, stats, studyPlan, loading, isConnected, user }) => {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {user ? `你好, ${user.email?.split('@')[0]}` : '欢迎回来，产品经理'}
          </h1>
          <p className="text-slate-300 max-w-2xl">
            {user ? '您的个人数据已同步。' : '这里是你的个人全能工作站。登录以同步您的专属数据。'}
          </p>
          <div className="mt-6 flex items-center space-x-4">
             <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
               isConnected ? 'bg-green-500/20 border-green-400/30 text-green-300' : 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300'
             }`}>
               <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
               {isConnected ? '数据库已连接' : '未连接数据库'}
             </div>
             
             <div className={`flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
               user ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'bg-slate-500/20 border-slate-400/30 text-slate-300'
             }`}>
               {user ? '实时个人数据' : '演示/模拟数据模式'}
             </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Tools (2/3 width on large screens) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Stats Section */}
          <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  数据看板
                </h2>
                <span className="text-sm text-slate-400">最近更新: 刚刚</span>
             </div>
             {loading ? (
                <div className="h-[400px] bg-white rounded-xl flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
             ) : (
                stats && <StatsChart stats={stats} />
             )}
          </section>

          {/* Tools Grid Section */}
          <section>
             <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <LayoutDashboard className="w-5 h-5 mr-2 text-blue-600" />
                  工具箱
                </h2>
             </div>
             <ToolGrid tools={tools} />
          </section>

        </div>

        {/* Right Column: Calendar (1/3 width) */}
        <div className="xl:col-span-1">
          <section className="h-full">
            <div className="flex items-center justify-between mb-4 xl:hidden">
                <h2 className="text-xl font-bold text-slate-800">学习日程</h2>
             </div>
            {loading ? (
                <div className="h-[600px] bg-white rounded-xl flex items-center justify-center border border-slate-100">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <StudyCalendar items={studyPlan} />
            )}
          </section>
        </div>

      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure aiConfig exists for legacy saved data
      if (!parsed.aiConfig) {
        parsed.aiConfig = DEFAULT_AI_CONFIG;
      }
      return parsed;
    }
    return { 
      supabaseUrl: DEFAULT_SUPABASE_CONFIG.url, 
      supabaseKey: DEFAULT_SUPABASE_CONFIG.key, 
      tools: DEFAULT_TOOLS,
      aiConfig: DEFAULT_AI_CONFIG 
    };
  });

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<WorkStats | null>(null);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState({ isConnected: false, message: '' });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Initialize Data & Auth
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      const status = initSupabase(config);
      setDbStatus(status);
      
      // Check for existing session
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      await loadUserData(currentUser?.id);
      setLoading(false);
    };

    initData();
  }, [config]);

  const loadUserData = async (userId?: string) => {
    setLoading(true);
    const statsData = await fetchStats(userId);
    const planData = await fetchStudyPlan(userId);
    setStats(statsData);
    setStudyPlan(planData);
    setLoading(false);
  };

  const handleSaveConfig = (newConfig: AppConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  const handleLoginSuccess = async (loggedInUser: User) => {
    setUser(loggedInUser);
    await loadUserData(loggedInUser.id);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    await loadUserData(undefined); // Load mock data
  };

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
        
        {/* Top Navigation */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mr-3 shadow-sm">
                  P
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 hidden sm:block">
                  PM Workstation
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <nav className="flex space-x-1 sm:space-x-2 mr-4">
                  <NavLink to="/" icon={LayoutDashboard} label="工作台" />
                  <NavLink to="/settings" icon={SettingsIcon} label="配置" />
                </nav>

                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                {user ? (
                  <div className="flex items-center space-x-3">
                     <div className="hidden md:flex items-center text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full">
                       <UserIcon className="w-4 h-4 mr-2" />
                       {user.email}
                     </div>
                     <button 
                       onClick={handleLogout}
                       className="flex items-center px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                     >
                       <LogOut className="w-4 h-4 mr-1" />
                       <span className="hidden sm:inline">退出</span>
                     </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    登录会员
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            <Route path="/" element={
              <HomePage 
                tools={config.tools} 
                stats={stats} 
                studyPlan={studyPlan} 
                loading={loading}
                isConnected={dbStatus.isConnected}
                user={user}
              />
            } />
            <Route path="/settings" element={
              <Settings config={config} onSave={handleSaveConfig} />
            } />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 mt-12 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
            <p>&copy; {new Date().getFullYear()} PM Personal Workstation. Designed for Product Excellence.</p>
          </div>
        </footer>

        {/* Login Modal */}
        <LoginModal 
           isOpen={isLoginModalOpen} 
           onClose={() => setIsLoginModalOpen(false)} 
           onLoginSuccess={handleLoginSuccess}
        />

      </div>
    </Router>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import { AppConfig, ToolConfig, Member } from '../types';
import { Save, RefreshCw, Plus, Trash2, Database, Copy, Check, Terminal, Cpu, Users, Lock, Edit2, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { testConnection, updatePassword, fetchMembers, updateMember, fetchTools, addTool, updateTool, deleteTool } from '../services/dataService';
import { CREATE_TABLE_SQL, CREATE_MEMBER_SQL } from '../constants';

interface SettingsProps {
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const Settings: React.FC<SettingsProps> = ({ config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [connectionStatus, setConnectionStatus] = useState<{success?: boolean; msg: string}>({ msg: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [copiedSQL, setCopiedSQL] = useState('');
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'links' | 'sql'>('general');
  
  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState('');

  // Members State
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Tools Management State
  const [dbTools, setDbTools] = useState<ToolConfig[]>([]);
  const [loadingTools, setLoadingTools] = useState(false);
  const [editingTool, setEditingTool] = useState<Partial<ToolConfig> | null>(null);
  const [isAddingTool, setIsAddingTool] = useState(false);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  useEffect(() => {
    if (activeTab === 'members') {
      loadMembers();
    } else if (activeTab === 'links') {
      loadTools();
    }
  }, [activeTab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    const data = await fetchMembers();
    setMembers(data);
    setLoadingMembers(false);
  };

  const loadTools = async () => {
    setLoadingTools(true);
    // Fetch with 'admin' role to see all and manage them
    const data = await fetchTools('admin');
    setDbTools(data);
    setLoadingTools(false);
  };

  const handleSupabaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
  };

  const handleAiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalConfig({ 
      ...localConfig, 
      aiConfig: { ...localConfig.aiConfig, [e.target.name]: e.target.value } 
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setConnectionStatus({ msg: '正在连接...' });
    
    if(!localConfig.supabaseUrl || !localConfig.supabaseKey) {
       setConnectionStatus({ success: false, msg: '缺少 URL 或 Key' });
       setIsTesting(false);
       return;
    }

    setTimeout(() => {
       setConnectionStatus({ success: true, msg: '配置格式正确 (需保存以生效)' });
       setIsTesting(false);
    }, 800);
  };

  const handleSave = () => {
    onSave(localConfig);
    setConnectionStatus({ success: true, msg: '配置已保存' });
  };

  const handleCopySQL = (sql: string, type: string) => {
    navigator.clipboard.writeText(sql);
    setCopiedSQL(type);
    setTimeout(() => setCopiedSQL(''), 2000);
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      setPwdMsg('密码至少需要6位');
      return;
    }
    setPwdMsg('更新中...');
    const { success, error } = await updatePassword(newPassword);
    if (success) {
      setPwdMsg('密码更新成功');
      setNewPassword('');
    } else {
      setPwdMsg('更新失败: ' + (error?.message || '未知错误'));
    }
  };

  const handleEditMember = (member: Member) => {
    const formattedMember = { ...member };
    if (formattedMember.expirationDate) {
      formattedMember.expirationDate = formattedMember.expirationDate.split('T')[0];
    }
    setEditingMember(formattedMember);
  };

  const saveMemberEdit = async () => {
    if (!editingMember) return;
    const success = await updateMember(editingMember.id, editingMember);
    if (success) {
      setMembers(members.map(m => m.id === editingMember.id ? editingMember : m));
      setEditingMember(null);
    }
  };

  // Tool CRUD
  const handleSaveTool = async () => {
    if (!editingTool) return;
    
    if (isAddingTool) {
      await addTool(editingTool);
    } else if (editingTool.id) {
      await updateTool(editingTool.id, editingTool);
    }
    
    await loadTools();
    setEditingTool(null);
    setIsAddingTool(false);
  };

  const handleDeleteTool = async (id: string) => {
    if (window.confirm('确定要删除这个链接吗？')) {
      await deleteTool(id);
      await loadTools();
    }
  };

  return (
    <div className="pb-20">
      <div className="flex space-x-4 mb-6 border-b border-slate-200 overflow-x-auto">
        <button 
          onClick={() => setActiveTab('general')}
          className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          基础配置
        </button>
        <button 
          onClick={() => setActiveTab('members')}
          className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'members' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          会员管理
        </button>
        <button 
          onClick={() => setActiveTab('links')}
          className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'links' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          链接管理
        </button>
        <button 
          onClick={() => setActiveTab('sql')}
          className={`pb-2 px-4 font-medium transition-colors whitespace-nowrap ${activeTab === 'sql' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          数据库脚本
        </button>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-8">
          {/* Database Config */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2 text-blue-600" />
              数据库配置 (Supabase)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Supabase URL</label>
                <input
                  type="text"
                  name="supabaseUrl"
                  value={localConfig.supabaseUrl}
                  onChange={handleSupabaseChange}
                  placeholder="https://xyz.supabase.co"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Supabase Anon Key</label>
                <input
                  type="password"
                  name="supabaseKey"
                  value={localConfig.supabaseKey}
                  onChange={handleSupabaseChange}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR..."
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isTesting ? 'animate-spin' : ''}`} />
                  测试格式
                </button>
                {connectionStatus.msg && (
                  <span className={`text-sm ${connectionStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                    {connectionStatus.msg}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* AI Model Config */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Cpu className="w-5 h-5 mr-2 text-purple-600" />
              AI 模型配置 (通义千问)
            </h2>
            <div className="grid grid-cols-1 gap-6">
               <div className="space-y-2">
                <label className="text-sm font-medium text-slate-600">Base URL</label>
                <input
                  type="text"
                  name="baseUrl"
                  value={localConfig.aiConfig?.baseUrl || ''}
                  onChange={handleAiChange}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">API Key</label>
                  <input
                    type="password"
                    name="apiKey"
                    value={localConfig.aiConfig?.apiKey || ''}
                    onChange={handleAiChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-600">Model Name</label>
                  <input
                    type="text"
                    name="model"
                    value={localConfig.aiConfig?.model || ''}
                    onChange={handleAiChange}
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'links' && (
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <LinkIcon className="w-5 h-5 mr-2 text-blue-600" />
                  数据库链接管理
                </h2>
                <button 
                  onClick={() => { setEditingTool({}); setIsAddingTool(true); }}
                  className="flex items-center px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增链接
                </button>
             </div>
             
             {loadingTools ? (
               <div className="text-center py-8 text-slate-400">加载中...</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50 text-slate-600 text-sm">
                       <th className="p-3 border-b w-16">ID</th>
                       <th className="p-3 border-b w-32">名称</th>
                       <th className="p-3 border-b w-48">URL</th>
                       <th className="p-3 border-b w-24">图标</th>
                       <th className="p-3 border-b">描述</th>
                       <th className="p-3 border-b w-24">权限</th>
                       <th className="p-3 border-b w-24">操作</th>
                     </tr>
                   </thead>
                   <tbody>
                     {isAddingTool && (
                       <tr className="bg-green-50 border-b border-green-100">
                         <td className="p-3 text-xs text-slate-400">NEW</td>
                         <td className="p-3"><input className="w-full border rounded px-2 py-1" placeholder="名称" value={editingTool?.name || ''} onChange={e => setEditingTool({...editingTool, name: e.target.value})} /></td>
                         <td className="p-3"><input className="w-full border rounded px-2 py-1" placeholder="URL" value={editingTool?.url || ''} onChange={e => setEditingTool({...editingTool, url: e.target.value})} /></td>
                         <td className="p-3"><input className="w-full border rounded px-2 py-1" placeholder="Icon" value={editingTool?.iconName || ''} onChange={e => setEditingTool({...editingTool, iconName: e.target.value})} /></td>
                         <td className="p-3"><input className="w-full border rounded px-2 py-1" placeholder="描述" value={editingTool?.description || ''} onChange={e => setEditingTool({...editingTool, description: e.target.value})} /></td>
                         <td className="p-3 text-center"><input type="checkbox" checked={editingTool?.isAdminOnly || false} onChange={e => setEditingTool({...editingTool, isAdminOnly: e.target.checked})} /></td>
                         <td className="p-3">
                           <button onClick={handleSaveTool} className="text-green-600 mr-2"><Check className="w-4 h-4"/></button>
                           <button onClick={() => { setIsAddingTool(false); setEditingTool(null); }} className="text-slate-400"><Trash2 className="w-4 h-4"/></button>
                         </td>
                       </tr>
                     )}
                     {dbTools.map(tool => (
                       <tr key={tool.id} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="p-3 text-slate-500 font-mono text-xs">{tool.id}</td>
                         <td className="p-3">
                           {editingTool?.id === tool.id ? (
                             <input className="w-full border rounded px-2 py-1" value={editingTool?.name || ''} onChange={e => setEditingTool({...editingTool, name: e.target.value})} />
                           ) : tool.name}
                         </td>
                         <td className="p-3">
                           {editingTool?.id === tool.id ? (
                             <input className="w-full border rounded px-2 py-1" value={editingTool?.url || ''} onChange={e => setEditingTool({...editingTool, url: e.target.value})} />
                           ) : <div className="truncate max-w-[200px]" title={tool.url}>{tool.url}</div>}
                         </td>
                         <td className="p-3">
                           {editingTool?.id === tool.id ? (
                             <input className="w-full border rounded px-2 py-1" value={editingTool?.iconName || ''} onChange={e => setEditingTool({...editingTool, iconName: e.target.value})} />
                           ) : <span className="text-xs bg-slate-100 px-2 py-1 rounded">{tool.iconName}</span>}
                         </td>
                         <td className="p-3">
                           {editingTool?.id === tool.id ? (
                             <input className="w-full border rounded px-2 py-1" value={editingTool?.description || ''} onChange={e => setEditingTool({...editingTool, description: e.target.value})} />
                           ) : <div className="truncate max-w-[200px]" title={tool.description}>{tool.description}</div>}
                         </td>
                         <td className="p-3 text-center">
                           {editingTool?.id === tool.id ? (
                             <label className="flex items-center justify-center space-x-1 cursor-pointer">
                                <input type="checkbox" checked={editingTool?.isAdminOnly || false} onChange={e => setEditingTool({...editingTool, isAdminOnly: e.target.checked})} />
                                <span className="text-xs">管理员</span>
                             </label>
                           ) : (
                             tool.isAdminOnly ? <span className="flex items-center justify-center text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200"><ShieldAlert className="w-3 h-3 mr-1"/>管理员</span> : <span className="text-xs text-slate-400">公开</span>
                           )}
                         </td>
                         <td className="p-3">
                           {editingTool?.id === tool.id ? (
                             <div className="flex space-x-2">
                               <button onClick={handleSaveTool} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4"/></button>
                               <button onClick={() => setEditingTool(null)} className="text-slate-400 hover:text-slate-600"><Terminal className="w-4 h-4 rotate-45"/></button>
                             </div>
                           ) : (
                             <div className="flex space-x-2">
                               <button onClick={() => setEditingTool({...tool})} className="text-blue-600 hover:text-blue-700">
                                 <Edit2 className="w-4 h-4" />
                               </button>
                               <button onClick={() => handleDeleteTool(tool.id)} className="text-red-400 hover:text-red-600">
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             </div>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {dbTools.length === 0 && !isAddingTool && <div className="text-center py-8 text-slate-400">暂无链接配置 (点击右上角新增)</div>}
               </div>
             )}
          </section>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="space-y-8">
           {/* Change Password */}
           <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              当前账户安全
            </h2>
            <div className="flex items-end gap-4 max-w-lg">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium text-slate-600">修改登录密码</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="输入新密码"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <button 
                onClick={handleUpdatePassword}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                更新密码
              </button>
            </div>
            {pwdMsg && <p className="mt-2 text-sm text-slate-500">{pwdMsg}</p>}
          </section>

          {/* Member List */}
          <section className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  会员名单管理
                </h2>
                <div className="text-sm text-slate-500">
                  默认初始密码: <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">pmlaogao</span>
                </div>
             </div>
             
             {loadingMembers ? (
               <div className="text-center py-8 text-slate-400">加载中...</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse min-w-[800px]">
                   <thead>
                     <tr className="bg-slate-50 text-slate-600 text-sm">
                       <th className="p-3 border-b w-16">ID</th>
                       <th className="p-3 border-b w-48">邮箱</th>
                       <th className="p-3 border-b w-32">姓名</th>
                       <th className="p-3 border-b w-24">角色</th>
                       <th className="p-3 border-b w-32">密码</th>
                       <th className="p-3 border-b w-32">有效期</th>
                       <th className="p-3 border-b w-24">状态</th>
                       <th className="p-3 border-b w-24">操作</th>
                     </tr>
                   </thead>
                   <tbody>
                     {members.map(member => (
                       <tr key={member.id} className="border-b border-slate-100 hover:bg-slate-50">
                         <td className="p-3 text-slate-500 font-mono text-xs">{member.id}</td>
                         <td className="p-3">{member.email}</td>
                         <td className="p-3">
                           {editingMember?.id === member.id ? (
                             <input 
                               value={editingMember.name || ''} 
                               onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}
                               className="px-2 py-1 border rounded text-sm w-24"
                             />
                           ) : member.name}
                         </td>
                         <td className="p-3">
                           {editingMember?.id === member.id ? (
                             <select 
                               value={editingMember.role || 'member'} 
                               onChange={(e) => setEditingMember({...editingMember, role: e.target.value})}
                               className="px-2 py-1 border rounded text-sm w-20"
                             >
                               <option value="member">Member</option>
                               <option value="admin">Admin</option>
                             </select>
                           ) : <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">{member.role}</span>}
                         </td>
                         <td className="p-3">
                            {editingMember?.id === member.id ? (
                             <input 
                               type="text"
                               value={editingMember.password || ''} 
                               onChange={(e) => setEditingMember({...editingMember, password: e.target.value})}
                               placeholder="新密码"
                               className="px-2 py-1 border rounded text-sm w-24 font-mono"
                             />
                           ) : <span className="text-slate-400 text-xs">******</span>}
                         </td>
                         <td className="p-3">
                            {editingMember?.id === member.id ? (
                             <input 
                               type="date"
                               value={editingMember.expirationDate || ''} 
                               onChange={(e) => setEditingMember({...editingMember, expirationDate: e.target.value})}
                               className="px-2 py-1 border rounded text-sm w-32"
                             />
                           ) : <span className={`text-xs ${member.expirationDate ? '' : 'text-slate-400'}`}>{member.expirationDate ? new Date(member.expirationDate).toLocaleDateString() : '永久'}</span>}
                         </td>
                         <td className="p-3">
                           {editingMember?.id === member.id ? (
                             <select 
                               value={editingMember.status || 'active'} 
                               onChange={(e) => setEditingMember({...editingMember, status: e.target.value as any})}
                               className="px-2 py-1 border rounded text-sm w-20"
                             >
                               <option value="active">正常</option>
                               <option value="disabled">禁用</option>
                             </select>
                           ) : (
                             <span className={`px-2 py-0.5 rounded text-xs ${member.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                               {member.status === 'active' ? '正常' : '禁用'}
                             </span>
                           )}
                         </td>
                         <td className="p-3">
                           {editingMember?.id === member.id ? (
                             <div className="flex space-x-2">
                               <button onClick={saveMemberEdit} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4"/></button>
                               <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600"><Terminal className="w-4 h-4 rotate-45"/></button>
                             </div>
                           ) : (
                             <button onClick={() => handleEditMember(member)} className="text-blue-600 hover:text-blue-700">
                               <Edit2 className="w-4 h-4" />
                             </button>
                           )}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 {members.length === 0 && <div className="text-center py-8 text-slate-400">暂无会员信息 (需先执行SQL创建表)</div>}
               </div>
             )}
          </section>
        </div>
      )}

      {activeTab === 'sql' && (
        <div className="space-y-8">
           {/* Member Table SQL */}
           <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm text-slate-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                <Users className="w-6 h-6 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">获取会员数据表 SQL</h3>
             <p className="text-sm text-slate-400 mb-4">
               复制以下 SQL 并在 Supabase SQL Editor 中运行，以创建会员管理所需的数据库表。包含密码存储和有效期字段。
             </p>
             <div className="relative">
               <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto h-48 border border-slate-700 custom-scrollbar">
                 {CREATE_MEMBER_SQL}
               </pre>
               <button 
                 onClick={() => handleCopySQL(CREATE_MEMBER_SQL, 'member')}
                 className="absolute top-2 right-2 flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
               >
                 {copiedSQL === 'member' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                 {copiedSQL === 'member' ? '已复制' : '复制 SQL'}
               </button>
             </div>
          </section>

          {/* General Table SQL */}
           <section className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm text-slate-200 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 bg-white/5 rounded-bl-2xl">
                <Terminal className="w-6 h-6 text-slate-400" />
             </div>
             <h3 className="text-lg font-bold text-white mb-2">基础数据表 SQL</h3>
             <p className="text-sm text-slate-400 mb-4">
               初始化工作台统计和学习计划表。
             </p>
             <div className="relative">
               <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto h-32 border border-slate-700 custom-scrollbar">
                 {CREATE_TABLE_SQL}
               </pre>
               <button 
                 onClick={() => handleCopySQL(CREATE_TABLE_SQL, 'basic')}
                 className="absolute top-2 right-2 flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
               >
                 {copiedSQL === 'basic' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                 {copiedSQL === 'basic' ? '已复制' : '复制 SQL'}
               </button>
             </div>
          </section>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 flex justify-end z-10 shadow-lg md:static md:shadow-none md:bg-transparent md:border-none md:p-0 mt-8">
          <button
            onClick={handleSave}
            className="flex items-center px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-95"
          >
            <Save className="w-5 h-5 mr-2" />
            保存所有配置
          </button>
        </div>
      )}
    </div>
  );
};

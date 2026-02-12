import React from 'react';
import { ToolConfig } from '../types';
import * as LucideIcons from 'lucide-react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { generateSecureLink, getCurrentUser } from '../services/dataService';

interface ToolGridProps {
  tools: ToolConfig[];
}

export const ToolGrid: React.FC<ToolGridProps> = ({ tools }) => {
  const [redirecting, setRedirecting] = React.useState<string | null>(null);

  const getIcon = (iconName: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-6 h-6 text-white" /> : <LucideIcons.Box className="w-6 h-6 text-white" />;
  };

  const handleToolClick = async (e: React.MouseEvent, tool: ToolConfig) => {
    e.preventDefault();
    if (tool.url === '#' || !tool.url) return;

    setRedirecting(tool.id);
    try {
      // Fetch current user (or guest)
      const user = await getCurrentUser();
      // Generate encrypted URL
      const secureUrl = await generateSecureLink(tool.url, user);
      
      // Short delay to show interaction, then redirect
      setTimeout(() => {
        window.open(secureUrl, '_blank');
        setRedirecting(null);
      }, 500);
    } catch (error) {
      console.error("Secure redirect failed", error);
      setRedirecting(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {tools.map((tool) => (
        <div 
          key={tool.id} 
          onClick={(e) => handleToolClick(e, tool)}
          className={`group block bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer relative ${redirecting === tool.id ? 'opacity-80' : ''}`}
        >
          {redirecting === tool.id && (
             <div className="absolute inset-0 z-20 bg-white/50 backdrop-blur-sm flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
             </div>
          )}
          
          <div className="h-32 bg-slate-100 overflow-hidden relative">
            <img 
              src={tool.image} 
              alt={tool.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-3 left-3 flex items-center">
               <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-md">
                  {getIcon(tool.iconName)}
               </div>
            </div>
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
               <ExternalLink className="w-5 h-5 text-white drop-shadow-md" />
            </div>
          </div>
          <div className="p-4">
            <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-600 transition-colors">
              {tool.name}
            </h3>
            <p className="text-sm text-slate-500 line-clamp-2 h-10">
              {tool.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

import React from 'react';
import { StudyPlanItem } from '../types';
import { Calendar as CalendarIcon, CheckCircle2, Circle, Flag, Lightbulb, ExternalLink, CalendarPlus } from 'lucide-react';

interface StudyCalendarProps {
  items: StudyPlanItem[];
}

export const StudyCalendar: React.FC<StudyCalendarProps> = ({ items }) => {
  
  const generateGoogleCalendarUrl = (item: StudyPlanItem) => {
    // Format: YYYYMMDD
    const dateStr = item.date.replace(/-/g, '');
    const nextDay = new Date(item.date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10).replace(/-/g, '');
    
    const text = encodeURIComponent(item.task);
    const details = encodeURIComponent(item.suggestion || '无详细描述');
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&dates=${dateStr}/${nextDayStr}`;
  };

  const generateOutlookCalendarUrl = (item: StudyPlanItem) => {
     const text = encodeURIComponent(item.task);
     const details = encodeURIComponent(item.suggestion || '无详细描述');
     return `https://outlook.live.com/calendar/0/deeplink/compose?subject=${text}&body=${details}&startdt=${item.date}&enddt=${item.date}`;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
          学习计划日程
        </h3>
        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
          {items.filter(i => i.status === 'completed').length} / {items.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
        {items.length === 0 ? (
          <div className="text-center text-slate-400 py-10 flex flex-col items-center">
             <CalendarIcon className="w-12 h-12 text-slate-200 mb-2"/>
             <span>暂无学习计划数据</span>
          </div>
        ) : (
          items.map((item) => {
            const dateObj = new Date(item.date);
            const day = dateObj.getDate();
            const month = dateObj.toLocaleString('zh-CN', { month: 'short' });
            
            return (
              <div 
                key={item.id} 
                className={`group flex items-start p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                  item.status === 'completed' ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100 hover:border-blue-200'
                }`}
              >
                {/* Date Box */}
                <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-lg mr-4 flex-shrink-0 border ${
                   item.status === 'completed' ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-100 text-blue-600'
                }`}>
                  <span className="text-xs font-semibold uppercase">{month}</span>
                  <span className="text-xl font-bold leading-none">{day}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h4 className={`text-sm font-bold truncate pr-2 ${item.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {item.task}
                    </h4>
                    {item.isMilestone && (
                       <Flag className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                     <div className="flex items-center text-xs">
                        {item.status === 'completed' && <span className="text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/>已完成</span>}
                        {item.status === 'in-progress' && <span className="text-blue-600 flex items-center"><Circle className="w-3 h-3 mr-1 fill-blue-600"/>进行中</span>}
                        {item.status === 'pending' && <span className="text-slate-400 flex items-center"><Circle className="w-3 h-3 mr-1"/>未开始</span>}
                     </div>
                     
                     {/* Add to Calendar Actions */}
                     <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a href={generateGoogleCalendarUrl(item)} target="_blank" rel="noreferrer" title="添加到 Google Calendar" className="text-slate-400 hover:text-blue-500">
                           <CalendarPlus className="w-4 h-4" />
                        </a>
                        <a href={generateOutlookCalendarUrl(item)} target="_blank" rel="noreferrer" title="添加到 Outlook" className="text-slate-400 hover:text-blue-500">
                           <ExternalLink className="w-4 h-4" />
                        </a>
                     </div>
                  </div>

                  {item.suggestion && item.status !== 'completed' && (
                    <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 p-2 rounded flex items-start">
                      <Lightbulb className="w-3 h-3 mr-1 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{item.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
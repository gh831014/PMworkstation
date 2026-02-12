import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { WorkStats } from '../types';

interface StatsChartProps {
  stats: WorkStats;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-xl">
        <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</h4>
        <div className="flex items-center text-sm">
          <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: payload[0].payload.fill }}></div>
          <span className="text-slate-500 mr-4">数量:</span>
          <span className="font-mono font-bold text-lg text-slate-800">{payload[0].value}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">点击查看详细记录</p>
      </div>
    );
  }
  return null;
};

export const StatsChart: React.FC<StatsChartProps> = ({ stats }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = [
    { name: '简历分析', value: stats.resumesAnalyzed, fill: COLORS[0] },
    { name: '知识点', value: stats.knowledgePoints, fill: COLORS[1] },
    { name: '问题解答', value: stats.questionsAnswered, fill: COLORS[2] },
    { name: '原型图', value: stats.prototypesCreated, fill: COLORS[3] },
    { name: '流程图', value: stats.flowchartsCreated, fill: COLORS[4] },
    { name: 'PRD文档', value: stats.prdsCreated, fill: COLORS[5] },
    { name: '产品规划', value: stats.roadmapsCreated, fill: COLORS[6] },
  ];

  const onMouseEnter = (_: any, index: number) => setActiveIndex(index);
  const onMouseLeave = () => setActiveIndex(null);

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
        <span className="w-2 h-6 bg-blue-500 rounded-sm mr-2"></span>
        工作产出统计
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          onMouseLeave={onMouseLeave}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={{ stroke: '#cbd5e1' }}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            content={<CustomTooltip />}
          />
          <Bar 
            dataKey="value" 
            radius={[6, 6, 0, 0]}
            onMouseEnter={onMouseEnter}
            animationDuration={500}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.fill} 
                opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                stroke={activeIndex === index ? '#1e293b' : 'none'}
                strokeWidth={activeIndex === index ? 2 : 0}
                style={{ 
                  transition: 'all 0.3s ease',
                  transformOrigin: 'bottom',
                  transform: activeIndex === index ? 'scaleY(1.05)' : 'scaleY(1)',
                  filter: activeIndex === index ? 'drop-shadow(0px 4px 6px rgba(0,0,0,0.2))' : 'none'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
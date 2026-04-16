import React, { useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Bar, Legend, ComposedChart, Line } from 'recharts';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface FoodLog {
  created_at: string;
  calories: number;
  protein_g: number;
  health_score: number;
}

interface DashboardChartProps {
  logs: FoodLog[];
}

const DashboardChart: React.FC<DashboardChartProps> = ({ logs }) => {
  const data = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);

      const dayLogs = logs.filter(
        (l) => new Date(l.created_at) >= start && new Date(l.created_at) <= end
      );

      const calories = dayLogs.reduce((acc, l) => acc + (l.calories || 0), 0);
      const protein = dayLogs.reduce((acc, l) => acc + (l.protein_g || 0), 0);
      
      // Calculate average health score mapped to "Energie" (0-100)
      const avgScore = dayLogs.length 
        ? dayLogs.reduce((acc, l) => acc + (l.health_score || 0), 0) / dayLogs.length 
        : 50;

      return {
        date: format(d, 'EEE', { locale: fr }),
        calories,
        protein,
        energie: Math.floor(avgScore),
      };
    });
    return last7Days;
  }, [logs]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mt-6">
      <div className="flex items-center gap-2 mb-6">
        <span className="material-symbols-outlined text-purple-500">monitoring</span>
        <h3 className="text-lg font-bold text-gray-800">Insights Nutritionnels</h3>
      </div>
      
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
            
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            
            <Bar yAxisId="left" dataKey="calories" name="Calories (kcal)" fill="url(#colorCalories)" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Line yAxisId="right" type="monotone" dataKey="energie" name="Score Énergie (%)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 bg-purple-50 rounded-2xl p-4 flex gap-3 items-start">
        <img src="/logo.png" alt="AriaFood Insight" className="w-5 h-5 object-contain mt-0.5" />
        <p className="text-sm text-purple-900 leading-relaxed font-medium">
          L'application a remarqué que ton score d'énergie est plus bas les jours où tu manges moins de calories le matin. Essaie de répartir tes repas différemment.
        </p>
      </div>
    </div>
  );
};

export default DashboardChart;

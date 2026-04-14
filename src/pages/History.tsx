/**
 * History.tsx — Clean Professional V3
 */
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';

const History: React.FC = () => {
    const { foodLogs, loading, refreshData } = useData();
    const [weekData, setWeekData] = useState<{ day: string; kcal: number; date: Date }[]>([]);

    useEffect(() => {
        if (foodLogs) {
            const now = new Date();
            const results = [];

            for (let i = 0; i < 7; i++) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const nextD = new Date(d);
                nextD.setDate(nextD.getDate() + 1);

                const dayLogs = foodLogs.filter((log: any) => {
                    const logDate = new Date(log.created_at);
                    return logDate >= d && logDate < nextD;
                });

                const cal = dayLogs.reduce((s, l) => s + (l.calories || 0), 0) || 0;
                results.push({
                    day: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'][d.getDay()],
                    kcal: cal,
                    date: d
                });
            }
            setWeekData(results.reverse());
        }
    }, [foodLogs]);

    const deleteMsg = async (id: string) => {
        if (!confirm('Supprimer ce scan ?')) return;
        await supabase.from('food_logs').delete().eq('id', id);
        await refreshData();
    };

    const maxKcal = Math.max(...weekData.map(t => t.kcal), 2000);

    return (
        <div className="min-h-full pb-36 lg:pb-12 px-4 sm:px-6 lg:px-8 pt-6 space-y-6 select-none">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-400 font-medium">Historique</p>
                    <h1 className="text-xl font-bold text-gray-900">Journal alimentaire</h1>
                </div>
                <button className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition" onClick={() => refreshData()}>
                    <span className="material-symbols-outlined text-gray-500 text-xl">refresh</span>
                </button>
            </div>

            {/* Weekly Trend */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <p className="text-xs font-semibold text-gray-400 mb-4">Tendance de la semaine</p>
                <div className="flex justify-between items-end h-28 gap-2">
                    {weekData.map((t, i) => {
                        const h = (t.kcal / maxKcal) * 100;
                        const isToday = t.date.toDateString() === new Date().toDateString();
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                <div className="w-full rounded-lg transition-all duration-700 relative overflow-hidden"
                                    style={{ height: `${Math.max(h, 4)}%` }}>
                                    <div className={`absolute inset-0 rounded-lg ${isToday ? 'bg-emerald-500' : 'bg-emerald-100'}`}></div>
                                </div>
                                <span className={`text-[10px] font-semibold ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>{t.day}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Journal List */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-gray-500">Tous les scans</h2>
                    <span className="text-xs font-medium text-gray-400">{foodLogs.length} éléments</span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2].map(i => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-gray-100"></div>)}
                    </div>
                ) : foodLogs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center border border-dashed border-gray-200">
                        <p className="text-sm text-gray-500 mb-4">Aucun scan enregistré</p>
                        <NavLink to="/scan" className="px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition active:scale-95">
                            Scanner un plat
                        </NavLink>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {foodLogs.map((log) => (
                            <NavLink key={log.id} to="/meals" state={{ selectedMeal: log }}
                                className="bg-white rounded-2xl p-4 flex items-center gap-4 group active:scale-[0.98] transition-all border border-gray-100 shadow-sm hover:shadow-md block">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                                    {log.image_url
                                        ? <img src={log.image_url} alt="food" className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center text-2xl">🥗</div>
                                    }
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{log.food_name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                                        {log.calories} kcal
                                    </span>
                                    <button onClick={(e) => { e.preventDefault(); deleteMsg(log.id); }} 
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-50 rounded-lg">
                                        <span className="material-symbols-outlined text-sm text-red-400">delete</span>
                                    </button>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;

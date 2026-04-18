/**
 * MealDetails.tsx — Premium Dynamic Design
 */
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';
import type { FoodLog } from '../data/mockData';

const MealDetails: React.FC = () => {
    const { foodLogs, loading } = useData();
    const location = useLocation();
    const [search, setSearch] = useState('');
    const [selectedMeal, setSelectedMeal] = useState<FoodLog | null>(null);

    React.useEffect(() => {
        if (location.state?.selectedMeal) {
            setSelectedMeal(location.state.selectedMeal);
        }
    }, [location.state]);

    const filteredLogs = foodLogs.filter(log =>
        log.food_name.toLowerCase().includes(search.toLowerCase())
    );

    const getScoreDetails = (s: number) => {
        if (s >= 8) return { label: 'Excellent', color: '#10b981', bg: 'bg-emerald-500/10' };
        if (s >= 6) return { label: 'Moyen', color: '#fbbf24', bg: 'bg-amber-500/10' };
        return { label: 'À limiter', color: '#ef4444', bg: 'bg-red-500/10' };
    };

    const MacroCard = ({ label, value, unit, color, icon }: { label: string; value: number; unit: string; color: string; icon: string }) => (
        <div className="flex-1 bg-white rounded-[24px] p-4 flex flex-col items-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1 transition-transform">
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: `${color}15`, color }}>
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <p className="text-[20px] font-black tracking-tight" style={{ color }}>{Math.round(value)}<span className="text-[12px] font-bold ml-0.5">{unit}</span></p>
            <p className="text-[11px] font-bold text-gray-400 mt-1 uppercase tracking-wider">{label}</p>
        </div>
    );

    // ── Detail View ──
    if (selectedMeal) {
        const score = selectedMeal.health_score || 0;
        const scoreUI = getScoreDetails(score);

        return (
            <div className="min-h-full pb-8 select-none bg-[#f8fafc] font-sans relative">
                {/* Image Header with Parallax Feel */}
                <div className="relative h-[45vh] w-full overflow-hidden rounded-b-[40px] shadow-lg">
                    {selectedMeal.image_url ? (
                        <img src={selectedMeal.image_url} alt={selectedMeal.food_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-teal-50 flex items-center justify-center text-6xl">🥗</div>
                    )}
                    
                    {/* Gradient Overlays */}
                    <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/50 to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-900/90 to-transparent"></div>

                    {/* Navigation */}
                    <div className="absolute top-0 left-0 w-full pt-10 pb-4 px-6 flex items-center justify-between z-10">
                        <button onClick={() => setSelectedMeal(null)} className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white active:scale-90 transition-transform">
                            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
                        </button>
                        <div className="flex gap-2">
                            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white active:scale-90 transition-transform">
                                <span className="material-symbols-outlined text-[20px]">share</span>
                            </button>
                        </div>
                    </div>

                    {/* Meal Info inside image */}
                    <div className="absolute bottom-6 left-6 right-6">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${score >= 8 ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : score >= 6 ? 'bg-amber-500/20 text-amber-100 border-amber-400/30' : 'bg-red-500/20 text-red-100 border-red-400/30'}`}>
                                Score: {score}/10
                            </span>
                            <span className="px-3 py-1 bg-black/30 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {new Date(selectedMeal.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight leading-tight drop-shadow-lg">{selectedMeal.food_name}</h1>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="max-w-lg mx-auto px-5 -mt-6 relative z-20 space-y-5">
                    
                    {/* Calorie Card */}
                    <div className="bg-white rounded-[28px] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-between">
                        <div>
                            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">Énergie</p>
                            <div className="flex items-end gap-1">
                                <p className="text-4xl font-black text-slate-800 tracking-tighter leading-none">{Math.round(selectedMeal.calories)}</p>
                                <p className="text-sm font-bold text-slate-400 mb-1">kcal</p>
                            </div>
                        </div>
                        <div className={`w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 ${score >= 8 ? 'border-emerald-100' : score >= 6 ? 'border-amber-100' : 'border-red-100'}`} style={{ backgroundColor: scoreUI.bg }}>
                            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1", color: scoreUI.color }}>local_fire_department</span>
                        </div>
                    </div>

                    {/* Macros */}
                    <div>
                        <div className="flex justify-between items-center mb-3 px-1">
                            <h3 className="text-[16px] font-black text-slate-800 tracking-tight">Macronutriments</h3>
                        </div>
                        <div className="flex gap-3">
                            <MacroCard label="Protéines" value={selectedMeal.protein_g} unit="g" color="#14b8a6" icon="fitness_center" />
                            <MacroCard label="Glucides" value={selectedMeal.carbs_g} unit="g" color="#f59e0b" icon="grain" />
                            <MacroCard label="Lipides" value={selectedMeal.fat_g} unit="g" color="#ec4899" icon="water_drop" />
                        </div>
                    </div>

                    {/* AI Insights Concept */}
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[28px] p-6 shadow-sm border border-indigo-100/50 relative overflow-hidden mt-6">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="material-symbols-outlined text-8xl text-indigo-500">auto_awesome</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3 relative z-10">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                                <span className="material-symbols-outlined text-white text-[16px]">psychology</span>
                            </div>
                            <h3 className="text-[15px] font-black text-indigo-950 tracking-tight">Analyse IA</h3>
                        </div>
                        <p className="text-[14px] text-indigo-900/80 font-medium leading-relaxed relative z-10">
                            {selectedMeal.health_tips ? selectedMeal.health_tips : "Ce repas équilibré est une excellente source d'énergie. Parfait pour vos objectifs nutritionnels."}
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                                 <span className="material-symbols-outlined">eco</span>
                             </div>
                             <div>
                                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Fibres</p>
                                 <p className="text-[18px] font-black text-slate-800">{selectedMeal.fiber_g || 0}g</p>
                             </div>
                        </div>
                        <div className="bg-white rounded-[24px] p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                 <span className="material-symbols-outlined">set_meal</span>
                             </div>
                             <div>
                                 <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Portion</p>
                                 <p className="text-[18px] font-black text-slate-800">1 part</p>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    }

    // ── List View ──
    return (
        <div className="min-h-full pb-36 lg:pb-12 px-5 pt-8 space-y-7 select-none bg-slate-50 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="text-left">
                    <h1 className="text-[26px] font-black text-gray-800 tracking-tight leading-tight">Mon Journal</h1>
                    <p className="text-[12px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Historique Complet</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative group pt-2">
                <div className="absolute inset-y-0 left-5 top-2 flex items-center pointer-events-none transition-transform group-focus-within:scale-110 group-focus-within:text-emerald-500">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-emerald-500 text-[22px] transition-colors">search</span>
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un plat..."
                    className="w-full bg-white border-2 border-transparent rounded-[20px] py-4 pl-14 pr-5 text-[15px] font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-emerald-100 focus:bg-emerald-50/30 shadow-[0_8px_20px_rgba(0,0,0,0.03)] transition-all" />
            </div>

            {/* List */}
            <div>
                <div className="flex justify-between items-end mb-4 px-1 mt-2">
                    <h2 className="text-[16px] font-black text-slate-800 tracking-tight">Derniers enregistrements</h2>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-[100px] bg-white rounded-[24px] animate-pulse shadow-sm"></div>)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 flex flex-col items-center text-center shadow-sm border border-gray-100 mt-6 mt-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-4xl text-gray-400">restaurant</span>
                        </div>
                        <p className="text-[18px] font-black text-slate-800">Aucun historique</p>
                        <p className="text-[14px] font-medium text-gray-500 mt-2">Scannez des plats pour voir vos analyses ici.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLogs.map((log) => (
                            <div key={log.id} onClick={() => setSelectedMeal(log)}
                                className="bg-white rounded-[24px] p-3 flex items-center gap-4 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg cursor-pointer group border border-gray-100">
                                <div className="w-[84px] h-[84px] rounded-[18px] overflow-hidden flex-shrink-0 bg-gray-100 relative">
                                    {log.image_url ? (
                                        <img src={log.image_url} alt={log.food_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-emerald-50 to-teal-50">🥗</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-2">
                                    <p className="text-[17px] font-black text-slate-800 truncate mb-1">{log.food_name}</p>
                                    <p className="text-[12px] font-bold text-gray-400 mb-2">
                                        {new Date(log.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                                            <span className="material-symbols-outlined text-[14px] text-emerald-500" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                                            <span className="text-[12px] font-black text-slate-700">{log.calories} kcal</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mr-2 group-hover:bg-emerald-50 group-hover:text-emerald-500 text-gray-400 transition-colors shadow-sm border border-gray-100">
                                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealDetails;

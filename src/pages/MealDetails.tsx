/**
 * MealDetails.tsx — Premium V4
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
        if (s >= 8) return { label: 'Excellent', color: '#84cc16', ringStart: '#84cc16', ringEnd: '#10b981', gradientId: 'gradient-green' };
        if (s >= 6) return { label: 'Moderate', color: '#84cc16', ringStart: '#6366f1', ringEnd: '#f59e0b', gradientId: 'gradient-orange' };
        return { label: 'Poor', color: '#ef4444', ringStart: '#ef4444', ringEnd: '#f43f5e', gradientId: 'gradient-red' };
    };

    const MacroPill = ({ label, value, unit, colorIcon, colorBg }: { label: string; value: number; unit: string; colorIcon: string; colorBg: string }) => (
        <div className={`flex flex-col items-center justify-center rounded-[2rem] w-16 py-3 px-1 border border-white/50 text-white`} style={{ backgroundColor: colorBg, boxShadow: `0 8px 16px ${colorBg}40` }}>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm mb-1">
                 {label === 'Carbs' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>spa</span>}
                 {label === 'Protein' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>local_drink</span>}
                 {label === 'Fat' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>water_drop</span>}
                 {label === 'Fiber' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>eco</span>}
            </div>
            <span className="text-[11px] font-bold opacity-90">{label}</span>
            <span className="text-[13px] font-black">{Math.round(value)} {unit}</span>
        </div>
    );

    const AITag = ({ icon, text, type }: { icon: string; text: string; type: 'green' | 'blue' | 'gray' | 'red' | 'yellow' }) => {
        const colors = {
            green: 'text-emerald-700 bg-emerald-50 border-emerald-200',
            blue: 'text-indigo-700 bg-indigo-50 border-indigo-200',
            gray: 'text-gray-600 bg-gray-50 border-gray-200',
            red: 'text-rose-700 bg-rose-50 border-rose-200',
            yellow: 'text-amber-700 bg-amber-50 border-amber-200',
        };
        return (
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-sm ${colors[type]}`}>
                <span className="material-symbols-outlined text-[14px]">{icon}</span>
                <span className="text-[11px] font-bold">{text}</span>
            </div>
        );
    };

    const SwapItem = ({ image, name }: { image: string, name: string }) => (
        <div className="flex flex-col gap-2 flex-shrink-0 w-32 group cursor-pointer relative snap-center">
            <div className="w-32 h-32 rounded-3xl overflow-hidden shadow-md border border-gray-100 relative">
                <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-slate-900/90 to-transparent pointer-events-none"></div>
                <div className="absolute bottom-3 left-0 w-full px-3">
                    <p className="text-[12px] font-black text-center text-white leading-tight drop-shadow-md">{name}</p>
                </div>
            </div>
        </div>
    );

    // ── Detail View ──
    if (selectedMeal) {
        const score = selectedMeal.health_score || 0;
        const scoreUI = getScoreDetails(score);

        const radius = 65;
        const circ = 2 * Math.PI * radius;
        const pct = (score / 10) * 100;
        const offset = circ - (pct / 100) * circ;

        return (
            <div className="min-h-full pb-8 select-none bg-gray-50 font-sans relative">
                {/* Hero Section */}
                <div className="relative h-[28rem] w-full">
                    {selectedMeal.image_url ? (
                        <img src={selectedMeal.image_url} alt={selectedMeal.food_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-5xl">🥗</div>
                    )}
                    
                    {/* Navbar over image */}
                    <div className="absolute top-0 left-0 w-full pt-12 pb-6 px-6 flex items-center justify-between text-white backdrop-blur-[2px] bg-gradient-to-b from-black/40 to-transparent">
                        <button onClick={() => setSelectedMeal(null)} className="flex items-center text-white outline-none active:opacity-70">
                            <span className="material-symbols-outlined text-[26px]">chevron_left</span>
                            <span className="text-[17px] font-bold ml-1 tracking-tight">Journal</span>
                        </button>
                    </div>

                    {/* Date/Time Badges (only on history details) */}
                    <div className="absolute bottom-52 left-6 flex flex-wrap gap-2 pr-6">
                        <div className="px-3.5 py-1.5 rounded-full bg-white/25 backdrop-blur-md border border-white/30 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                            {new Date(selectedMeal.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="px-3.5 py-1.5 rounded-full bg-black/30 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white shadow-sm flex items-center gap-1.5 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[13px]">schedule</span>
                            {new Date(selectedMeal.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                </div>

                {/* Main White Content Card */}
                <div className="bg-[#fcfdfd] w-full rounded-t-[3rem] px-6 pt-24 pb-8 relative shadow-[0_-10px_40px_rgba(0,0,0,0.1)]" style={{ marginTop: '-12rem' }}>
                    
                    {/* Overlapping Circular Card */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-white rounded-full flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.06)] border border-gray-50">
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                            <svg width="176" height="176" className="absolute inset-0">
                                <defs>
                                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={scoreUI.ringStart} />
                                        <stop offset="100%" stopColor={scoreUI.ringEnd} />
                                    </linearGradient>
                                </defs>
                                {/* Background Track */}
                                <circle cx="88" cy="88" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="8" />
                                {/* Animated Value */}
                                <circle cx="88" cy="88" r={radius} fill="none"
                                    stroke="url(#ringGrad)" strokeWidth="8"
                                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                    transform="rotate(-90 88 88)"
                                    className="transition-all duration-[1.5s] ease-out"
                                />
                            </svg>
                            
                            <h2 className="text-[22px] font-black tracking-tight" style={{ color: scoreUI.color }}>{scoreUI.label}</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-0.5">Calorie Count</p>
                            <p className="text-[26px] font-medium text-gray-500 tracking-tight leading-none mt-1">
                                {Math.round(selectedMeal.calories)} <span className="text-[16px]">kcal</span>
                            </p>
                        </div>
                    </div>

                    {/* Body Content */}
                    <div className="max-w-md mx-auto space-y-6">
                        
                        <div className="text-center mt-4">
                            <h1 className="text-2xl font-black text-gray-800 tracking-tight mb-8">{selectedMeal.food_name}</h1>
                        </div>

                        {/* Nutritional Value Title */}
                        <div>
                            <h3 className="text-[15px] font-bold text-gray-500 tracking-wide mb-3">Nutritional Value</h3>
                            <div className="flex justify-between items-center px-1">
                                <MacroPill label="Carbs" value={selectedMeal.carbs_g} unit="g" colorBg="#f97316" colorIcon="#f97316" />
                                <MacroPill label="Protein" value={selectedMeal.protein_g} unit="g" colorBg="#14b8a6" colorIcon="#14b8a6" />
                                <MacroPill label="Fat" value={selectedMeal.fat_g} unit="g" colorBg="#eab308" colorIcon="#eab308" />
                                <MacroPill label="Fiber" value={selectedMeal.fiber_g || 0} unit="g" colorBg="#22c55e" colorIcon="#22c55e" />
                            </div>
                        </div>

                        {/* Glycemic Load */}
                        <div className="w-full bg-white border border-gray-200 rounded-xl py-3 flex items-center justify-center gap-2 shadow-sm relative overflow-hidden">
                            <span className="material-symbols-outlined text-rose-500 text-[18px]">device_thermostat</span>
                            <span className="text-[14px] font-bold text-indigo-700 tracking-tight">Glycemic Load</span>
                            <span className="text-[14px] font-black text-amber-500">≈ 19</span>
                        </div>

                        {/* AI Analysis Block */}
                        <div className="border border-gray-200 rounded-[2rem] pt-6 pb-6 px-5 bg-white relative shadow-sm">
                            
                            <h3 className="text-[15px] font-bold text-gray-500 tracking-wide mb-4">AI Analysis</h3>
                            
                            <div className="flex flex-wrap gap-2 mb-4">
                                <AITag type="green" icon="eco" text="Fresh" />
                                <AITag type="blue" icon="blur_circular" text="Medium GI" />
                                <AITag type="green" icon="check_circle" text="Balanced Meal" />
                                <AITag type="red" icon="local_fire_department" text="High Calorie" />
                                <AITag type="yellow" icon="fitness_center" text="Protein Rich" />
                            </div>

                            <p className="text-[13px] text-gray-600 leading-relaxed font-medium mb-5">
                                {selectedMeal.health_tips ? selectedMeal.health_tips : (
                                    <>
                                        This breakfast wrap, likely is filled with eggs, greens, cheese, and some bacon. It fits best under an <span className="font-bold text-lime-600">"eat in moderation"</span> category due to its refined tortilla and higher fat content.
                                    </>
                                )}
                            </p>

                            <h4 className="text-[16px] font-black text-gray-800 mb-4 tracking-tight">
                                {selectedMeal.recipes && selectedMeal.recipes.length > 0 ? "Recettes Suggérées" : "Alternatives Saines"}
                            </h4>
                            <div className="flex items-start gap-4 overflow-x-auto pb-6 -mx-1 px-1 custom-scrollbar snap-x">
                                {selectedMeal.recipes && selectedMeal.recipes.length > 0 ? (
                                    selectedMeal.recipes.map((recipe: any, i: number) => (
                                        <SwapItem key={i} name={recipe.name} image={recipe.image} />
                                    ))
                                ) : (
                                    <>
                                        <SwapItem name="Tortilla au Blé" image="https://images.unsplash.com/photo-1626200419109-383a54b38dcd?w=400&q=80" />
                                        <SwapItem name="Filet de Poulet" image="https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?w=400&q=80" />
                                        <SwapItem name="Gouda Allégé" image="https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&q=80" />
                                        <SwapItem name="Légumes Verts" image="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&q=80" />
                                        <SwapItem name="Blanc d'oeuf" image="https://images.unsplash.com/photo-1587486913049-53fd88e24c4e?w=400&q=80" />
                                    </>
                                )}
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
                <NavLink to="/" className="w-12 h-12 bg-white flex items-center justify-center rounded-[1.2rem] shadow-[0_2px_15px_rgb(0,0,0,0.04)] hover:shadow-md hover:-translate-x-1 transition-all border border-gray-100">
                    <span className="material-symbols-outlined text-gray-700 text-[22px]">arrow_back</span>
                </NavLink>
                <div className="text-center">
                    <h1 className="text-[22px] font-black text-gray-800 tracking-tight leading-tight">Mon Journal</h1>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mt-1">Historique</p>
                </div>
                <div className="w-12"></div>
            </div>

            {/* Search */}
            <div className="relative group pt-2">
                <div className="absolute inset-y-0 left-5 top-2 flex items-center pointer-events-none transition-transform group-focus-within:scale-110 group-focus-within:text-emerald-500">
                    <span className="material-symbols-outlined text-gray-400 group-focus-within:text-emerald-500 text-[22px] transition-colors">search</span>
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Filtrer vos plats..."
                    className="w-full bg-white border-2 border-transparent rounded-[1.5rem] py-4.5 pl-14 pr-5 text-[15px] font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-medium focus:outline-none focus:border-emerald-100 focus:bg-emerald-50/30 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all" />
            </div>

            {/* List */}
            <div>
                <div className="flex justify-between items-end mb-4 px-1.5 mt-2">
                    <h2 className="text-[15px] font-black text-gray-700 tracking-tight">Derniers plats enregistrés</h2>
                    <span className="text-[11px] font-black text-gray-500 bg-gray-200/60 px-3 py-1.5 rounded-full">{filteredLogs.length} rps</span>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-[92px] bg-white rounded-[1.5rem] animate-pulse shadow-[0_4px_15px_rgb(0,0,0,0.02)]"></div>)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 flex flex-col items-center text-center border-2 border-dashed border-gray-200/60 shadow-sm mt-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-[1.5rem] flex items-center justify-center mb-5">
                            <span className="material-symbols-outlined text-5xl text-gray-300">search_off</span>
                        </div>
                        <p className="text-[17px] font-black text-gray-700">Aucun plat trouvé</p>
                        <p className="text-sm font-medium text-gray-400 mt-1.5">Avez-vous bien orthographié ?</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredLogs.map((log) => (
                            <div key={log.id} onClick={() => setSelectedMeal(log)}
                                className="bg-white rounded-[1.5rem] p-3.5 flex items-center gap-4 active:scale-[0.98] transition-all shadow-[0_4px_15px_rgb(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgb(0,0,0,0.08)] cursor-pointer group border border-gray-50">
                                <div className="w-[72px] h-[72px] rounded-[1.2rem] overflow-hidden flex-shrink-0 bg-gray-100 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
                                    {log.image_url ? (
                                        <img src={log.image_url} alt={log.food_name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-emerald-50 to-teal-50">🥗</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0 py-1.5">
                                    <p className="text-[16px] font-black text-gray-800 truncate mb-1.5">{log.food_name}</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-100/50">
                                            <span className="material-symbols-outlined text-[13px] text-amber-500">local_fire_department</span>
                                            <span className="text-[11px] font-black text-amber-700">{log.calories} kcal</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${log.health_score >= 8 ? 'bg-emerald-50/80 border-emerald-100/50' : log.health_score >= 6 ? 'bg-orange-50/80 border-orange-100/50' : 'bg-red-50/80 border-red-100/50'}`}>
                                            <span className={`material-symbols-outlined text-[13px] ${log.health_score >= 8 ? 'text-emerald-500' : log.health_score >= 6 ? 'text-orange-500' : 'text-red-500'}`}>favorite</span>
                                            <span className={`text-[11px] font-black ${log.health_score >= 8 ? 'text-emerald-700' : log.health_score >= 6 ? 'text-orange-700' : 'text-red-700'}`}>{log.health_score}/10</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center mr-1 group-hover:bg-emerald-50 group-hover:text-emerald-500 text-gray-400 transition-colors shadow-sm border border-gray-100">
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

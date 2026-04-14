/**
 * MealDetails.tsx — Clean Professional V3
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

    const ScoreRing = ({ score }: { score: number }) => {
        const radius = 38;
        const circ = 2 * Math.PI * radius;
        const pct = (score / 10) * 100;
        const offset = circ - (pct / 100) * circ;
        const color = score >= 8 ? '#10b981' : score >= 6 ? '#f59e0b' : '#ef4444';

        return (
            <div className="relative w-24 h-24 mx-auto">
                <svg width="96" height="96">
                    <circle cx="48" cy="48" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                    <circle cx="48" cy="48" r={radius} fill="none"
                        stroke={color} strokeWidth="6"
                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                        transform="rotate(-90 48 48)"
                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-gray-900">{score}</span>
                    <span className="text-[10px] font-medium text-gray-400">/10</span>
                </div>
            </div>
        );
    };

    const MacroRow = ({ label, value, unit, pct, color }: { label: string; value: number; unit: string; pct: number; color: string }) => (
        <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 w-16">{label}</span>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(pct, 100)}%`, background: color }}></div>
            </div>
            <span className="text-sm font-semibold text-gray-800 w-14 text-right">{value} {unit}</span>
        </div>
    );

    // ── Detail View ──
    if (selectedMeal) {
        const score = selectedMeal.health_score || 0;
        const scoreLabel = score >= 8 ? 'Excellent' : score >= 6 ? 'Bon' : 'À améliorer';

        return (
            <div className="min-h-full pb-36 lg:pb-12 select-none bg-gray-50">
                {/* Hero Image */}
                <div className="relative h-64 sm:h-72 overflow-hidden">
                    {selectedMeal.image_url ? (
                        <img src={selectedMeal.image_url} alt={selectedMeal.food_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-5xl">🥗</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
                    <button onClick={() => setSelectedMeal(null)}
                        className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition">
                        <span className="material-symbols-outlined text-gray-700 text-xl">arrow_back</span>
                    </button>
                </div>

                <div className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-5 max-w-2xl mx-auto">
                    {/* Name + Date */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h1 className="text-xl font-extrabold text-gray-900 mb-1">{selectedMeal.food_name}</h1>
                        <p className="text-xs text-gray-400">
                            {new Date(selectedMeal.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {' • '}
                            {new Date(selectedMeal.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Score */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <p className="text-xs font-semibold text-gray-400 text-center mb-3">Score de santé</p>
                        <ScoreRing score={score} />
                        <p className="text-center mt-2 text-xs font-semibold text-gray-500">{scoreLabel}</p>
                    </div>

                    {/* Macros */}
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 mb-4">Répartition nutritionnelle</h2>
                        
                        {/* Calorie + Protein highlights */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                            <div className="bg-amber-50 rounded-xl p-4 text-center border border-amber-100">
                                <p className="text-2xl font-extrabold text-amber-600">{selectedMeal.calories}</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Calories</p>
                            </div>
                            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                <p className="text-2xl font-extrabold text-red-500">{selectedMeal.protein_g}g</p>
                                <p className="text-[11px] font-medium text-gray-500 mt-0.5">Protéines</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <MacroRow label="Glucides" value={selectedMeal.carbs_g} unit="g" pct={(selectedMeal.carbs_g / 300) * 100} color="#3b82f6" />
                            <MacroRow label="Lipides" value={selectedMeal.fat_g} unit="g" pct={(selectedMeal.fat_g / 80) * 100} color="#8b5cf6" />
                            <MacroRow label="Fibres" value={selectedMeal.fiber_g} unit="g" pct={(selectedMeal.fiber_g / 30) * 100} color="#10b981" />
                            <MacroRow label="Sucres" value={selectedMeal.sugar_g} unit="g" pct={(selectedMeal.sugar_g / 50) * 100} color="#f43f5e" />
                        </div>
                    </div>

                    {/* AI Tips */}
                    {selectedMeal.health_tips && (
                        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-emerald-500 text-lg">auto_awesome</span>
                                <h2 className="text-sm font-semibold text-gray-700">Conseils de l'IA</h2>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-emerald-200">
                                {selectedMeal.health_tips}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── List View ──
    return (
        <div className="min-h-full pb-36 lg:pb-12 px-4 sm:px-6 lg:px-8 pt-6 space-y-6 select-none bg-gray-50">
            {/* Header */}
            <div className="flex items-center justify-between">
                <NavLink to="/" className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-gray-600 text-xl">arrow_back</span>
                </NavLink>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900">Mes repas</h1>
                    <p className="text-xs text-gray-400">Explorez vos analyses</p>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Search */}
            <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-400 text-xl">search</span>
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un repas..."
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition shadow-sm" />
            </div>

            {/* List */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-sm font-semibold text-gray-500">Résultats</h2>
                    <span className="text-xs font-medium text-gray-400">{filteredLogs.length} repas</span>
                </div>

                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100"></div>)}
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center border border-dashed border-gray-200">
                        <span className="material-symbols-outlined text-3xl text-gray-300 mb-3">search_off</span>
                        <p className="text-sm text-gray-500">Aucun résultat</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredLogs.map((log) => (
                            <div key={log.id} onClick={() => setSelectedMeal(log)}
                                className="bg-white rounded-2xl p-3 flex items-center gap-3 active:scale-[0.98] transition-all border border-gray-100 shadow-sm hover:shadow-md cursor-pointer group">
                                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gray-50">
                                    {log.image_url ? (
                                        <img src={log.image_url} alt="food" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🥗</div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{log.food_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-xs font-semibold text-emerald-600">{log.calories} kcal</span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-gray-400">Score: {log.health_score}/10</span>
                                    </div>
                                </div>
                                <span className="material-symbols-outlined text-gray-300 group-hover:text-emerald-500 transition-colors text-xl">chevron_right</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MealDetails;

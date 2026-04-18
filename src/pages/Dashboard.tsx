/**
 * Dashboard.tsx — Clean Professional V3
 */
import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { PREMIUM_CATEGORIES } from '../data/mockData';
import { useData } from '../context/DataContext';
import WaterTracker from '../components/WaterTracker';
import DashboardChart from '../components/DashboardChart';

const Dashboard: React.FC = () => {
    const { foodLogs, userProfile, waterIntake, addWater, loading } = useData();
    const [goal, setGoal] = useState(2200);
    const [consumed, setConsumed] = useState(0);

    useEffect(() => {
        if (userProfile) {
            setGoal(userProfile.daily_calorie_goal || 2200);
        }
    }, [userProfile]);

    useEffect(() => {
        if (foodLogs) {
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const todayLogs = foodLogs.filter(log => new Date(log.created_at) >= today);
            const totalCal = todayLogs.reduce((s, l) => s + (l.calories || 0), 0);
            setConsumed(totalCal);
        }
    }, [foodLogs]);

    const pct = Math.min((consumed / goal) * 100, 100);
    const radius = 70;
    const circ = 2 * Math.PI * radius;
    const offset = circ - (pct / 100) * circ;

    const avatarUrl = userProfile?.avatar_url || 'https://i.pravatar.cc/150?u=ariafood_v2';

    return (
        <div className="pb-36 lg:pb-12 min-h-full px-4 sm:px-6 lg:px-8 pt-6 space-y-6 select-none">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <img src={avatarUrl} alt="avatar" className="w-11 h-11 rounded-full border-2 border-emerald-200 object-cover" />
                    <div>
                        <p className="text-sm text-gray-400 font-medium">Bonjour 👋</p>
                        <p className="text-lg font-bold text-gray-900 leading-tight">{userProfile?.full_name || 'Explorateur'}</p>
                    </div>
                </div>
                <button className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <span className="material-symbols-outlined text-gray-500 text-xl">notifications</span>
                </button>
            </header>

            {/* Calorie + Water — side by side on desktop */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-4 lg:space-y-0">
                {/* Calorie Ring Card */}
                <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <svg width="170" height="170" className="overflow-visible">
                                <circle cx="85" cy="85" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                <circle cx="85" cy="85" r={radius} fill="none"
                                    stroke="url(#calGrad)"
                                    strokeWidth="12"
                                    strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                    transform="rotate(-90 85 85)"
                                    style={{ transition: 'stroke-dashoffset 1.5s ease' }}
                                />
                                <defs>
                                    <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" style={{ stopColor: '#10b981' }} />
                                        <stop offset="100%" style={{ stopColor: '#34d399' }} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <p className="text-4xl font-extrabold text-gray-900">{consumed}</p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">kcal consommées</p>
                            </div>
                        </div>

                        <div className="w-full flex justify-between pt-4 border-t border-gray-100">
                            <div>
                                <p className="text-xs text-gray-400 font-medium">Objectif</p>
                                <p className="text-lg font-bold text-gray-900">{goal}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400 font-medium">Restant</p>
                                <p className="text-lg font-bold text-emerald-500">{Math.max(goal - consumed, 0)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Water Tracking */}
                <WaterTracker 
                    currentAmount={waterIntake}
                    goal={userProfile?.weight_kg && userProfile?.activity_level ? (userProfile.weight_kg * 35) + (userProfile.activity_level === 'Active' || userProfile.activity_level === 'Very Active' ? 500 : 0) : 2000} 
                    onAddWater={addWater} 
                />
            </div>

            {/* Sport & Female Health */}
            <div className={`grid grid-cols-1 ${userProfile?.gender === 'female' ? 'sm:grid-cols-2' : ''} gap-4`}>
                <NavLink to="/workout" className="block bg-gradient-to-br from-emerald-500 to-teal-400 rounded-3xl p-5 shadow-lg shadow-emerald-500/20 text-white group active:scale-[0.98] transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold mb-0.5">Activité</h3>
                            <p className="text-sm text-emerald-50 font-medium">Mode course</p>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <span className="material-symbols-outlined text-3xl text-white">directions_run</span>
                        </div>
                    </div>
                </NavLink>

                {userProfile?.gender === 'female' && (
                    <NavLink to="/cycle" className="block bg-gradient-to-br from-rose-400 to-pink-500 rounded-3xl p-5 shadow-lg shadow-rose-500/20 text-white group active:scale-[0.98] transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold mb-0.5">Cycle</h3>
                                <p className="text-sm text-rose-50 font-medium">Suivi hormonal</p>
                            </div>
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-3xl text-white">water_drop</span>
                            </div>
                        </div>
                    </NavLink>
                )}
            </div>

            {/* Weekly Advice (Sky & Clouds) */}
            <NavLink to="/advice" className="block w-full active:scale-[0.98] transition-transform mb-6 group">
                <div className="bg-gradient-to-b from-sky-400 to-sky-300 rounded-[24px] p-5 relative overflow-hidden flex items-center justify-between shadow-lg shadow-sky-500/30 w-full h-full border border-sky-200">
                    
                    {/* CSS Clouds Background Effect */}
                    <div className="absolute inset-0 z-0 opacity-90 pointer-events-none">
                        <style>{`
                            @keyframes drift1 { 0% { transform: translateX(0px); } 50% { transform: translateX(20px); } 100% { transform: translateX(0px); } }
                            @keyframes drift2 { 0% { transform: translateX(10px); } 50% { transform: translateX(-15px); } 100% { transform: translateX(10px); } }
                            @keyframes drift3 { 0% { transform: translateX(-10px); } 50% { transform: translateX(25px); } 100% { transform: translateX(-10px); } }
                        `}</style>
                        {/* Nuage 1 */}
                        <div className="absolute top-2 left-[5%] w-14 h-4 bg-white/80 rounded-full blur-[0.5px]" style={{ animation: 'drift1 15s ease-in-out infinite' }}>
                            <div className="absolute -top-3 left-2 w-7 h-7 bg-white/80 rounded-full"></div>
                            <div className="absolute -top-2 left-6 w-6 h-6 bg-white/80 rounded-full"></div>
                        </div>
                        {/* Nuage 2 */}
                        <div className="absolute top-8 right-[15%] w-20 h-5 bg-white/90 rounded-full blur-[0.5px]" style={{ animation: 'drift2 20s ease-in-out infinite' }}>
                           <div className="absolute -top-4 left-4 w-9 h-9 bg-white/90 rounded-full"></div>
                           <div className="absolute -top-3 left-10 w-7 h-7 bg-white/90 rounded-full"></div>
                        </div>
                        {/* Nuage 3 (Partiellement caché bas gauche) */}
                        <div className="absolute -bottom-2 left-[30%] w-24 h-6 bg-white/50 rounded-full blur-[1px]" style={{ animation: 'drift3 25s ease-in-out infinite' }}>
                           <div className="absolute -top-5 left-4 w-10 h-10 bg-white/50 rounded-full"></div>
                        </div>
                         {/* Soleil rayonnant discret */}
                         <div className="absolute -top-8 -right-4 w-24 h-24 bg-yellow-200/50 blur-2xl rounded-full"></div>
                    </div>
                    
                    <div className="flex-1 text-left relative z-10 pt-1">
                        <h3 className="text-[20px] font-black text-white drop-shadow-sm leading-tight mb-1">Conseil de la Semaine</h3>
                        <p className="text-[13px] text-sky-50 font-medium">Découvrez votre analyse hebdo</p>
                    </div>
                    <div className="w-[50px] h-[50px] bg-white rounded-[16px] flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform flex-shrink-0 relative z-10 border-b-[3px] border-gray-100">
                         <span className="material-symbols-outlined text-sky-500 text-2xl font-bold">arrow_forward</span>
                    </div>
                </div>
            </NavLink>

            {/* Categories */}
            <section>
                <h2 className="text-sm font-semibold text-gray-500 mb-4">Catégories</h2>
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 lg:flex-wrap lg:overflow-visible lg:mx-0 lg:px-0">
                    {PREMIUM_CATEGORIES.map((cat) => (
                        <div key={cat.label} className="flex flex-col items-center gap-2 flex-shrink-0">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer active:scale-95"
                                style={{ background: `linear-gradient(135deg, ${cat.color}08 0%, white 100%)` }}>
                                {cat.emoji}
                            </div>
                            <span className="text-[11px] font-medium text-gray-500">{cat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* AI Insights & Chart */}
            <DashboardChart logs={foodLogs} />

            {/* Recent Scans */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold text-gray-500">Scans récents</h2>
                    <NavLink to="/history" className="text-xs font-semibold text-emerald-600 flex items-center gap-1 hover:text-emerald-700">
                        Tout voir <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </NavLink>
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2].map(i => <div key={i} className="h-52 bg-white rounded-2xl animate-pulse border border-gray-100"></div>)}
                    </div>
                ) : foodLogs.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center text-center border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-emerald-400 text-3xl">restaurant</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 mb-1">Aucun scan pour le moment</p>
                        <p className="text-xs text-gray-400">Scannez un plat pour commencer votre suivi</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {foodLogs.slice(0, 2).map((log) => (
                            <NavLink key={log.id} to="/meals" state={{ selectedMeal: log }}
                                className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all active:scale-[0.98] block group">
                                <div className="w-full h-32 overflow-hidden relative">
                                    {log.image_url ? (
                                        <img src={log.image_url} alt={log.food_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">🥗</div>
                                    )}
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-lg text-xs font-semibold text-emerald-600">
                                        {log.calories} kcal
                                    </div>
                                </div>
                                <div className="p-3">
                                    <p className="text-sm font-semibold text-gray-800 truncate">{log.food_name}</p>
                                    <p className="text-[11px] text-gray-400 mt-0.5">Analysé récemment</p>
                                </div>
                            </NavLink>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

export default Dashboard;

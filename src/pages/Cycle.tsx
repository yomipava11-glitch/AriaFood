/**
 * Cycle.tsx — Professional V3
 * Menstrual Cycle & Hormone Tracker integrated with AI
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Cycle: React.FC = () => {
    const navigate = useNavigate();

    // Mock data for the cycle tracker
    // Later this will come from userProfile / database
    const [cycleDay] = useState(21); 
    const cycleLength = 28;
    
    // Determine phase based on standard 28-day cycle
    let phase = '';
    let phaseColor = '';
    let phaseIcon = '';
    let aiTip = '';

    if (cycleDay >= 1 && cycleDay <= 5) {
        phase = 'Menstruation';
        phaseColor = 'text-rose-500';
        phaseIcon = 'water_drop';
        aiTip = "L'énergie est au plus bas. Privilégiez des entraînements doux comme le yoga. Consommez du fer (viande rouge, lentilles) pour compenser les pertes.";
    } else if (cycleDay >= 6 && cycleDay <= 13) {
        phase = 'Phase Folliculaire';
        phaseColor = 'text-fuchsia-500';
        phaseIcon = 'spa';
        aiTip = "Les œstrogènes grimpent ! Vous avez plus d'énergie, c'est le moment idéal pour des entraînements cardio et des repas frais et légers.";
    } else if (cycleDay >= 14 && cycleDay <= 15) {
        phase = 'Ovulation';
        phaseColor = 'text-pink-500';
        phaseIcon = 'flare';
        aiTip = "Pic d'énergie et de métabolisme ! Vous brûlez plus facilement les graisses aujourd'hui. Dépensez-vous au maximum !";
    } else {
        phase = 'Phase Lutéale';
        phaseColor = 'text-purple-500';
        phaseIcon = 'nights_stay';
        aiTip = "La progestérone augmente : la rétention d'eau et les fringales sont normales. Buvez beaucoup d'eau et mangez des glucides complexes et du magnésium (chocolat noir !).";
    }

    const nextPeriod = cycleLength - cycleDay + 1;

    return (
        <div className="min-h-full pb-36 lg:pb-12 bg-gray-50 select-none">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between relative z-10">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-gray-600 text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900">Aria<span className="text-rose-500">Cycle</span></h1>
                    <p className="text-xs text-rose-500 font-semibold uppercase tracking-widest">Suivi Hormonal</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mt-6 space-y-6 max-w-2xl mx-auto flex flex-col items-center">
                
                {/* Immersive Cycle Ring */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <div className="absolute inset-0 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
                    <svg className="w-full h-full transform -rotate-90 pointer-events-none relative z-10">
                        <circle cx="128" cy="128" r="110" className="text-gray-100" strokeWidth="12" stroke="currentColor" fill="none" />
                        <circle cx="128" cy="128" r="110" className={phaseColor} strokeWidth="12" stroke="currentColor" fill="none" 
                            strokeDasharray={2 * Math.PI * 110} 
                            strokeDashoffset={2 * Math.PI * 110 - (cycleDay / cycleLength) * 2 * Math.PI * 110} 
                            strokeLinecap="round" 
                            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center relative z-20">
                        <span className={`material-symbols-outlined ${phaseColor} text-3xl mb-1`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {phaseIcon}
                        </span>
                        <h2 className="text-5xl font-extrabold text-gray-900">J{cycleDay}</h2>
                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-[0.2em]">{phase}</p>
                    </div>
                </div>

                {/* Prediction Card */}
                <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800">Prochaines règles dans</h3>
                        <p className="text-[10px] font-medium text-gray-400">Prédiction basée sur 28 jours</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 text-center">
                        <p className="text-2xl font-extrabold text-rose-500">{nextPeriod}</p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Jours</p>
                    </div>
                </div>

                {/* Aria AI specific insights */}
                <div className="w-full bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex items-center gap-2 mb-3 relative z-10">
                        <span className="material-symbols-outlined text-rose-500 text-lg">auto_awesome</span>
                        <h2 className="text-sm font-semibold text-gray-700">Insights Hormonaux Aria</h2>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed pl-4 border-l-2 border-rose-200 relative z-10">
                        {aiTip}
                    </p>
                </div>

                {/* Quick Log Symptoms */}
                <div className="w-full">
                    <h2 className="text-sm font-semibold text-gray-500 mb-3">Symptômes d'aujourd'hui</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { icon: 'sentiment_satisfied', label: 'Bien', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                            { icon: 'sentiment_dissatisfied', label: 'Triste', color: 'bg-blue-50 text-blue-600 border-blue-100' },
                            { icon: 'healing', label: 'Douleur', color: 'bg-orange-50 text-orange-600 border-orange-100' },
                            { icon: 'fastfood', label: 'Fringale', color: 'bg-purple-50 text-purple-600 border-purple-100' },
                        ].map((symptom, idx) => (
                            <button key={idx} className={`flex flex-col items-center justify-center p-3 rounded-xl border ${symptom.color} active:scale-95 transition-transform`}>
                                <span className="material-symbols-outlined mb-1">{symptom.icon}</span>
                                <span className="text-[9px] font-bold">{symptom.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Log Period Button */}
                <button className="w-full max-w-sm mt-4 py-4 rounded-xl bg-white border border-rose-200 text-rose-500 font-semibold text-sm shadow-sm hover:bg-rose-50 active:scale-[0.98] transition-all">
                    <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-lg">edit_calendar</span>
                        Marquer le début des règles
                    </span>
                </button>
            </div>
        </div>
    );
};

export default Cycle;

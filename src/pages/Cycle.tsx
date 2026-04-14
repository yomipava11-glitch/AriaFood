/**
 * Cycle.tsx — Professional V3
 * Menstrual Cycle & Hormone Tracker integrated with AI & Database
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Cycle: React.FC = () => {
    const navigate = useNavigate();

    const [cycleDay, setCycleDay] = useState(1);
    const [cycleLength, setCycleLength] = useState(28);
    const [loading, setLoading] = useState(true);
    const [todaySymptoms, setTodaySymptoms] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            // Fetch profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('last_period_date, cycle_length')
                .eq('id', user.id)
                .single();

            if (profile) {
                if (profile.cycle_length) {
                    setCycleLength(profile.cycle_length);
                }
                if (profile.last_period_date) {
                    const today = new Date();
                    const lastPeriod = new Date(profile.last_period_date);
                    // Reset time to midnight for accurate day diff
                    today.setHours(0, 0, 0, 0);
                    lastPeriod.setHours(0, 0, 0, 0);
                    
                    const diffTime = today.getTime() - lastPeriod.getTime();
                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                    
                    // Modulo logic: cycle wraps around according to cycle_length
                    // But if it's longer than cycle length and they haven't recorded a new period,
                    // we show true day number (e.g. Day 30) rather than rolling over automatically.
                    setCycleDay(diffDays + 1);
                }
            }

            // Fetch today's symptoms
            const todayStr = new Date().toISOString().split('T')[0];
            const { data: symptomsData } = await supabase
                .from('cycle_symptoms')
                .select('symptom')
                .eq('user_id', user.id)
                .eq('date', todayStr);

            if (symptomsData) {
                setTodaySymptoms(symptomsData.map(s => s.symptom));
            }

        } catch (error) {
            console.error("Error loading cycle data:", error);
        } finally {
            setLoading(false);
        }
    };

    const markPeriodStart = async () => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        
        try {
            // Update profile
            await supabase
                .from('profiles')
                .update({ last_period_date: todayStr })
                .eq('id', userId);
            
            setCycleDay(1);
            alert("Date de début des règles enregistrée !");
        } catch (error) {
            console.error("Error updating period start:", error);
            alert("Erreur lors de l'enregistrement");
        }
    };

    const logSymptom = async (symptom: string) => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        
        const hasSymptom = todaySymptoms.includes(symptom);
        
        try {
            // Optimistic UI update
            if (hasSymptom) {
                setTodaySymptoms(prev => prev.filter(s => s !== symptom));
                await supabase
                    .from('cycle_symptoms')
                    .delete()
                    .eq('user_id', userId)
                    .eq('date', todayStr)
                    .eq('symptom', symptom);
            } else {
                setTodaySymptoms(prev => [...prev, symptom]);
                await supabase
                    .from('cycle_symptoms')
                    .upsert({ user_id: userId, date: todayStr, symptom }, { onConflict: 'user_id,date,symptom' });
            }
        } catch (error) {
            console.error("Error logging symptom:", error);
            // Revert on error
            loadData();
        }
    };

    // Determine phase based on standard 28-day logic (adjusted relatively if possible, but standard is fine for mvp)
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
    } else if (cycleDay > 15 && cycleDay <= cycleLength) {
        phase = 'Phase Lutéale';
        phaseColor = 'text-purple-500';
        phaseIcon = 'nights_stay';
        aiTip = "La progestérone augmente : la rétention d'eau et les fringales sont normales. Buvez beaucoup d'eau et mangez des glucides complexes et du magnésium (chocolat noir !).";
    } else {
        phase = 'Retard / Nouveau Cycle en attente';
        phaseColor = 'text-gray-500';
        phaseIcon = 'schedule';
        aiTip = "Votre cycle semble plus long que prévu. Enregistrez vos prochaines règles pour recalibrer l'IA Aria.";
    }

    const nextPeriod = cycleLength - cycleDay + 1 > 0 ? cycleLength - cycleDay + 1 : 0;

    const SYMPTOMS = [
        { icon: 'sentiment_satisfied', label: 'Bien', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', active: 'bg-emerald-500 text-white border-emerald-600' },
        { icon: 'sentiment_dissatisfied', label: 'Triste', color: 'bg-blue-50 text-blue-600 border-blue-100', active: 'bg-blue-500 text-white border-blue-600' },
        { icon: 'healing', label: 'Douleur', color: 'bg-orange-50 text-orange-600 border-orange-100', active: 'bg-orange-500 text-white border-orange-600' },
        { icon: 'fastfood', label: 'Fringale', color: 'bg-purple-50 text-purple-600 border-purple-100', active: 'bg-purple-500 text-white border-purple-600' },
    ];

    if (loading) {
        return (
            <div className="min-h-full pb-36 lg:pb-12 bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-full pb-36 lg:pb-12 bg-gray-50 select-none overflow-x-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between relative z-10 w-full">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-gray-600 text-xl">arrow_back</span>
                </button>
                <div className="text-center w-full max-w-[200px]">
                    <h1 className="text-lg font-bold text-gray-900">Aria<span className="text-rose-500">Cycle</span></h1>
                    <p className="text-xs text-rose-500 font-semibold uppercase tracking-widest truncate">Suivi Hormonal</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mt-6 space-y-6 max-w-2xl mx-auto flex flex-col items-center">
                
                {/* Immersive Cycle Ring */}
                <div className="relative w-64 h-64 flex items-center justify-center flex-shrink-0">
                    <div className="absolute inset-0 bg-rose-50 rounded-full blur-3xl opacity-50"></div>
                    <svg className="w-full h-full transform -rotate-90 pointer-events-none relative z-10 overflow-visible">
                        <circle cx="128" cy="128" r="110" className="text-gray-100" strokeWidth="12" stroke="currentColor" fill="none" />
                        <circle cx="128" cy="128" r="110" className={phaseColor} strokeWidth="12" stroke="currentColor" fill="none" 
                            strokeDasharray={2 * Math.PI * 110} 
                            strokeDashoffset={2 * Math.PI * 110 - (Math.min(cycleDay, cycleLength) / cycleLength) * 2 * Math.PI * 110} 
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
                        <p className="text-[10px] font-medium text-gray-400">Prédiction basée sur {cycleLength} jours</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-2 text-center flex-shrink-0">
                        <p className="text-2xl font-extrabold text-rose-500">
                            {cycleDay > cycleLength ? "Retard" : nextPeriod}
                        </p>
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">
                            {cycleDay > cycleLength ? "" : "Jours"}
                        </p>
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
                        {SYMPTOMS.map((symptom, idx) => {
                            const isActive = todaySymptoms.includes(symptom.label);
                            return (
                                <button 
                                    key={idx} 
                                    onClick={() => logSymptom(symptom.label)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${isActive ? symptom.active : symptom.color}`}
                                >
                                    <span className="material-symbols-outlined mb-1">{symptom.icon}</span>
                                    <span className="text-[9px] font-bold truncate w-full text-center">{symptom.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Log Period Button */}
                <button 
                    onClick={markPeriodStart}
                    className="w-full max-w-sm mt-4 py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold text-sm shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                    <span className="material-symbols-outlined text-lg">edit_calendar</span>
                    Marquer le début des règles
                </button>
            </div>
        </div>
    );
};

export default Cycle;


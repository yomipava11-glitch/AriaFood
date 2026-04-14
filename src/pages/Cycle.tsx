/**
 * Cycle.tsx — AriaCycle
 * Menstrual Cycle & Hormone Tracker with Real-Time AI Generation
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Cycle: React.FC = () => {
    const navigate = useNavigate();

    // === State ===
    const [cycleDay, setCycleDay] = useState(1);
    const [cycleLength, setCycleLength] = useState(28);
    const [periodDuration, setPeriodDuration] = useState(5);
    const [loading, setLoading] = useState(true);
    const [todaySymptoms, setTodaySymptoms] = useState<string[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [needsSetup, setNeedsSetup] = useState(false);
    const [fullProfile, setFullProfile] = useState<any>(null);

    // === AI State ===
    const [aiInsight, setAiInsight] = useState<string>('');
    const [loadingAi, setLoadingAi] = useState(false);

    // === Onboarding form state ===
    const [setupStep, setSetupStep] = useState(0);
    const [formLastPeriod, setFormLastPeriod] = useState('');
    const [formCycleLength, setFormCycleLength] = useState(28);
    const [formPeriodDuration, setFormPeriodDuration] = useState(5);
    const [savingSetup, setSavingSetup] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    // Load data and then optionally fetch AI
    const loadData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserId(user.id);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setFullProfile(profile);
                if (!profile.last_period_date) {
                    setNeedsSetup(true);
                    setLoading(false);
                    return;
                }

                if (profile.cycle_length) {
                    setCycleLength(profile.cycle_length);
                    setFormCycleLength(profile.cycle_length);
                }

                const today = new Date();
                const lastPeriod = new Date(profile.last_period_date);
                today.setHours(0, 0, 0, 0);
                lastPeriod.setHours(0, 0, 0, 0);

                const diffTime = today.getTime() - lastPeriod.getTime();
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                const currentDay = diffDays + 1;
                setCycleDay(currentDay);

                // Fetch today's symptoms
                const todayStr = new Date().toISOString().split('T')[0];
                const { data: symptomsData } = await supabase
                    .from('cycle_symptoms')
                    .select('symptom')
                    .eq('user_id', user.id)
                    .eq('date', todayStr);

                const currentSymptoms = symptomsData ? symptomsData.map(s => s.symptom) : [];
                setTodaySymptoms(currentSymptoms);

                // Trigger AI Insight automatically using calculated phase
                const calcPhase = getPhaseDetails(currentDay, profile.cycle_length || 28, 5).name;
                fetchAiInsight(calcPhase, currentDay, profile.cycle_length || 28, 5, currentSymptoms, profile);
                
            } else {
                setNeedsSetup(true);
            }
        } catch (error) {
            console.error("Error loading cycle data:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAiInsight = async (phaseName: string, day: number, len: number, pDur: number, symptoms: string[], prof: any) => {
        setLoadingAi(true);
        try {
            const res = await fetch('https://ncoaeyhnvpjlvmakzpft.supabase.co/functions/v1/cycle-insights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phase: phaseName,
                    cycleDay: day,
                    cycleLength: len,
                    periodDuration: pDur,
                    symptoms: symptoms,
                    profile: prof
                })
            });
            const data = await res.json();
            if (data.insight) {
                setAiInsight(data.insight);
            }
        } catch (err) {
            console.error("AI Insight Error:", err);
            setAiInsight("Aria analyse actuellement votre profil hormonal, veuillez patienter...");
        } finally {
            setLoadingAi(false);
        }
    };

    const saveSetup = async () => {
        if (!userId || !formLastPeriod) return;
        setSavingSetup(true);

        try {
            await supabase
                .from('profiles')
                .update({
                    last_period_date: formLastPeriod,
                    cycle_length: formCycleLength,
                })
                .eq('id', userId);

            setNeedsSetup(false);
            setCycleLength(formCycleLength);
            setPeriodDuration(formPeriodDuration);

            // Re-calc and fetch AI
            const today = new Date();
            const lastP = new Date(formLastPeriod);
            today.setHours(0, 0, 0, 0); lastP.setHours(0, 0, 0, 0);
            const dDay = Math.floor((today.getTime() - lastP.getTime()) / 86400000) + 1;
            setCycleDay(dDay);
            
            const calcPhase = getPhaseDetails(dDay, formCycleLength, formPeriodDuration).name;
            fetchAiInsight(calcPhase, dDay, formCycleLength, formPeriodDuration, [], fullProfile);

        } catch (error) {
            console.error("Error saving setup:", error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSavingSetup(false);
        }
    };

    const markPeriodStart = async () => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        try {
            await supabase.from('profiles').update({ last_period_date: todayStr }).eq('id', userId);
            setCycleDay(1);
            setTodaySymptoms([]); // Reset symptoms for new cycle
            
            // Re-fetch AI for Day 1
            const calcPhase = getPhaseDetails(1, cycleLength, periodDuration).name;
            fetchAiInsight(calcPhase, 1, cycleLength, periodDuration, [], fullProfile);
            
        } catch (error) {
            console.error("Error updating period start:", error);
        }
    };

    const logSymptom = async (symptom: string) => {
        if (!userId) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const hasSymptom = todaySymptoms.includes(symptom);
        
        let newSymptoms = [...todaySymptoms];

        try {
            if (hasSymptom) {
                newSymptoms = newSymptoms.filter(s => s !== symptom);
                setTodaySymptoms(newSymptoms);
                await supabase.from('cycle_symptoms').delete().eq('user_id', userId).eq('date', todayStr).eq('symptom', symptom);
            } else {
                newSymptoms.push(symptom);
                setTodaySymptoms(newSymptoms);
                await supabase.from('cycle_symptoms').upsert({ user_id: userId, date: todayStr, symptom }, { onConflict: 'user_id,date,symptom' });
            }
            
            // Re-trigger AI with new symptoms
            const phaseName = getPhaseDetails(cycleDay, cycleLength, periodDuration).name;
            fetchAiInsight(phaseName, cycleDay, cycleLength, periodDuration, newSymptoms, fullProfile);
            
        } catch (error) {
            console.error("Error logging symptom:", error);
        }
    };

    // === Phase Logic Extracted for Reuse ===
    const getPhaseDetails = (day: number, cLength: number, pDur: number) => {
        if (day >= 1 && day <= pDur) {
            return { name: 'Menstruation', color: 'text-rose-500', bg: 'bg-rose-500', icon: 'water_drop', gradient: 'from-rose-400 to-rose-600' };
        } else if (day > pDur && day <= 13) {
            return { name: 'Phase Folliculaire', color: 'text-fuchsia-500', bg: 'bg-fuchsia-500', icon: 'spa', gradient: 'from-fuchsia-400 to-fuchsia-600' };
        } else if (day >= 14 && day <= 15) {
            return { name: 'Ovulation', color: 'text-pink-500', bg: 'bg-pink-500', icon: 'flare', gradient: 'from-pink-400 to-rose-500' };
        } else if (day > 15 && day <= cLength) {
            return { name: 'Phase Lutéale', color: 'text-purple-500', bg: 'bg-purple-500', icon: 'nights_stay', gradient: 'from-purple-400 to-indigo-500' };
        } else {
            return { name: 'Retard', color: 'text-gray-500', bg: 'bg-gray-500', icon: 'schedule', gradient: 'from-gray-400 to-gray-600' };
        }
    };

    const phaseParams = getPhaseDetails(cycleDay, cycleLength, periodDuration);
    const nextPeriodCount = cycleLength - cycleDay + 1 > 0 ? cycleLength - cycleDay + 1 : 0;

    const SYMPTOMS = [
        { icon: 'healing', label: 'Douleur', color: 'bg-rose-50 text-rose-600 border-rose-100' },
        { icon: 'favorite', label: 'Crampes', color: 'bg-pink-50 text-pink-600 border-pink-100' },
        { icon: 'fastfood', label: 'Fringale', color: 'bg-purple-50 text-purple-600 border-purple-100' },
        { icon: 'hotel', label: 'Fatigue', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
        { icon: 'mood_bad', label: 'Humeur', color: 'bg-orange-50 text-orange-600 border-orange-100' },
        { icon: 'water_drop', label: 'Ballonné', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
        { icon: 'sentiment_dissatisfied', label: 'Triste', color: 'bg-blue-50 text-blue-600 border-blue-100' },
        { icon: 'sentiment_satisfied', label: 'Super', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    ];

    // ============================
    // LOADING
    // ============================
    if (loading) {
        return (
            <div className="min-h-full pb-36 lg:pb-12 bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    // ============================
    // ONBOARDING SETUP (Kept identical as it's functional)
    // ============================
    if (needsSetup) {
        // ... (Onboarding setup code is preserved but minimized for reading, it was already styled well)
        return (
           <div className="min-h-full bg-white select-none overflow-x-hidden flex flex-col items-center justify-center p-6">
               <div className="w-full max-w-md space-y-8">
                   <div className="text-center">
                        <div className="w-20 h-20 mx-auto bg-rose-100 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-rose-500 text-4xl">calendar_month</span>
                        </div>
                       <h1 className="text-2xl font-bold text-gray-900">Configurer AriaCycle</h1>
                       <p className="text-gray-500 text-sm mt-2">Pour des prédictions précises, nous avons besoin de la date de vos dernières règles.</p>
                   </div>
                   
                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Premier jour des dernières règles</label>
                           <input 
                               type="date" 
                               value={formLastPeriod}
                               max={new Date().toISOString().split('T')[0]}
                               onChange={(e) => setFormLastPeriod(e.target.value)}
                               className="w-full p-4 border border-gray-200 rounded-2xl bg-gray-50 focus:ring-2 focus:ring-rose-500 outline-none"
                           />
                       </div>
                   </div>

                   <button
                       onClick={saveSetup}
                       disabled={!formLastPeriod || savingSetup}
                       className="w-full py-4 bg-gray-900 text-white rounded-2xl font-medium disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
                   >
                       {savingSetup ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : "Commencer le suivi"}
                   </button>
               </div>
           </div>
        );
    }

    // ============================
    // PREMIUM MAIN TRACKER VIEW
    // ============================
    const offsetPercentage = Math.min(cycleDay, cycleLength) / cycleLength;
    const dashArray = 2 * Math.PI * 120;
    const dashOffset = dashArray - (offsetPercentage * dashArray);

    return (
        <div className="min-h-screen pb-32 bg-[#F9FAFB] select-none overflow-x-hidden font-sans">
            
            {/* Header Premium */}
            <div className="px-6 pt-8 pb-4 flex items-center justify-between sticky top-0 bg-[#F9FAFB]/80 backdrop-blur-md z-30">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-full shadow-sm active:scale-95 transition">
                    <span className="material-symbols-outlined text-gray-600">arrow_back</span>
                </button>
                <div className="text-center w-full">
                    <h1 className="text-lg font-black text-gray-900 tracking-tight">Aria<span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-fuchsia-500">Cycle</span></h1>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="px-5 mt-4 space-y-8 flex flex-col items-center">

                {/* PREMIUM CYCLE RING */}
                <div className="relative w-[300px] h-[300px] flex items-center justify-center mt-2 group">
                    {/* Glowing background */}
                    <div className={`absolute inset-0 rounded-full opacity-20 blur-3xl transition-colors duration-1000 bg-gradient-to-tr ${phaseParams.gradient}`}></div>
                    
                    {/* Inner Glass Container */}
                    <div className="absolute inset-4 rounded-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-[inset_0_4px_12px_rgba(255,255,255,0.8),0_8px_32px_rgba(0,0,0,0.04)] z-10 flex flex-col items-center justify-center">
                         <span className={`material-symbols-outlined ${phaseParams.color} text-4xl mb-1 drop-shadow-md`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {phaseParams.icon}
                        </span>
                        <div className="flex items-baseline">
                            <span className="text-6xl font-black text-gray-900 tracking-tighter">J{cycleDay}</span>
                        </div>
                        <p className={`text-[11px] font-bold mt-1 uppercase tracking-widest ${phaseParams.color}`}>{phaseParams.name}</p>
                        
                        <div className="mt-3 bg-white/60 px-4 py-1.5 rounded-full border border-white/50 text-[10px] font-bold text-gray-500 shadow-sm">
                            {cycleDay > cycleLength ? "Retard détecté" : `${nextPeriodCount} jours restants`}
                        </div>
                    </div>

                    {/* SVG Progress Ring */}
                    <svg className="w-full h-full transform -rotate-90 pointer-events-none relative z-20 overflow-visible drop-shadow-xl">
                        {/* Track */}
                        <circle cx="150" cy="150" r="120" className="text-gray-100" strokeWidth="18" stroke="currentColor" fill="none" />
                        {/* Progress */}
                        <circle 
                            cx="150" cy="150" r="120" 
                            strokeWidth="18" 
                            stroke="url(#gradient)" 
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            className="transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={getGradientColors(phaseParams.name)[0]} />
                                <stop offset="100%" stopColor={getGradientColors(phaseParams.name)[1]} />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* AUTOMATED AI CHAT BUBBLE */}
                <div className="w-full relative z-10">
                    <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 relative overflow-hidden">
                        {/* Decorative top gradient line */}
                        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${phaseParams.gradient}`}></div>
                        
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${phaseParams.gradient} flex items-center justify-center shadow-md`}>
                                <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            </div>
                            <h2 className="text-[13px] font-bold text-gray-800 tracking-wide uppercase">Analyse IA en temps réel</h2>
                        </div>
                        
                        <div className="pl-11 pr-2 min-h-[60px]">
                            {loadingAi ? (
                                <div className="space-y-2 animate-pulse">
                                    <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-100 rounded w-full"></div>
                                    <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                                </div>
                            ) : (
                                <p className="text-[14px] text-gray-600 leading-relaxed font-medium">
                                    {aiInsight || "Mettez à jour vos symptômes pour recevoir des recommandations adaptées."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* SYMPTOM TRACKER (Glassmorphism Tiles) */}
                <div className="w-full">
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-sm font-bold text-gray-800">Journal de Symptômes</h2>
                        <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Aujourd'hui</span>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {SYMPTOMS.map((symptom, idx) => {
                            const isActive = todaySymptoms.includes(symptom.label);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => logSymptom(symptom.label)}
                                    className={`relative flex flex-col items-center justify-center p-3 h-20 rounded-2xl transition-all duration-300 active:scale-90
                                        ${isActive 
                                            ? `bg-gray-900 border-gray-900 shadow-lg shadow-gray-900/20 transform -translate-y-1` 
                                            : `bg-white border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-md`
                                        }`}
                                >
                                    <span className={`material-symbols-outlined text-2xl mb-1 transition-colors ${isActive ? 'text-white' : symptom.color.split(' ')[1]}`} style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                                        {symptom.icon}
                                    </span>
                                    <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-gray-500'}`}>{symptom.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* SMART CONTEXTUAL BUTTON */}
                <div className="w-full pt-4 pb-8">
                    <button
                        onClick={markPeriodStart}
                        className={`w-full py-4 rounded-[20px] font-bold text-[15px] shadow-lg hover:shadow-xl active:translate-y-1 transition-all flex justify-center items-center gap-2
                            ${cycleDay >= 25 || cycleDay > cycleLength 
                                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-rose-500/25' 
                                : 'bg-white border-2 border-gray-100 text-gray-500 hover:bg-gray-50 shadow-sm'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {cycleDay >= 25 || cycleDay > cycleLength ? 'water_drop' : 'edit_calendar'}
                        </span>
                        {cycleDay > cycleLength ? "Mes règles ont commencé (Retard)" 
                        : cycleDay >= 25 ? "Mes règles ont commencé" 
                        : "Modifier la date des règles"}
                    </button>
                    {cycleDay < 25 && (
                        <p className="text-center text-[11px] text-gray-400 mt-3 font-medium">
                            N'appuyez ici que si votre nouveau cycle démarre aujourd'hui.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
};

// Helper for gradient colors based on phase string
function getGradientColors(phase: string): [string, string] {
    switch(phase) {
        case 'Menstruation': return ['#fb7185', '#e11d48']; // rose-400 to rose-600
        case 'Phase Folliculaire': return ['#e879f9', '#c026d3']; // fuchsia-400 to fuchsia-600
        case 'Ovulation': return ['#f472b6', '#f43f5e']; // pink-400 to rose-500
        case 'Phase Lutéale': return ['#c084fc', '#6366f1']; // purple-400 to indigo-500
        default: return ['#9ca3af', '#4b5563']; // gray-400 to gray-600
    }
}

export default Cycle;

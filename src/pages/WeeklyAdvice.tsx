import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { supabase } from '../lib/supabase';
import GlobeLabels from '../components/GlobeLabels';
import { ShinyButton } from '../components/ShinyButton';

const WeeklyAdvice: React.FC = () => {
    const navigate = useNavigate();
    const { userProfile, foodLogs } = useData();
    const [currentWeek, setCurrentWeek] = useState<number>(0);
    const [alreadyRead, setAlreadyRead] = useState<boolean>(false);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [advice, setAdvice] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile && userProfile.created_at) {
            const createdAt = new Date(userProfile.created_at).getTime();
            const now = Date.now();
            const weekDiff = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24 * 7));
            const activeWeek = weekDiff + 1; // Week 1, Week 2...
            setCurrentWeek(activeWeek);

            const lastRead = localStorage.getItem(`aria_advice_week_${userProfile.id}`);
            if (lastRead === String(activeWeek)) {
                setAlreadyRead(true);
            }
        }
    }, [userProfile]);

    // Save as read when leaving the page if it was generated
    useEffect(() => {
        return () => {
            if (advice && userProfile) {
                // If advice was generated and viewed, passing back unmounts, so we lock it for this week.
                localStorage.setItem(`aria_advice_week_${userProfile.id}`, String(currentWeek));
            }
        };
    }, [advice, currentWeek, userProfile]);

    const generateAdvice = async () => {
        setIsGenerating(true);
        try {
            // Compiler la semaine de l'utilisateur
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            const recentLogs = foodLogs.filter(log => new Date(log.created_at) >= oneWeekAgo);
            const avgCalories = recentLogs.length > 0 
                ? Math.round(recentLogs.reduce((acc, curr) => acc + curr.calories, 0) / 7) 
                : 0;

            const systemMsg = `Tu es Aria. Tu dois donner le "Conseil de la Semaine" à l'utilisateur. 
            Il est dans sa Semaine ${currentWeek} sur l'application. 
            Ces 7 derniers jours, il a enregistré ${recentLogs.length} repas (Moyenne: ${avgCalories} kcal/jour).
            Génère un message chaleureux, inspirant et général sur la nutrition de sa semaine.
            TRÈS IMPORTANT: Tu dois absolument faire un lien avec LE NOMBRE DE PAS et L'ACTIVITÉ SPORTIVE (même si tu n'as pas le chiffre exact, encourage la marche ou félicite-le s'il est actif par rapport à sa nutrition). 
            Le conseil doit être formaté de manière magnifique avec des émojis et des paragraphes courts.`;

            const { error } = await supabase.functions.invoke('chat-assistant', {
                body: { 
                    message: "Donne-moi mon conseil de la semaine !",
                    logs: [], // On a déjà tout mis dans le prompt système simulé
                    profile: { name: userProfile?.full_name, goal: userProfile?.goal_type } 
                }
            });

            if (error) throw error;
            
            // L'API nous renvoie une réponse générique si on utilise chat-assistant, mais on veut injecter notre prompt.
            // Vu que chat-assistant est déjà fait pour le chat, on va passer notre consigne stricte dans le "message" pour tromper l'assistant
            const customMessage = `Tâche stricte : ${systemMsg}. Rédige uniquement le conseil, n'ajoute rien d'autre.`;
            
            const response = await supabase.functions.invoke('chat-assistant', {
                body: { 
                    message: customMessage,
                    profile: { name: userProfile?.full_name, goal: userProfile?.goal_type } 
                }
            });

            if (response.data && response.data.reply) {
                setAdvice(response.data.reply);
            } else {
                throw new Error("Pas de réponse.");
            }

        } catch (error) {
            console.error("Erreur génération:", error);
            setAdvice("Aria n'a pas pu analyser ta semaine pour le moment. Essaie de marcher 10 000 pas aujourd'hui et de boire beaucoup d'eau ! 💧");
        } finally {
            setIsGenerating(false);
            // On marque comme "lu" immédiatement dans le state au cas où (l'effet cleanup le sauvera dans le localStorage)
            setAlreadyRead(true);
        }
    };

    return (
        <div className="min-h-full pb-36 lg:pb-12 bg-slate-50 text-slate-800 flex flex-col items-center select-none overflow-x-hidden relative">
            
            <button onClick={() => navigate(-1)} className="absolute top-6 left-6 z-50 w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition active:scale-90">
                <span className="material-symbols-outlined text-slate-800">close</span>
            </button>

            <div className="w-full max-w-lg mt-20 px-6 flex flex-col items-center">
                <div className="text-center mb-6">
                    <p className="text-emerald-500 font-bold uppercase tracking-[0.3em] text-xs mb-2">Bilan Hebdomadaire</p>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900">Semaine {currentWeek}</h1>
                </div>

                {!advice && (
                    <div className="w-[120%] max-w-[800px] aspect-square relative my-8 -mx-10 opacity-95 transition-all duration-1000 scale-110">
                        <GlobeLabels />
                    </div>
                )}

                {/* Si on a cliqué et qu'on a le conseil */}
                {advice && (
                    <div className="bg-white border border-gray-100 rounded-[32px] p-8 w-full shadow-[0_20px_60px_rgba(0,0,0,0.05)] mb-10 max-h-[60vh] overflow-y-auto custom-scrollbar">
                        <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-[20px] flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/30">
                            <span className="material-symbols-outlined text-white text-3xl">psychology</span>
                        </div>
                        <h2 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">L'analyse d'Aria</h2>
                        <div className="text-slate-600 text-[16px] leading-relaxed font-medium space-y-4 whitespace-pre-line">
                            {advice}
                        </div>
                    </div>
                )}

                {/* État : Conseil pas encore généré cette semaine */}
                {!alreadyRead && !advice && !isGenerating && (
                    <div className="mt-4 text-center animate-[slideUp_0.5s_ease-out] w-full">
                        <p className="text-slate-500 text-[15px] font-medium mb-8 max-w-[280px] mx-auto">
                            Votre semaine est terminée. Découvrons ensemble vos progrès et vos habitudes.
                        </p>
                        <ShinyButton 
                            onClick={generateAdvice}
                        >
                            Découvrir mon conseil
                        </ShinyButton>
                    </div>
                )}

                {/* État : En cours de génération */}
                {isGenerating && (
                    <div className="mt-8 text-center w-full">
                        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-emerald-600 font-bold animate-pulse">Aria connecte vos données...</p>
                    </div>
                )}

                {/* État : Déjà lu (et on revient sur la page plus tard) */}
                {alreadyRead && !advice && !isGenerating && (
                    <div className="mt-6 text-center">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                            <span className="material-symbols-outlined text-emerald-500 text-4xl mb-3">check_circle</span>
                            <p className="text-slate-800 font-black text-lg">Conseil de la semaine lu !</p>
                            <p className="text-slate-500 text-sm mt-2 font-medium">La Terre continue de tourner... Revenez la semaine prochaine pour une nouvelle analyse.</p>
                        </div>
                    </div>
                )}

            </div>
            
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}} />
        </div>
    );
};

export default WeeklyAdvice;

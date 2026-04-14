/**
 * AnalysisResult.tsx — Clean Professional V3
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { MOCK_ANALYSIS_V2 } from '../data/mockData';
import { useData } from '../context/DataContext';

const AnalysisResult: React.FC = () => {
    const { refreshData } = useData();
    const [userId, setUserId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUserId(session?.user?.id || null);
        });
    }, []);

    const location = useLocation();
    const navigate = useNavigate();
    const data = location.state?.result || MOCK_ANALYSIS_V2;

    const score = Number(data.health_score) || 0;
    const scoreLabel = score >= 8 ? 'Excellent' : score >= 6 ? 'Bon' : score >= 4 ? 'Moyen' : 'Faible';
    const scoreColor = score >= 8 ? 'text-emerald-500' : score >= 6 ? 'text-blue-500' : score >= 4 ? 'text-amber-500' : 'text-red-500';
    const scoreBg = score >= 8 ? 'bg-emerald-50 border-emerald-100' : score >= 6 ? 'bg-blue-50 border-blue-100' : score >= 4 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100';

    const saveAndExit = async () => {
        if (!userId || saving) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('food_logs').insert({
                user_id: userId,
                food_name: data.food_name || "Plat Inconnu",
                calories: Math.round(Number(data.calories)) || 0,
                protein_g: Number(data.protein_g) || 0,
                carbs_g: Number(data.carbs_g) || 0,
                fat_g: Number(data.fat_g) || 0,
                health_tips: data.health_tips || "",
                health_score: data.health_score || 0,
                fiber_g: data.fiber_g || 0,
                sugar_g: data.sugar_g || 0,
                image_url: data.image_url,
            });
            if (error) throw error;
            await refreshData();
            navigate('/history');
        } catch {
            alert('Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const macros = [
        { label: 'Calories', value: Math.round(Number(data.calories)) || 0, unit: 'kcal', icon: 'local_fire_department', color: '#f59e0b', bg: '#fef3c7' },
        { label: 'Protéines', value: Number(data.protein_g) || 0, unit: 'g', icon: 'fitness_center', color: '#ef4444', bg: '#fee2e2' },
        { label: 'Glucides', value: Number(data.carbs_g) || 0, unit: 'g', icon: 'grain', color: '#3b82f6', bg: '#dbeafe' },
        { label: 'Lipides', value: Number(data.fat_g) || 0, unit: 'g', icon: 'water_drop', color: '#8b5cf6', bg: '#ede9fe' },
    ];

    return (
        <div className="min-h-full pb-36 lg:pb-12 bg-gray-50 select-none">
            {/* Image Header */}
            {data.image_url && (
                <div className="relative w-full h-64 sm:h-80 lg:h-96 overflow-hidden">
                    <img src={data.image_url} alt={data.food_name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-transparent to-transparent"></div>
                    <button onClick={() => navigate(-1)}
                        className="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm flex items-center justify-center rounded-xl shadow-sm z-10 hover:bg-white transition">
                        <span className="material-symbols-outlined text-gray-700 text-xl">arrow_back</span>
                    </button>
                </div>
            )}

            {/* No image fallback header */}
            {!data.image_url && (
                <div className="px-4 sm:px-6 lg:px-8 pt-6 flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm">
                        <span className="material-symbols-outlined text-gray-700 text-xl">arrow_back</span>
                    </button>
                    <h1 className="text-lg font-bold text-gray-900">Résultat d'analyse</h1>
                </div>
            )}

            <div className="px-4 sm:px-6 lg:px-8 -mt-6 relative z-10 space-y-5 max-w-2xl mx-auto">
                {/* Food Name + Score Card */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <p className="text-xs text-gray-400 font-medium mb-1">Aliment identifié</p>
                            <h1 className="text-2xl font-extrabold text-gray-900 leading-tight">{data.food_name}</h1>
                        </div>
                        <div className={`flex-shrink-0 px-4 py-2 rounded-xl border ${scoreBg} flex flex-col items-center`}>
                            <p className={`text-2xl font-extrabold ${scoreColor}`}>{score}</p>
                            <p className="text-[10px] font-semibold text-gray-400">/10</p>
                        </div>
                    </div>

                    {/* Score Bar */}
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1.5">
                            <p className="text-xs text-gray-400 font-medium">Score de santé</p>
                            <span className={`text-xs font-semibold ${scoreColor}`}>{scoreLabel}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-1000"
                                style={{ width: `${score * 10}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Macronutrients Grid */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 mb-3">Macronutriments</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {macros.map((m) => (
                            <div key={m.label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                                    style={{ backgroundColor: m.bg }}>
                                    <span className="material-symbols-outlined text-xl" style={{ color: m.color }}>{m.icon}</span>
                                </div>
                                <p className="text-xl font-extrabold text-gray-900">{m.value}<span className="text-xs font-medium text-gray-400 ml-0.5">{m.unit}</span></p>
                                <p className="text-[11px] font-medium text-gray-400 mt-0.5">{m.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Tips */}
                {data.health_tips && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-emerald-500 text-lg">auto_awesome</span>
                            <h2 className="text-sm font-semibold text-gray-700">Conseils de l'IA</h2>
                        </div>
                        <p className="text-sm leading-relaxed text-gray-600 pl-4 border-l-2 border-emerald-200">
                            {data.health_tips}
                        </p>
                    </div>
                )}

                {/* Detailed Nutrition (if available) */}
                {(data.fiber_g || data.sugar_g) && (
                    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                        <h2 className="text-sm font-semibold text-gray-500 mb-3">Détails nutritionnels</h2>
                        <div className="space-y-3">
                            {data.fiber_g > 0 && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-green-500 text-base">eco</span>
                                        <span className="text-sm text-gray-600">Fibres</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{data.fiber_g} g</span>
                                </div>
                            )}
                            {data.sugar_g > 0 && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-pink-500 text-base">cake</span>
                                        <span className="text-sm text-gray-600">Sucres</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{data.sugar_g} g</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <button onClick={saveAndExit} disabled={saving}
                        className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50">
                        <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">save</span>
                            {saving ? 'Enregistrement...' : 'Enregistrer dans le journal'}
                        </span>
                    </button>
                    <button onClick={() => navigate('/scan')}
                        className="w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-[0.98] transition-all">
                        <span className="flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-lg">photo_camera</span>
                            Scanner un autre plat
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResult;

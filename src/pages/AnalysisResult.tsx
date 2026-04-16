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
    
    // Evaluate health label like the English mockup ("Moderate", etc.)
    const getScoreDetails = (s: number) => {
        if (s >= 8) return { label: 'Excellent', color: '#84cc16', ringStart: '#84cc16', ringEnd: '#10b981', gradientId: 'gradient-green' }; // lime-500
        if (s >= 6) return { label: 'Moderate', color: '#84cc16', ringStart: '#6366f1', ringEnd: '#f59e0b', gradientId: 'gradient-orange' }; // Using the mock's mixed gradient style for 19 glycemic
        return { label: 'Poor', color: '#ef4444', ringStart: '#ef4444', ringEnd: '#f43f5e', gradientId: 'gradient-red' }; // red-500
    };
    const scoreUI = getScoreDetails(score);

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

    const MacroPill = ({ label, value, unit, colorIcon, colorBg }: { label: string; value: number; unit: string; colorIcon: string; colorBg: string }) => (
        <div className={`flex flex-col items-center justify-center rounded-[2rem] w-16 py-3 px-1 border border-white/50 text-white`} style={{ backgroundColor: colorBg, boxShadow: `0 8px 16px ${colorBg}40` }}>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm mb-1">
                 {label === 'Carbs' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>spa</span>}
                 {label === 'Protein' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>local_drink</span>}
                 {label === 'Fat' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>water_drop</span>}
                 {label === 'Fiber' && <span className="material-symbols-outlined text-[18px]" style={{ color: colorIcon }}>eco</span>}
            </div>
            <span className="text-[11px] font-bold opacity-90">{label}</span>
            <span className="text-[13px] font-black">{value} {unit}</span>
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

    // Decorative ring code updated to match the mockup
    const radius = 65;
    const circ = 2 * Math.PI * radius;
    const pct = (score / 10) * 100;
    const offset = circ - (pct / 100) * circ;

    return (
        <div className="min-h-full pb-8 bg-gray-50 select-none font-sans relative">
            {/* Hero Section */}
            <div className="relative h-[28rem] w-full">
                {data.image_url ? (
                    <img src={data.image_url} alt={data.food_name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-200 flex items-center justify-center text-5xl">🥗</div>
                )}
                
                {/* Navbar over image */}
                <div className="absolute top-0 left-0 w-full pt-12 pb-6 px-6 flex items-center justify-between text-white backdrop-blur-[2px] bg-gradient-to-b from-black/40 to-transparent">
                    <button onClick={() => navigate(-1)} className="flex items-center text-white outline-none active:opacity-70">
                        <span className="material-symbols-outlined text-[26px]">chevron_left</span>
                        <span className="text-[17px] font-bold ml-1 tracking-tight">Meal Result</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <button className="outline-none active:opacity-70">
                            <span className="material-symbols-outlined text-[22px]">post_add</span>
                        </button>
                        <button onClick={() => navigate('/history')} className="outline-none active:opacity-70">
                            <span className="material-symbols-outlined text-[22px]">history</span>
                        </button>
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
                            {Math.round(Number(data.calories)) || 0} <span className="text-[16px]">kcal</span>
                        </p>
                    </div>
                </div>

                {/* Body Content */}
                <div className="max-w-md mx-auto space-y-6">
                    
                    {/* Nutritional Value Title */}
                    <div className="mt-4">
                        <h3 className="text-[15px] font-bold text-gray-500 tracking-wide mb-3">Nutritional Value</h3>
                        <div className="flex justify-between items-center px-1">
                            <MacroPill label="Carbs" value={Number(data.carbs_g) || 0} unit="g" colorBg="#f97316" colorIcon="#f97316" />
                            <MacroPill label="Protein" value={Number(data.protein_g) || 0} unit="g" colorBg="#14b8a6" colorIcon="#14b8a6" />
                            <MacroPill label="Fat" value={Number(data.fat_g) || 0} unit="g" colorBg="#eab308" colorIcon="#eab308" />
                            <MacroPill label="Fiber" value={Number(data.fiber_g) || 0} unit="g" colorBg="#22c55e" colorIcon="#22c55e" />
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
                            <AITag type="blue" icon="verified" text="Allergen Free" />
                        </div>

                        <p className="text-[13px] text-gray-600 leading-relaxed font-medium mb-5">
                            {data.health_tips ? data.health_tips : (
                                <>
                                    This breakfast wrap, likely is filled with eggs, greens, cheese, and some bacon. It fits best under an <span className="font-bold text-lime-600">"eat in moderation"</span> category due to its refined tortilla and higher fat content.
                                </>
                            )}
                        </p>

                        <h4 className="text-[16px] font-black text-gray-800 mb-4 tracking-tight">
                            {data.recipes && data.recipes.length > 0 ? "Recettes Suggérées" : "Alternatives Saines"}
                        </h4>
                        <div className="flex items-start gap-4 overflow-x-auto pb-6 -mx-1 px-1 custom-scrollbar snap-x">
                            {data.recipes && data.recipes.length > 0 ? (
                                data.recipes.map((recipe: any, i: number) => (
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

                    {/* Save Button */}
                    <button onClick={saveAndExit} disabled={saving} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full py-4 text-[16px] font-bold shadow-lg mt-4 disabled:opacity-50">
                        {saving ? 'Saving...' : 'Save to Food Log'}
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default AnalysisResult;


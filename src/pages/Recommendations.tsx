import React, { useEffect, useState } from 'react';
import { useData } from '../context/DataContext';

const AI_TIPS = [
    { icon: '🥦', title: 'Plus de Fibres', desc: 'Augmentez votre consommation de légumes verts pour améliorer la digestion.' },
    { icon: '💧', title: 'Hydratation', desc: 'Buvez au moins 2L d\'eau par jour pour optimiser votre métabolisme.' },
    { icon: '🥩', title: 'Protéines Maigres', desc: 'Privilégiez le poulet, le poisson et les légumineuses pour vos apports protéiques.' },
    { icon: '🫐', title: 'Antioxydants', desc: 'Les baies et les fruits colorés renforcent votre système immunitaire.' },
];

const RECOMMENDED_PRODUCTS = [
    { name: 'Salade Quinoa', score: 9.2, cal: 320, img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300' },
    { name: 'Bowl Açaí', score: 8.8, cal: 280, img: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=300' },
    { name: 'Saumon Grillé', score: 9.5, cal: 450, img: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300' },
    { name: 'Smoothie Vert', score: 8.5, cal: 180, img: 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=300' },
];

const Recommendations: React.FC = () => {
    const { foodLogs, loading } = useData();
    const [weekData, setWeekData] = useState<{ day: string; cal: number; protein: number }[]>([]);

    useEffect(() => {
        if (foodLogs) {
            const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
            const now = new Date();
            const results: { day: string; cal: number; protein: number }[] = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const nextD = new Date(d);
                nextD.setDate(nextD.getDate() + 1);

                const dayLogs = foodLogs.filter((log: any) => {
                    const logDate = new Date(log.created_at);
                    return logDate >= d && logDate < nextD;
                });

                const cal = dayLogs.reduce((s, l) => s + (l.calories || 0), 0) || 0;
                const protein = dayLogs.reduce((s, l) => s + (l.protein_g || 0), 0) || 0;
                results.push({ day: days[d.getDay() === 0 ? 6 : d.getDay() - 1], cal, protein });
            }
            setWeekData(results);
        }
    }, [foodLogs]);


    const maxCal = Math.max(...weekData.map(d => d.cal), 1);
    const maxProtein = Math.max(...weekData.map(d => d.protein), 1);

    // Macro ring data (mock averages)
    const macros = [
        { label: 'Protéines', pct: 65, color: '#13ec5b' },
        { label: 'Glucides', pct: 45, color: '#12edff' },
        { label: 'Lipides', pct: 30, color: '#a3ff12' },
        { label: 'Fibres', pct: 55, color: '#ffcc00' },
    ];

    return (
        <div className="min-h-full pb-36 px-5 pt-6 space-y-8 select-none relative overflow-x-hidden">
            {/* Header */}
            <header>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600 animate-flicker">Intelligence Nutritionnelle</p>
                <h1 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">Conseils & Recommandations</h1>
            </header>

            {/* Daily AI Tips */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Conseils IA du Jour</h2>
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                </div>
                <div className="space-y-3">
                    {AI_TIPS.map((tip, i) => (
                        <div key={i} className="glass-card p-4 flex items-start gap-4 border-gray-200 group hover:border-primary/20 transition-all"
                            style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                                {tip.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight mb-1">{tip.title}</p>
                                <p className="text-[11px] text-gray-500 leading-relaxed">{tip.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Weekly Calorie Graph */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Calories Hebdomadaires</h2>
                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">7 Jours</span>
                </div>
                <div className="glass-card p-6 border-gray-200 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent pointer-events-none"></div>
                    {loading ? (
                        <div className="h-40 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-primary animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-end h-40 gap-2 relative z-10">
                            {weekData.map((d, i) => {
                                const h = maxCal > 0 ? (d.cal / maxCal) * 100 : 5;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                        <span className="text-[8px] font-black text-emerald-600">{d.cal > 0 ? d.cal : ''}</span>
                                        <div
                                            className="w-full rounded-xl bg-primary/20 relative overflow-hidden transition-all duration-700"
                                            style={{ height: `${Math.max(h, 5)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/30"></div>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-gray-500">{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Protein Graph */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Protéines Hebdomadaires</h2>
                </div>
                <div className="glass-card p-6 border-gray-200 relative">
                    {loading ? (
                        <div className="h-32 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-accent-blue animate-spin"></div>
                        </div>
                    ) : (
                        <div className="flex justify-between items-end h-32 gap-2">
                            {weekData.map((d, i) => {
                                const h = maxProtein > 0 ? (d.protein / maxProtein) * 100 : 5;
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                                        <span className="text-[8px] font-black text-accent-blue/60">{d.protein > 0 ? `${d.protein}g` : ''}</span>
                                        <div
                                            className="w-full rounded-xl bg-accent-blue/20 relative overflow-hidden transition-all duration-700"
                                            style={{ height: `${Math.max(h, 5)}%` }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-t from-accent-blue/60 to-accent-blue/20"></div>
                                        </div>
                                        <span className="text-[8px] font-black uppercase text-gray-500">{d.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Macro Rings */}
            <section>
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic mb-4">Équilibre Nutritionnel</h2>
                <div className="grid grid-cols-4 gap-3">
                    {macros.map((m) => {
                        const radius = 28;
                        const circ = 2 * Math.PI * radius;
                        const offset = circ - (m.pct / 100) * circ;
                        return (
                            <div key={m.label} className="glass-card p-3 flex flex-col items-center border-gray-200">
                                <svg width="64" height="64" className="mb-2">
                                    <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                                    <circle cx="32" cy="32" r={radius} fill="none"
                                        stroke={m.color} strokeWidth="5"
                                        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
                                        transform="rotate(-90 32 32)"
                                        style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                                    />
                                    <text x="32" y="36" textAnchor="middle" className="text-[11px] font-black fill-white">{m.pct}%</text>
                                </svg>
                                <span className="text-[8px] font-black uppercase tracking-wider text-gray-500">{m.label}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Recommended Products */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 italic">Produits Recommandés</h2>
                    <span className="text-[9px] font-black text-primary uppercase">IA</span>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
                    {RECOMMENDED_PRODUCTS.map((prod, i) => (
                        <div key={i} className="flex-shrink-0 w-44 glass-card overflow-hidden border-gray-200 group active:scale-95 transition-all">
                            <div className="h-28 relative overflow-hidden">
                                <img src={prod.img} alt={prod.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent"></div>
                                <div className="absolute top-2 right-2 bg-primary/90 text-bg-deep text-[9px] font-black px-2 py-0.5 rounded-lg">
                                    {prod.score}
                                </div>
                            </div>
                            <div className="p-3">
                                <p className="text-xs font-black text-gray-900 uppercase tracking-tight truncate">{prod.name}</p>
                                <p className="text-[9px] font-bold text-emerald-600 mt-1">{prod.cal} KCAL</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Recommendations;

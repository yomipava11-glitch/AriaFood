/**
 * mockData.ts — Premium Seed Data for AriaFood V2
 */

export interface FoodLog {
    id: string;
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    fiber_g: number;
    sugar_g: number;
    health_score: number; // 0-10
    health_tips: string;
    image_url: string;
    created_at: string;
}

export const MOCK_USER = {
    name: 'Alex Rivera',
    avatar: 'https://i.pravatar.cc/150?u=ariafood_v2',
    level: 'Pro',
};

export const TRENDS = [
    { day: 'Mon', kcal: 1850 },
    { day: 'Tue', kcal: 2100 },
    { day: 'Wed', kcal: 1920 },
    { day: 'Thu', kcal: 2200 },
    { day: 'Fri', kcal: 1800 },
    { day: 'Sat', kcal: 2400 },
    { day: 'Sun', kcal: 2000 },
];

export const ACTIVITY_LEVELS = [
    { value: 'sedentary', label: 'Sédentaire', subtitle: 'Peu ou pas d\'exercice' },
    { value: 'moderate', label: 'Modéré', subtitle: 'Exercice 3-5 jours/semaine' },
    { value: 'active', label: 'Actif', subtitle: 'Exercice quotidien ou sport intense' },
];

export const GOALS_LIST = [
    { value: 'lose', label: 'Perte de Poids' },
    { value: 'maintain', label: 'Maintien' },
    { value: 'gain', label: 'Prise de Muscle' },
];

export const PREMIUM_CATEGORIES = [
    { label: 'Détox', emoji: '🌿', color: '#13ec5b', glow: 'rgba(19, 236, 91, 0.4)' },
    { label: 'Énergie', emoji: '⚡', color: '#ffcc00', glow: 'rgba(255, 204, 0, 0.4)' },
    { label: 'Muscle', emoji: '💪', color: '#ff3b3b', glow: 'rgba(255, 59, 59, 0.4)' },
    { label: 'Kéto', emoji: '🥑', color: '#a3ff12', glow: 'rgba(163, 255, 18, 0.4)' },
    { label: 'Hydrate', emoji: '💧', color: '#12edff', glow: 'rgba(18, 237, 255, 0.4)' },
];

export const PREMIUM_MEALS: FoodLog[] = [
    {
        id: 'm1', food_name: 'Saumon Grillé & Quinoa',
        calories: 520, protein_g: 42, carbs_g: 15, fat_g: 28, fiber_g: 8, sugar_g: 2,
        health_score: 9.4, health_tips: "Riche en oméga-3 et céréales complexes. Parfait pour la récupération musculaire.",
        image_url: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=600",
        created_at: new Date().toISOString()
    },
    {
        id: 'm2', food_name: 'Toast Énergétique à l\'Avocat',
        calories: 340, protein_g: 12, carbs_g: 28, fat_g: 22, fiber_g: 12, sugar_g: 4,
        health_score: 8.5, health_tips: "Riche en graisses saines et en fibres. Soutient la santé cardiaque et la satiété.",
        image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=600",
        created_at: new Date().toISOString()
    },
    {
        id: 'm3', food_name: 'Bowl Poke Méditerranéen',
        calories: 420, protein_g: 22, carbs_g: 55, fat_g: 14, fiber_g: 9, sugar_g: 6,
        health_score: 9.1, health_tips: "Un arc-en-ciel de nutriments. Excellent équilibre de macros et de vitamines.",
        image_url: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600",
        created_at: new Date().toISOString()
    }
];

export const MOCK_ANALYSIS_V2 = PREMIUM_MEALS[0];

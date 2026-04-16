/**
 * Settings.tsx — Clean Professional V3
 */
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { ACTIVITY_LEVELS, GOALS_LIST } from '../data/mockData';
import { useData } from '../context/DataContext';

const Settings: React.FC = () => {
    const { userProfile, updateProfile } = useData();
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState<string>('');

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setUserId(session.user.id);
                setEmail(session.user.email || '');
            }
        });
    }, []);
    const [dailyCalories, setDailyCalories] = useState(2200);
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState<'male' | 'female'>('male');
    const [activity, setActivity] = useState('moderate');
    const [goalType, setGoalType] = useState('maintain');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState('https://i.pravatar.cc/150?u=ariafood_v2');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (userProfile) {
            setDailyCalories(userProfile.daily_calorie_goal || 2200);
            setWeight(userProfile.weight?.toString() || '');
            setAge(userProfile.age?.toString() || '');
            setGender(userProfile.gender || 'male');
            setActivity(userProfile.activity_level || 'moderate');
            setGoalType(userProfile.goal_type || 'maintain');
            if (userProfile.avatar_url) {
                setAvatarUrl(userProfile.avatar_url);
            }
        }
    }, [userProfile]);

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !userId) return;

        setUploadingAvatar(true);
        try {
            const filePath = `${userId}/avatar.${file.name.split('.').pop()}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (!uploadError) {
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                const publicUrl = urlData.publicUrl + '?t=' + Date.now();
                setAvatarUrl(publicUrl);
                localStorage.setItem(`ariafood_avatar_${userId}`, publicUrl);
                await updateProfile({ avatar_url: publicUrl });
            }
        } catch (err) {
            console.warn('[AriaFood] Avatar upload error:', err);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            await updateProfile({
                daily_calorie_goal: dailyCalories,
                weight: parseFloat(weight) || null,
                age: parseInt(age) || null,
                gender,
                activity_level: activity,
                goal_type: goalType,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } finally { setSaving(false); }
    };

    const inputClass = "w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none transition-all";

    return (
        <div className="min-h-full pb-40 lg:pb-12 px-4 sm:px-6 lg:px-8 pt-6 space-y-6 select-none">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-400 font-medium">Paramètres</p>
                    <h1 className="text-xl font-bold text-gray-900">Mon profil</h1>
                </div>
                <button onClick={() => supabase.auth.signOut()}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl text-red-400 hover:bg-red-50 transition shadow-sm">
                    <span className="material-symbols-outlined text-xl">logout</span>
                </button>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-5">
                <div className="relative flex-shrink-0">
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="relative group active:scale-95 transition-transform">
                        <img src={avatarUrl} alt="avatar" className="w-18 h-18 rounded-2xl border-2 border-emerald-200 object-cover" />
                        <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                        </div>
                        {uploadingAvatar && (
                            <div className="absolute inset-0 rounded-2xl bg-white/70 flex items-center justify-center">
                                <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-emerald-500 animate-spin"></div>
                            </div>
                        )}
                    </button>
                </div>
                <div className="flex-1 min-w-0">
                    <input 
                        type="text" 
                        value={userProfile?.full_name || ''} 
                        onChange={(e) => updateProfile({ full_name: e.target.value })}
                        placeholder="Votre nom"
                        className="text-lg font-bold text-gray-900 truncate bg-transparent border-none outline-none w-full p-0 focus:ring-0 placeholder-gray-300"
                    />
                    <p className="text-xs text-gray-400 truncate">{email}</p>
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-[10px] font-semibold text-emerald-600">Membre Pro</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
                {/* Calorie Goal */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 mb-4">Objectif calorique</h2>
                    <div className="flex justify-between items-baseline mb-4">
                        <p className="text-4xl font-extrabold text-gray-900">{dailyCalories}</p>
                        <p className="text-xs text-gray-400 font-medium">kcal / jour</p>
                    </div>
                    <input type="range" min={1200} max={4000} step={50} value={dailyCalories}
                        onChange={e => setDailyCalories(Number(e.target.value))}
                        className="w-full h-2 rounded-full bg-gray-100 accent-emerald-500 appearance-none cursor-pointer" />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-400 font-medium">
                        <span>1200</span>
                        <span className="text-emerald-500">Zone optimale</span>
                        <span>4000</span>
                    </div>
                </div>

                {/* Body Info */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h2 className="text-sm font-semibold text-gray-500 mb-4">Informations corporelles</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400">Poids (kg)</label>
                            <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                                placeholder="70" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400">Âge</label>
                            <input type="number" value={age} onChange={e => setAge(e.target.value)}
                                placeholder="25" className={inputClass} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Goal Selection */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 mb-4">Votre objectif</h2>
                <div className="grid grid-cols-3 gap-2">
                    {GOALS_LIST.map((gl) => (
                        <button key={gl.value} onClick={() => setGoalType(gl.value)}
                            className={`py-3 rounded-xl text-sm font-semibold transition-all ${goalType === gl.value
                                ? 'bg-emerald-500 text-white shadow-md'
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-100'
                            }`}>
                            {gl.label === 'Maintain' ? 'Maintenir' : gl.label === 'Weight Loss' ? 'Perdre' : 'Gagner'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Activity */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-500 mb-4">Niveau d'activité</h2>
                <div className="space-y-2">
                    {ACTIVITY_LEVELS.map((act) => (
                        <button key={act.value} onClick={() => setActivity(act.value)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all active:scale-[0.98] border ${activity === act.value
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-gray-100 hover:bg-gray-50'
                            }`}>
                            <div className="text-left">
                                <p className={`text-sm font-semibold ${activity === act.value ? 'text-emerald-700' : 'text-gray-700'}`}>{
                                    act.label === 'Sedentary' ? 'Sédentaire' :
                                        act.label === 'Moderate' ? 'Modéré' : 'Athlétique'
                                }</p>
                                <p className="text-xs text-gray-400 mt-0.5">{
                                    act.subtitle === 'Little to no exercise' ? 'Peu ou pas d\'exercice' :
                                        act.subtitle === '3-4 workouts per week' ? '3-4 entraînements par semaine' : '5+ sessions intenses'
                                }</p>
                            </div>
                            {activity === act.value && <span className="material-symbols-outlined text-emerald-500 text-xl">check_circle</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Save CTA */}
            <button onClick={saveProfile} disabled={saving}
                className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] shadow-md ${saved
                    ? 'bg-green-400 text-white'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600'
                }`}>
                {saving ? 'Enregistrement...' : saved ? '✓ Sauvegardé !' : 'Enregistrer les modifications'}
            </button>
        </div>
    );
};

export default Settings;

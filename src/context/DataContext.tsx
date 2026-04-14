import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { cacheGet, cacheSet } from '../lib/offlineCache';
import type { FoodLog } from '../data/mockData';

interface DataContextType {
    foodLogs: FoodLog[];
    userProfile: any;
    waterIntake: number; // in ml
    loading: boolean;
    refreshData: () => Promise<void>;
    updateProfile: (updates: any) => Promise<void>;
    addWater: (ml: number) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode; session: any }> = ({ children, session }) => {
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [waterIntake, setWaterIntake] = useState(0);
    const [loading, setLoading] = useState(true);

    const userId = session?.user?.id;

    const fetchData = useCallback(async () => {
        if (!userId) return;

        try {
            const today = new Date(); 
            today.setHours(0, 0, 0, 0);

            // PARALLELIZE FETCH: Fetch Profile, Logs & Water simultaneously
            const [profileRes, logsRes, waterRes] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('food_logs').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
                supabase.from('water_logs').select('amount_ml').eq('user_id', userId).gte('created_at', today.toISOString())
            ]);

            if (profileRes.data) {
                setUserProfile(profileRes.data);
                cacheSet(`profile_${userId}`, profileRes.data);
                if (profileRes.data.avatar_url) {
                    localStorage.setItem(`ariafood_avatar_${userId}`, profileRes.data.avatar_url);
                }
            }

            if (logsRes.data) {
                setFoodLogs(logsRes.data);
                cacheSet(`meals_${userId}`, logsRes.data);
            }

            if (waterRes.data) {
                const totalWater = waterRes.data.reduce((sum, log) => sum + log.amount_ml, 0);
                setWaterIntake(totalWater);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        if (userId) {
            // Try loading from cache first for instant UI
            const cachedProfile = cacheGet(`profile_${userId}`);
            const cachedLogs = cacheGet<FoodLog[]>(`meals_${userId}`);

            let hasCache = false;

            if (cachedProfile) {
                setUserProfile(cachedProfile);
                hasCache = true;
            }
            if (cachedLogs) {
                setFoodLogs(cachedLogs);
                hasCache = true;
            }
            
            // If cache exists, stop the loading skeleton immediately so it doesn't blink
            if (hasCache) {
                setLoading(false);
            }

            fetchData(); // Silently update in background
        } else {
            setFoodLogs([]);
            setUserProfile(null);
            setLoading(false);
        }
    }, [userId, fetchData]);

    const updateProfile = async (updates: any) => {
        if (!userId) return;
        const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates, updated_at: new Date().toISOString() });
        if (!error) {
            await fetchData();
        }
    };

    const addWater = async (ml: number) => {
        if (!userId) return;
        const { error } = await supabase.from('water_logs').insert({ user_id: userId, amount_ml: ml });
        if (!error) {
            setWaterIntake(prev => prev + ml);
        }
    };

    return (
        <DataContext.Provider value={{ foodLogs, userProfile, waterIntake, loading, refreshData: fetchData, updateProfile, addWater }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};

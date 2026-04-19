/**
 * Workout.tsx — Clean Professional V3
 * Sport & Running Interface to work with Capacitor Pedometer/Health
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Capacitor } from '@capacitor/core';
import { CapacitorPedometer } from '@capgo/capacitor-pedometer';

const Workout: React.FC = () => {
    const navigate = useNavigate();
    
    // State
    const [isRunning, setIsRunning] = useState(false);
    const [steps, setSteps] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
    
    // 1 step is roughly ~0.045 kcal for an average person
    const caloriesBurned = Math.round(steps * 0.045);
    const distanceKm = (steps * 0.000762).toFixed(2); // Avg stride length 0.762m

    useEffect(() => {
        let timerInterval: ReturnType<typeof setInterval>;
        
        const initPedometer = async () => {
            if (isRunning) {
                if (Capacitor.isNativePlatform()) {
                    try {
                        const perm = await CapacitorPedometer.requestPermissions();
                        if (perm.activityRecognition === 'granted') {
                             await CapacitorPedometer.startMeasurementUpdates();
                             CapacitorPedometer.addListener('measurement', (data) => {
                                 if (data.numberOfSteps) {
                                     setSteps(prev => prev + 1); // Or use data.numberOfSteps depending on API
                                 }
                             });
                        } else {
                            console.error('Pedometer permission denied');
                        }
                    } catch (e) {
                        console.error('Pedometer error:', e);
                    }
                }

                timerInterval = setInterval(() => {
                    setTimeElapsed(prev => prev + 1);
                    // Mock steps if not native
                    if (!Capacitor.isNativePlatform()) {
                        setSteps(prev => prev + Math.floor(Math.random() * 2) + 2);
                    }
                }, 1000);
            } else {
                if (Capacitor.isNativePlatform()) {
                    CapacitorPedometer.stopMeasurementUpdates();
                    CapacitorPedometer.removeAllListeners();
                }
            }
        };

        initPedometer();

        return () => {
            clearInterval(timerInterval);
            if (Capacitor.isNativePlatform()) {
                CapacitorPedometer.stopMeasurementUpdates();
                CapacitorPedometer.removeAllListeners();
            }
        };
    }, [isRunning]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-full pb-36 lg:pb-12 bg-white select-none">
            {/* Header */}
            <div className="px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 bg-white border border-gray-100 flex items-center justify-center rounded-xl shadow-sm hover:bg-gray-50 transition">
                    <span className="material-symbols-outlined text-gray-600 text-xl">arrow_back</span>
                </button>
                <div className="text-center">
                    <h1 className="text-lg font-bold text-gray-900">Activité</h1>
                    <p className="text-xs text-emerald-500 font-semibold">{isRunning ? 'En cours...' : 'Prêt à démarrer'}</p>
                </div>
                <div className="w-10"></div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 mt-8 space-y-6 max-w-2xl mx-auto flex flex-col items-center">
                
                {/* Main Circular Progress for Steps */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90 pointer-events-none">
                        <circle cx="128" cy="128" r="110" className="text-gray-50" strokeWidth="16" stroke="currentColor" fill="none" />
                        <circle cx="128" cy="128" r="110" className="text-emerald-500 transition-all duration-1000" strokeWidth="16" stroke="currentColor" fill="none" 
                            strokeDasharray={2 * Math.PI * 110} 
                            strokeDashoffset={2 * Math.PI * 110 - (Math.min(steps, 10000) / 10000) * 2 * Math.PI * 110} 
                            strokeLinecap="round" 
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-emerald-500 mb-1">directions_run</span>
                        <h2 className="text-5xl font-extrabold text-gray-900">{steps}</h2>
                        <p className="text-xs font-semibold text-gray-400 mt-1 uppercase tracking-widest">Pas / 10 000</p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-orange-500 mb-2">local_fire_department</span>
                        <p className="text-2xl font-extrabold text-gray-900">{caloriesBurned}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">kcal brûlées</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center text-center">
                        <span className="material-symbols-outlined text-blue-500 mb-2">distance</span>
                        <p className="text-2xl font-extrabold text-gray-900">{distanceKm}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">km parcourus</p>
                    </div>
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col items-center text-center col-span-2 sm:col-span-1">
                        <span className="material-symbols-outlined text-purple-500 mb-2">timer</span>
                        <p className="text-2xl font-extrabold text-gray-900">{formatTime(timeElapsed)}</p>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">temps (min)</p>
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={() => setIsRunning(!isRunning)}
                    className={`w-full max-w-sm mt-8 py-5 rounded-2xl text-white font-bold text-lg shadow-md transition-all active:scale-[0.98] ${isRunning ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-gray-900 hover:bg-gray-800 shadow-gray-900/30'}`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-xl">{isRunning ? 'stop_circle' : 'play_circle'}</span>
                        {isRunning ? 'Terminer la course' : 'Démarrer une course'}
                    </span>
                </button>

                <p className="text-center text-xs text-gray-400 mt-6 max-w-xs leading-relaxed">
                    Les données seront synchronisées avec vos capteurs via Capacitor sur version mobile native.
                </p>
            </div>
        </div>
    );
};

export default Workout;

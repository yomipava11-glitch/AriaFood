/**
 * LoadingScreen.tsx — Clean Professional V3
 */
import React from 'react';

const LoadingScreen: React.FC = () => (
    <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center select-none">
        {/* Subtle background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-50 rounded-full blur-[120px]"></div>

        {/* Logo */}
        <div className="relative mb-6">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-sm overflow-hidden">
                <img src="/logo.png" alt="AriaFood" className="w-16 h-16 object-contain" />
            </div>
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
            Aria<span className="text-emerald-500">Food</span>
        </h1>
        <p className="text-xs text-gray-400 font-medium mb-10">Votre nutritionniste IA</p>

        {/* Loading Spinner */}
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-500 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs text-gray-400 font-medium animate-pulse">Chargement...</p>
    </div>
);

export default LoadingScreen;

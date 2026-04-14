import React from 'react';

interface GlassHUDProps {
    label: string;
    value: string;
    isPrimary?: boolean;
}

const GlassHUD: React.FC<GlassHUDProps> = ({ label, value, isPrimary = false }) => {
    return (
        <div className="glass-card px-4 py-2 border-gray-200 flex flex-col bg-white/2">
            <span className="text-[7px] font-black uppercase text-emerald-600 leading-none mb-1">{label}</span>
            <span className={`text-[9px] font-bold tracking-widest uppercase ${isPrimary ? 'text-primary animate-pulse' : 'text-gray-900'}`}>
                {value}
            </span>
        </div>
    );
};

export default GlassHUD;

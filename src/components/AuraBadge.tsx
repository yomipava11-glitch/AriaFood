import React from 'react';

interface AuraBadgeProps {
    status: 'LIVE' | 'LOCKED' | 'IDLE' | 'ANALYZING';
    className?: string;
}

const AuraBadge: React.FC<AuraBadgeProps> = ({ status, className = "" }) => {
    const config = {
        LIVE: { label: 'Source Liée', color: 'bg-primary' },
        LOCKED: { label: 'Scan Neural Vérifié', color: 'bg-primary' },
        IDLE: { label: 'Source Inactive', color: 'bg-white/20' },
        ANALYZING: { label: 'Sync Neurale Active', color: 'bg-primary' },
    };

    const current = config[status] || config.IDLE;

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <span className={`w-2 h-2 rounded-full ${current.color} ${status !== 'IDLE' ? 'animate-pulse' : ''}`}></span>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-0.5">
                {current.label}
            </p>
        </div>
    );
};

export default AuraBadge;

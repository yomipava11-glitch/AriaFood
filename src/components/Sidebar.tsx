/**
 * Sidebar.tsx — Retractable left sidebar navigation for mobile
 */
import React from 'react';
import { NavLink } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MENU_ITEMS = [
    { to: '/', icon: 'home', label: 'Accueil' },
    { to: '/scan', icon: 'qr_code_scanner', label: 'Scanner' },
    { to: '/history', icon: 'menu_book', label: 'Journal' },
    { to: '/meals', icon: 'explore', label: 'Explorer' },
    { to: '/recommendations', icon: 'psychology', label: 'Conseils IA' },
    { to: '/settings', icon: 'settings', label: 'Objectifs' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-gray-100 backdrop-blur-sm z-[998] transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <aside
                className={`fixed top-0 left-0 h-full w-72 bg-gray-100 backdrop-blur-2xl border-r border-gray-200 z-[999] transform transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="p-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden">
                                <img src="/logo.png" alt="AriaFood" className="w-8 h-8 object-contain" />
                            </div>
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 tracking-tighter">
                                    Aria<span className="text-primary italic">Food</span>
                                </h2>
                                <p className="text-[7px] font-black uppercase tracking-[0.3em] text-emerald-600">Nutritionniste IA</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-gray-500 text-lg">close</span>
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                    {MENU_ITEMS.map((item, i) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.to === '/'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${isActive
                                    ? 'bg-primary/10 border border-primary/20'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`
                            }
                            style={{ animationDelay: `${i * 50}ms` }}
                        >
                            {({ isActive }) => (
                                <>
                                    <span
                                        className={`material-symbols-outlined text-xl transition-colors ${isActive ? 'text-primary' : 'text-gray-500 group-hover:text-gray-500'
                                            }`}
                                        style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                                    >
                                        {item.icon}
                                    </span>
                                    <span
                                        className={`text-sm font-bold tracking-tight transition-colors ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-500'
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(19,236,91,0.5)]"></div>
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={() => { supabase.auth.signOut(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-sm font-bold active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Se Déconnecter
                    </button>
                    <p className="text-center text-[7px] font-bold text-gray-500 uppercase tracking-widest mt-3">AriaFood v2.0</p>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;

/**
 * Layout.tsx — Responsive Shell
 * Mobile: bottom navigation bar
 * Desktop (lg+): fixed left sidebar navigation
 */
import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';

const NAV = [
    { to: '/', icon: 'home', label: 'Accueil' },
    { to: '/history', icon: 'menu_book', label: 'Journal' },
    { to: '/scan', icon: 'qr_code_scanner', label: 'Scan', center: true },
    { to: '/chat', icon: 'auto_awesome', label: 'Aria IA' },
    { to: '/settings', icon: 'person', label: 'Profil' },
];

const Layout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50">
            {/* Sidebar (mobile drawer) */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Desktop Left Sidebar Nav (hidden on mobile) */}
            <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 py-6 px-4 flex-shrink-0">
                <div className="px-3 mb-10">
                    <h1 className="text-lg font-extrabold text-gray-900 tracking-tighter">
                        Aria<span className="text-primary italic">Food</span>
                    </h1>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mt-1">Nutrition Intelligence</p>
                </div>
                <nav className="flex-1 space-y-1">
                    {NAV.map(({ to, icon, label }) => (
                        <NavLink key={to} to={to} end={to === '/'}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }`
                            }>
                            <span className="material-symbols-outlined text-xl"
                                style={{ fontVariationSettings: "'FILL' 0" }}>{icon}</span>
                            <span className="tracking-wide">{label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="mt-auto pt-4 border-t border-gray-100">
                    <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest px-4">AriaFood v3.0</p>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">
                {/* Top Bar (mobile only) */}
                <div className="lg:hidden w-full px-5 pt-3 pb-1 flex items-center justify-between flex-shrink-0 z-40">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="w-10 h-10 glass-button flex items-center justify-center rounded-xl active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-outlined text-gray-500 text-xl">menu</span>
                    </button>
                    <h1 className="text-sm font-extrabold text-gray-900 tracking-tighter">
                        Aria<span className="text-primary italic">Food</span>
                    </h1>
                    <div className="w-10"></div>
                </div>

                <main className="flex-1 overflow-y-auto w-full max-w-5xl mx-auto scrollbar-hide relative">
                    <Outlet />
                </main>

                {/* Mobile Bottom Nav (hidden on desktop) */}
                <div className="lg:hidden w-full px-4 sm:px-6 pb-4 sm:pb-6 pt-2 flex-shrink-0 z-50">
                    <nav className="glass-nav flex items-center justify-around py-3 sm:py-4 px-2 rounded-[32px] shadow-2xl relative max-w-lg mx-auto">
                        {NAV.map(({ to, icon, label, center }) =>
                            center ? (
                                <div key={to} className="relative -mt-12">
                                    <NavLink to={to} end>
                                        {({ isActive }) => (
                                            <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-90 ${isActive ? 'bg-primary scale-110' : 'bg-primary'}`}>
                                                <span className="material-symbols-outlined text-2xl sm:text-3xl text-white font-bold">{icon}</span>
                                            </div>
                                        )}
                                    </NavLink>
                                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full -z-10 animate-pulse"></div>
                                </div>
                            ) : (
                                <NavLink key={to} to={to} end={to === '/'} className="flex-1">
                                    {({ isActive }) => (
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`w-10 h-1 rounded-full mb-1 transition-all duration-500 ${isActive ? 'bg-primary w-4' : 'bg-transparent w-0'}`}></div>
                                            <span className={`material-symbols-outlined text-xl sm:text-2xl transition-all duration-300 ${isActive ? 'text-primary scale-110 font-fill' : 'text-gray-400'}`}
                                                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                                {icon}
                                            </span>
                                            <span className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {label}
                                            </span>
                                        </div>
                                    )}
                                </NavLink>
                            )
                        )}
                    </nav>
                </div>
            </div>
        </div>
    );
};

export default Layout;


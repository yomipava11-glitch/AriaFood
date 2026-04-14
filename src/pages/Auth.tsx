/**
 * Auth.tsx — Clean Professional V3
 */
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                alert('Bienvenue ! Vérifiez vos e-mails pour activer votre compte.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center px-6 bg-white select-none">
            {/* Subtle background gradient */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-emerald-50 to-transparent rounded-full -mt-48 blur-3xl pointer-events-none"></div>

            {/* Logo + Title */}
            <div className="relative mb-10 text-center">
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 flex items-center justify-center rounded-3xl mx-auto mb-5 shadow-sm overflow-hidden">
                    <img src="/logo.png" alt="AriaFood" className="w-16 h-16 object-contain" />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                    Aria<span className="text-emerald-500">Food</span>
                </h1>
                <p className="text-sm text-gray-400 font-medium mt-1.5">Votre nutritionniste IA personnel</p>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-sm bg-white rounded-2xl p-7 border border-gray-100 shadow-lg">
                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-0.5">Adresse e-mail</label>
                        <input
                            type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="vous@email.com"
                            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 ml-0.5">Mot de passe</label>
                        <input
                            type="password" required value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-900 text-sm font-medium focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all outline-none"
                        />
                    </div>

                    <button disabled={loading}
                        className="w-full py-4 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-md hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50">
                        {loading ? 'Connexion en cours...' : isSignUp ? 'Créer mon compte' : 'Se connecter'}
                    </button>
                </form>
            </div>

            <button onClick={() => setIsSignUp(!isSignUp)}
                className="mt-8 text-sm font-medium text-gray-400 hover:text-emerald-600 transition-colors">
                {isSignUp ? 'Déjà inscrit ? Se connecter' : 'Pas encore de compte ? S\'inscrire'}
            </button>
        </div>
    );
};

export default Auth;

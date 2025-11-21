import React, { useState, useEffect } from 'react';
import { Lock, User, LogIn, AlertCircle, Settings } from 'lucide-react';

interface LoginProps {
    onLogin: (user: string, pass: string) => Promise<boolean>;
    isLoading: boolean;
    onOpenSettings: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, isLoading, onOpenSettings }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    // Atajo de teclado secreto: Ctrl + Shift + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'K') {
                e.preventDefault();
                onOpenSettings();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onOpenSettings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !password) {
            setError('Por favor ingrese usuario y contraseña');
            return;
        }

        const success = await onLogin(username, password);
        if (!success) {
            setError('Credenciales incorrectas o error de conexión');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-cyan-500/20 mb-4">
                            <Lock className="text-white w-8 h-8" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">Bienvenido</h1>
                        <p className="text-slate-400 text-sm">Ingrese sus credenciales para acceder</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <User size={20} />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all"
                                    placeholder="Usuario"
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                                    <Lock size={20} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 outline-none transition-all"
                                    placeholder="Contraseña"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2">
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98]"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    INICIAR SESIÓN
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="text-center mt-6 text-slate-500 text-xs">
                    &copy; {new Date().getFullYear()} Virtual Bingo Pro. Todos los derechos reservados.
                </div>
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, Vote, Shield } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';

const LoginForm: React.FC = () => {
    const navigate = useNavigate();
    const { login, verify2FA, isLoading, error, clearError, requires2FA, pending2FAUserId } = useAuthStore();

    const [formData, setFormData] = useState({
        rut: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (error) clearError();
    };

    const formatRut = (value: string) => {
        const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
        if (clean.length === 0) return '';
        if (clean.length === 1) return clean;
        const body = clean.slice(0, -1);
        const verifier = clean.slice(-1);
        const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        return `${formattedBody}-${verifier}`;
    };

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRut(e.target.value);
        setFormData(prev => ({
            ...prev,
            rut: formatted,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (requires2FA && pending2FAUserId) {
                await verify2FA(pending2FAUserId, twoFactorCode);
                toast.success('Login successful!');
                navigate('/dashboard');
            } else {
                await login(formData.rut, formData.password);
                if (!requires2FA) {
                    toast.success('Login successful!');
                    navigate('/dashboard');
                }
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed');
        }
    };

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pending2FAUserId) {
            toast.error('Invalid session');
            return;
        }

        try {
            await verify2FA(pending2FAUserId, twoFactorCode);
            toast.success('Login successful!');
            navigate('/dashboard');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : '2FA verification failed');
        }
    };

    if (requires2FA) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                        <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Autenticación de Dos Factores</h2>
                    <p className="text-gray-400">Ingresa el código de 6 dígitos de tu aplicación autenticadora</p>
                </div>

                <form onSubmit={handle2FASubmit} className="space-y-6">
                    <div>
                        <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-300 mb-2">
                            Código de Autenticación
                        </label>
                        <input
                            type="text"
                            id="twoFactorCode"
                            value={twoFactorCode}
                            onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg tracking-widest text-white placeholder-gray-500"
                            placeholder="000000"
                            maxLength={6}
                            pattern="[0-9]{6}"
                            required
                        />
                    </div>

                    {error && (
                        <div className="flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || twoFactorCode.length !== 6}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Verificando...
                            </div>
                        ) : (
                            'Verificar Código'
                        )}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-md mx-auto">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
                    <Vote className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h2>
                <p className="text-gray-400">Ingresa con tu RUT y contraseña</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="rut" className="block text-sm font-medium text-gray-300 mb-2">
                        RUT
                    </label>
                    <input
                        type="text"
                        id="rut"
                        name="rut"
                        value={formData.rut}
                        onChange={handleRutChange}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                        placeholder="12.345.678-9"
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                        Contraseña
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                            placeholder="••••••••"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                            ) : (
                                <Eye className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <Link
                        to="/forgot-password"
                        className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                {error && (
                    <div className="flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading || !formData.rut || !formData.password}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Iniciando sesión...
                        </div>
                    ) : (
                        'Iniciar Sesión'
                    )}
                </button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-sm text-gray-400">
                    ¿No tienes una cuenta?{' '}
                    <button
                        type="button"
                        onClick={() => navigate('/register')}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
                    >
                        Regístrate aquí
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginForm;

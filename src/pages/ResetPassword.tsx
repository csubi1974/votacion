import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
    const [resetSuccess, setResetSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error('Token inválido o faltante');
            navigate('/login');
        }
    }, [token, navigate]);

    const validatePassword = (password: string) => {
        const errors: string[] = [];

        if (password.length < 8) {
            errors.push('Al menos 8 caracteres');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Una mayúscula');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Una minúscula');
        }
        if (!/\d/.test(password)) {
            errors.push('Un número');
        }
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Un carácter especial');
        }

        setPasswordErrors(errors);
        setPasswordStrength(errors.length === 0 ? 4 : Math.max(0, 4 - errors.length));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));

        if (name === 'password') {
            validatePassword(value);
        }
    };

    const getPasswordStrengthColor = () => {
        switch (passwordStrength) {
            case 1: return 'bg-red-500';
            case 2: return 'bg-orange-500';
            case 3: return 'bg-yellow-500';
            case 4: return 'bg-green-500';
            default: return 'bg-gray-300';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }

        if (passwordErrors.length > 0) {
            toast.error('La contraseña no cumple con los requisitos');
            return;
        }

        try {
            setIsLoading(true);

            // Fetch CSRF token
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.csrfToken;

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setResetSuccess(true);
                toast.success('Contraseña actualizada exitosamente');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                toast.error(data.message || 'Error al resetear la contraseña');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    if (resetSuccess) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                ¡Contraseña Actualizada!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Tu contraseña ha sido actualizada exitosamente. Serás redirigido al login en unos segundos.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Ir al Login
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-lg shadow-xl p-8">
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                            <Lock className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Resetear Contraseña
                        </h2>
                        <p className="text-gray-600">
                            Ingresa tu nueva contraseña
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Nueva Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-gray-600">Fortaleza de contraseña</span>
                                        <span className="text-xs text-gray-500">
                                            {passwordStrength === 4 ? 'Fuerte' : passwordStrength === 3 ? 'Media' : passwordStrength === 2 ? 'Débil' : 'Muy débil'}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                                        ></div>
                                    </div>
                                    {passwordErrors.length > 0 && (
                                        <div className="mt-2 text-xs text-red-600">
                                            <p className="font-medium mb-1">La contraseña debe contener:</p>
                                            <ul className="space-y-1">
                                                {passwordErrors.map((error, index) => (
                                                    <li key={index} className="flex items-center">
                                                        <AlertCircle className="w-3 h-3 mr-1" />
                                                        {error}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmar Contraseña
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>

                            {formData.confirmPassword && formData.password === formData.confirmPassword && (
                                <div className="mt-1 flex items-center text-green-600 text-sm">
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Las contraseñas coinciden
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Actualizando...
                                </div>
                            ) : (
                                'Actualizar Contraseña'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            Volver al Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;

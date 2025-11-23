import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const ForgotPassword: React.FC = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [resetUrl, setResetUrl] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            toast.error('Por favor ingresa tu email');
            return;
        }

        try {
            setIsLoading(true);

            // Fetch CSRF token
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.csrfToken;

            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setEmailSent(true);
                // In development, capture the reset URL
                if (data.devOnly?.resetUrl) {
                    setResetUrl(data.devOnly.resetUrl);
                }
                toast.success('Revisa tu email para continuar');
            } else {
                toast.error(data.message || 'Error al enviar el email');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    if (emailSent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <div className="text-center">
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                ¡Email Enviado!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                Si existe una cuenta con el email <strong>{email}</strong>, recibirás instrucciones para resetear tu contraseña.
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Revisa tu bandeja de entrada y también la carpeta de spam.
                            </p>

                            {resetUrl && (
                                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                    <p className="text-xs font-semibold text-yellow-800 mb-2">
                                        🔧 MODO DESARROLLO
                                    </p>
                                    <p className="text-xs text-yellow-700 mb-2">
                                        Usa este link para resetear tu contraseña:
                                    </p>
                                    <a
                                        href={resetUrl}
                                        className="text-xs text-blue-600 hover:text-blue-800 break-all underline"
                                    >
                                        {resetUrl}
                                    </a>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Volver al Login
                                </button>
                                <button
                                    onClick={() => {
                                        setEmailSent(false);
                                        setEmail('');
                                    }}
                                    className="w-full text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Enviar a otro email
                                </button>
                            </div>
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
                            <Mail className="w-8 h-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            ¿Olvidaste tu Contraseña?
                        </h2>
                        <p className="text-gray-600">
                            Ingresa tu email y te enviaremos instrucciones para resetear tu contraseña
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="tu@email.com"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Enviando...
                                </div>
                            ) : (
                                'Enviar Instrucciones'
                            )}
                        </button>
                    </form>

                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="flex items-center justify-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Volver al Login
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600">
                        ¿No tienes una cuenta?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                            Regístrate aquí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;

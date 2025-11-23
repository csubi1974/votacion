import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Disable2FAModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (code: string, password: string) => Promise<void>;
}

export default function Disable2FAModal({
    isOpen,
    onClose,
    onConfirm,
}: Disable2FAModalProps) {
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [usePassword, setUsePassword] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!usePassword && code.length !== 6) {
            toast.error('El código debe tener 6 dígitos');
            return;
        }

        if (usePassword && !password) {
            toast.error('Ingresa tu contraseña');
            return;
        }

        try {
            setIsLoading(true);
            await onConfirm(code, password);
            handleClose();
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setCode('');
        setPassword('');
        setUsePassword(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-900">Desactivar 2FA</h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                                <div className="ml-3">
                                    <h4 className="text-sm font-medium text-red-800">Advertencia</h4>
                                    <p className="mt-1 text-sm text-red-700">
                                        Desactivar 2FA hará que tu cuenta sea menos segura. Solo hazlo si es absolutamente necesario.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {!usePassword ? (
                            <>
                                <div>
                                    <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                                        Código de Autenticación
                                    </label>
                                    <input
                                        type="text"
                                        id="code"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                    />
                                    <p className="mt-2 text-xs text-gray-500">
                                        Ingresa el código de 6 dígitos de tu aplicación de autenticación
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setUsePassword(true)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    ¿No tienes acceso a tu app? Usa tu contraseña
                                </button>
                            </>
                        ) : (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Contraseña
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        placeholder="Ingresa tu contraseña"
                                        autoFocus
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setUsePassword(false)}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                >
                                    Usar código de autenticación
                                </button>
                            </>
                        )}

                        <div className="flex space-x-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || (!usePassword && code.length !== 6) || (usePassword && !password)}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Desactivando...' : 'Desactivar 2FA'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

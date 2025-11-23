import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Copy, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Enable2FAModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCodeUrl: string;
    secret: string;
    onConfirm: (code: string) => Promise<void>;
    recoveryCodes?: string[];
}

export default function Enable2FAModal({
    isOpen,
    onClose,
    qrCodeUrl,
    secret,
    onConfirm,
    recoveryCodes,
}: Enable2FAModalProps) {
    const [step, setStep] = useState<'qr' | 'verify' | 'codes'>(recoveryCodes ? 'codes' : 'qr');
    const [verificationCode, setVerificationCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const handleCopySecret = () => {
        navigator.clipboard.writeText(secret);
        toast.success('Código copiado al portapapeles');
    };

    const handleCopyCodes = () => {
        const codesText = recoveryCodes?.join('\n') || '';
        navigator.clipboard.writeText(codesText);
        toast.success('Códigos copiados al portapapeles');
    };

    const handleDownloadCodes = () => {
        const codesText = recoveryCodes?.join('\n') || '';
        const blob = new Blob([codesText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recovery-codes.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Códigos descargados');
    };

    const handleVerify = async () => {
        if (verificationCode.length !== 6) {
            toast.error('El código debe tener 6 dígitos');
            return;
        }

        try {
            setIsLoading(true);
            await onConfirm(verificationCode);
            setStep('codes');
        } catch (error) {
            // Error handled by parent
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setVerificationCode('');
        setStep('qr');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-bold text-gray-900">
                        {step === 'qr' && 'Configurar 2FA'}
                        {step === 'verify' && 'Verificar Código'}
                        {step === 'codes' && 'Códigos de Recuperación'}
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step 1: QR Code */}
                    {step === 'qr' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <p className="text-sm text-blue-800">
                                    Escanea este código QR con Google Authenticator, Authy, o cualquier app de autenticación compatible.
                                </p>
                            </div>

                            <div className="flex justify-center p-4 bg-white border-2 border-gray-200 rounded-lg">
                                <QRCodeSVG value={qrCodeUrl} size={200} />
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2 font-medium">
                                    ¿No puedes escanear? Ingresa este código manualmente:
                                </p>
                                <div className="flex items-center space-x-2">
                                    <code className="flex-1 text-sm font-mono bg-white px-3 py-2 rounded border break-all">
                                        {secret}
                                    </code>
                                    <button
                                        onClick={handleCopySecret}
                                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                                        title="Copiar código"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => setStep('verify')}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* Step 2: Verify Code */}
                    {step === 'verify' && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                                <p className="text-sm text-blue-800">
                                    Ingresa el código de 6 dígitos que aparece en tu aplicación de autenticación.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                                    Código de Verificación
                                </label>
                                <input
                                    type="text"
                                    id="verificationCode"
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full px-4 py-3 text-center text-2xl font-mono border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="000000"
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setStep('qr')}
                                    disabled={isLoading}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50"
                                >
                                    Atrás
                                </button>
                                <button
                                    onClick={handleVerify}
                                    disabled={isLoading || verificationCode.length !== 6}
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Verificando...' : 'Activar 2FA'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Recovery Codes */}
                    {step === 'codes' && recoveryCodes && (
                        <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                                <div className="flex">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div className="ml-3">
                                        <h4 className="text-sm font-medium text-yellow-800">¡Importante!</h4>
                                        <p className="mt-1 text-sm text-yellow-700">
                                            Guarda estos códigos en un lugar seguro. Puedes usarlos para acceder a tu cuenta si pierdes acceso a tu aplicación de autenticación.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                                <div className="grid grid-cols-2 gap-2">
                                    {recoveryCodes.map((code, index) => (
                                        <div
                                            key={index}
                                            className="bg-white px-3 py-2 rounded border font-mono text-sm text-center"
                                        >
                                            {code}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleCopyCodes}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Copiar
                                </button>
                                <button
                                    onClick={handleDownloadCodes}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar
                                </button>
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-md p-4">
                                <div className="flex">
                                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div className="ml-3">
                                        <p className="text-sm text-green-800">
                                            ¡2FA activado exitosamente! Tu cuenta ahora está más segura.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleClose}
                                className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                            >
                                Finalizar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

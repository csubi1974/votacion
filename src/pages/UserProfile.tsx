import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Key, Eye, EyeOff, Save, AlertCircle, CheckCircle, Clock, MapPin } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import Enable2FAModal from '@/components/Enable2FAModal';
import Disable2FAModal from '@/components/Disable2FAModal';

interface ProfileData {
    fullName: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

interface ActivityLog {
    id: string;
    action: string;
    createdAt: string;
    ipAddress: string;
}

export default function UserProfile() {
    const navigate = useNavigate();
    const { user, accessToken, updateUser } = useAuthStore();
    const [activeTab, setActiveTab] = useState<'info' | 'security' | 'activity'>('info');
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

    const [formData, setFormData] = useState<ProfileData>({
        fullName: user?.fullName || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

    // 2FA states
    const [showEnable2FAModal, setShowEnable2FAModal] = useState(false);
    const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName,
            }));
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'activity') {
            fetchActivityLogs();
        }
    }, [activeTab]);

    const fetchActivityLogs = async () => {
        try {
            if (!accessToken) {
                console.log('No access token available');
                return;
            }

            // Use the new my-activity endpoint
            const response = await fetch(`/api/audit/my-activity?limit=10`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401) {
                console.log('Token expired, please login again');
                toast.error('Sesión expirada. Por favor inicia sesión nuevamente.');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                console.log('Activity logs received:', data);
                setActivityLogs(data.data || []);
            } else {
                const errorData = await response.json();
                console.error('Error response:', errorData);
                toast.error('Error al cargar actividad');
            }
        } catch (error) {
            console.error('Error fetching activity logs:', error);
            toast.error('Error al cargar actividad');
        }
    };

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

        if (name === 'newPassword') {
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

        // Validate password change if attempting
        if (formData.newPassword || formData.currentPassword) {
            if (!formData.currentPassword) {
                toast.error('Ingresa tu contraseña actual');
                return;
            }
            if (!formData.newPassword) {
                toast.error('Ingresa una nueva contraseña');
                return;
            }
            if (formData.newPassword !== formData.confirmPassword) {
                toast.error('Las contraseñas no coinciden');
                return;
            }
            if (passwordErrors.length > 0) {
                toast.error('La contraseña no cumple con los requisitos');
                return;
            }
        }

        try {
            setIsLoading(true);

            // Fetch CSRF token
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();
            const csrfToken = csrfData.csrfToken;

            const updateData: any = {};

            if (formData.fullName !== user?.fullName) {
                updateData.fullName = formData.fullName;
            }

            if (formData.currentPassword && formData.newPassword) {
                updateData.currentPassword = formData.currentPassword;
                updateData.newPassword = formData.newPassword;
            }

            const response = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRF-Token': csrfToken,
                },
                body: JSON.stringify(updateData),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Perfil actualizado exitosamente');
                updateUser(data.data.user);
                setIsEditing(false);

                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                }));
            } else {
                toast.error(data.message || 'Error al actualizar el perfil');
            }
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            fullName: user?.fullName || '',
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        });
        setIsEditing(false);
    };

    // 2FA Handlers
    const handleEnable2FA = async () => {
        try {
            const csrfResponse = await fetch('/api/csrf-token');
            const csrfData = await csrfResponse.json();

            const response = await fetch('/api/auth/2fa/setup', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRF-Token': csrfData.csrfToken,
                },
            });

            const data = await response.json();

            if (response.ok) {
                setQrCodeUrl(data.data.qrCode);
                setTwoFactorSecret(data.data.secret);
                setShowEnable2FAModal(true);
            } else {
                toast.error(data.message || 'Error al configurar 2FA');
            }
        } catch (error) {
            console.error('Enable 2FA error:', error);
            toast.error('Error al configurar 2FA');
        }
    };

    const handleConfirmEnable2FA = async (code: string) => {
        const csrfResponse = await fetch('/api/csrf-token');
        const csrfData = await csrfResponse.json();

        const response = await fetch('/api/auth/2fa/enable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRF-Token': csrfData.csrfToken,
            },
            body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok) {
            toast.success('2FA activado exitosamente');
            setRecoveryCodes(data.data.recoveryCodes);
            updateUser({ twoFactorEnabled: true });
        } else {
            toast.error(data.message || 'Código inválido');
            throw new Error(data.message);
        }
    };

    const handleDisable2FA = () => {
        setShowDisable2FAModal(true);
    };

    const handleConfirmDisable2FA = async (code: string, password: string) => {
        const csrfResponse = await fetch('/api/csrf-token');
        const csrfData = await csrfResponse.json();

        const response = await fetch('/api/auth/2fa/disable', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
                'X-CSRF-Token': csrfData.csrfToken,
            },
            body: JSON.stringify({ code, password }),
        });

        const data = await response.json();

        if (response.ok) {
            toast.success('2FA desactivado exitosamente');
            updateUser({ twoFactorEnabled: false });
        } else {
            toast.error(data.message || 'Error al desactivar 2FA');
            throw new Error(data.message);
        }
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="h-20 w-20 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-3xl font-bold text-blue-600">
                                {user.fullName.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
                            <p className="text-gray-600">{user.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                    {user.role}
                                </span>
                                {user.emailVerified && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Email Verificado
                                    </span>
                                )}
                                {user.twoFactorEnabled && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        <Shield className="w-3 h-3 mr-1" />
                                        2FA Activo
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <User className="w-4 h-4 inline mr-2" />
                                Información Personal
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'security'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Shield className="w-4 h-4 inline mr-2" />
                                Seguridad
                            </button>
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Clock className="w-4 h-4 inline mr-2" />
                                Actividad Reciente
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Info Tab */}
                        {activeTab === 'info' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        RUT
                                    </label>
                                    <input
                                        type="text"
                                        value={user.rut}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">El RUT no puede ser modificado</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={user.email}
                                        disabled
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">El email no puede ser modificado</p>
                                </div>

                                <div>
                                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        id="fullName"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || isLoading}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                                    />
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4">
                                    {!isEditing ? (
                                        <button
                                            type="button"
                                            onClick={() => setIsEditing(true)}
                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            Editar Perfil
                                        </button>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                onClick={handleCancel}
                                                disabled={isLoading}
                                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </>
                                    )}
                                </div>
                            </form>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                                    <div className="flex">
                                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-blue-800">Cambiar Contraseña</h3>
                                            <p className="mt-1 text-sm text-blue-700">
                                                Asegúrate de usar una contraseña fuerte y única.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Contraseña Actual
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            id="currentPassword"
                                            name="currentPassword"
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                        Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showNewPassword ? 'text' : 'password'}
                                            id="newPassword"
                                            name="newPassword"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? (
                                                <EyeOff className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <Eye className="h-4 w-4 text-gray-400" />
                                            )}
                                        </button>
                                    </div>

                                    {formData.newPassword && (
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
                                        Confirmar Nueva Contraseña
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            disabled={isLoading}
                                            className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="••••••••"
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

                                    {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                                        <div className="mt-1 flex items-center text-green-600 text-sm">
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Las contraseñas coinciden
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                                    <button
                                        type="submit"
                                        disabled={isLoading || !formData.currentPassword || !formData.newPassword || passwordErrors.length > 0}
                                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Key className="w-4 h-4 mr-2" />
                                        {isLoading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* 2FA Section */}
                        {activeTab === 'security' && (
                            <div className="mt-8 pt-8 border-t">
                                <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
                                    <div className="flex">
                                        <Shield className="h-5 w-5 text-purple-600 mt-0.5" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-purple-800">Autenticación de Dos Factores (2FA)</h3>
                                            <p className="mt-1 text-sm text-purple-700">
                                                Agrega una capa extra de seguridad a tu cuenta.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">Estado de 2FA</h4>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {user.twoFactorEnabled
                                                    ? 'La autenticación de dos factores está activa'
                                                    : 'La autenticación de dos factores está desactivada'}
                                            </p>
                                        </div>
                                        <div className="ml-4">
                                            {user.twoFactorEnabled ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                    <CheckCircle className="w-4 h-4 mr-1" />
                                                    Activo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                    Inactivo
                                                </span>
                                            )}
                                        </div>
                                    </div>
                        )}

                                    {/* Activity Tab */}
                                    {activeTab === 'activity' && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-medium text-gray-900 mb-4">Actividad Reciente</h3>

                                            {activityLogs.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No hay actividad reciente</h3>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        Tus acciones aparecerán aquí.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {activityLogs.map((log) => (
                                                        <div key={log.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                                                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                                                                        <span className="flex items-center">
                                                                            <Clock className="w-3 h-3 mr-1" />
                                                                            {new Date(log.createdAt).toLocaleString('es-CL')}
                                                                        </span>
                                                                        <span className="flex items-center">
                                                                            <MapPin className="w-3 h-3 mr-1" />
                                                                            {log.ipAddress}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
            </div>
                </div>
                );
}

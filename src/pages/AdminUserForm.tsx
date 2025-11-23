import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

interface UserFormData {
    rut: string;
    email: string;
    fullName: string;
    password: string;
    role: 'voter' | 'admin' | 'super_admin';
    organizationId: string;
}

export default function AdminUserForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { accessToken, user } = useAuthStore();
    const isEditing = !!id;

    const [formData, setFormData] = useState<UserFormData>({
        rut: '',
        email: '',
        fullName: '',
        password: '',
        role: 'voter',
        organizationId: '',
    });

    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        fetchOrganizations();
        if (isEditing) {
            fetchUser();
        }
    }, [id]);

    const fetchOrganizations = async () => {
        try {
            console.log('Fetching organizations with token:', accessToken ? 'Present' : 'Missing');
            const response = await fetch('/api/admin/organizations', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.status === 401) {
                console.error('Unauthorized access to organizations');
                toast.error('Sesión expirada. Por favor inicie sesión nuevamente.');
                // Optional: navigate('/login');
                return;
            }

            if (response.ok) {
                const data = await response.json();
                setOrganizations(data.data || []);
            } else {
                console.error('Failed to fetch organizations:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await fetch(`/api/admin/users/${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    rut: data.data.rut,
                    email: data.data.email,
                    fullName: data.data.fullName,
                    password: '', // No mostrar contraseña
                    role: data.data.role,
                    organizationId: data.data.organizationId,
                });
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            toast.error('Error al cargar usuario');
        }
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
        setFormData(prev => ({ ...prev, rut: formatted }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = isEditing
                ? `/api/admin/users/${id}`
                : '/api/admin/users';

            const method = isEditing ? 'PUT' : 'POST';

            const payload: any = {
                rut: formData.rut,
                email: formData.email,
                fullName: formData.fullName,
                role: formData.role,
                organizationId: formData.organizationId,
            };

            // Solo incluir contraseña si se está creando o si se cambió
            if (!isEditing || formData.password) {
                payload.password = formData.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success(isEditing ? 'Usuario actualizado' : 'Usuario creado exitosamente');
                navigate('/admin/users');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar usuario');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Error al guardar usuario');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/users')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Editar Usuario' : 'Nuevo Usuario'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEditing ? 'Modifica los datos del usuario' : 'Completa el formulario para crear un nuevo usuario'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* RUT */}
                        <div>
                            <label htmlFor="rut" className="block text-sm font-medium text-gray-700 mb-2">
                                RUT *
                            </label>
                            <input
                                type="text"
                                id="rut"
                                value={formData.rut}
                                onChange={handleRutChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="12.345.678-9"
                                required
                                disabled={isEditing}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="usuario@ejemplo.com"
                                required
                            />
                        </div>

                        {/* Nombre Completo */}
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                Nombre Completo *
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Juan Pérez"
                                required
                            />
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Contraseña {!isEditing && '*'}
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={isEditing ? 'Dejar en blanco para no cambiar' : '••••••••'}
                                    required={!isEditing}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {!isEditing && (
                                <p className="mt-1 text-xs text-gray-500">
                                    Mínimo 8 caracteres, debe incluir mayúsculas, minúsculas, números y caracteres especiales
                                </p>
                            )}
                        </div>

                        {/* Rol */}
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                Rol *
                            </label>
                            <select
                                id="role"
                                value={formData.role}
                                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="voter">Votante</option>
                                <option value="admin">Administrador</option>
                                {user?.role === 'super_admin' && (
                                    <option value="super_admin">Super Administrador</option>
                                )}
                            </select>
                        </div>

                        {/* Organización */}
                        <div>
                            <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-2">
                                Organización *
                            </label>
                            <select
                                id="organizationId"
                                value={formData.organizationId}
                                onChange={(e) => setFormData(prev => ({ ...prev, organizationId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            >
                                <option value="">Selecciona una organización</option>
                                {organizations.map((org) => (
                                    <option key={org.id} value={org.id}>
                                        {org.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/users')}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Usuario'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

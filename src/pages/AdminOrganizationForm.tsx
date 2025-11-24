import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';
import { formatRut, cleanRut } from '../utils/rut';

interface OrganizationFormData {
    name: string;
    rut: string;
    email: string;
    isActive: boolean;
}

export default function AdminOrganizationForm() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { accessToken } = useAuthStore();
    const isEditing = !!id;

    const [formData, setFormData] = useState<OrganizationFormData>({
        name: '',
        rut: '',
        email: '',
        isActive: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEditing) {
            fetchOrganization();
        }
    }, [id]);

    const fetchOrganization = async () => {
        try {
            const response = await fetch(`/api/organizations/${id}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setFormData({
                    name: data.data.name,
                    rut: data.data.rut,
                    email: data.data.email,
                    isActive: data.data.isActive,
                });
            } else {
                toast.error('Error al cargar la organización');
                navigate('/admin/organizations');
            }
        } catch (error) {
            console.error('Error fetching organization:', error);
            toast.error('Error al cargar la organización');
        }
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
                ? `/api/organizations/${id}`
                : '/api/organizations';

            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                rut: cleanRut(formData.rut), // Clean RUT before sending
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                toast.success(isEditing ? 'Organización actualizada' : 'Organización creada exitosamente');
                navigate('/admin/organizations');
            } else {
                const error = await response.json();
                toast.error(error.message || 'Error al guardar organización');
            }
        } catch (error) {
            console.error('Error saving organization:', error);
            toast.error('Error al guardar organización');
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
                        onClick={() => navigate('/admin/organizations')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {isEditing ? 'Editar Organización' : 'Nueva Organización'}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            {isEditing ? 'Modifica los datos de la organización' : 'Completa el formulario para crear una nueva organización'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg shadow-sm p-6 max-w-2xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex items-center justify-center mb-6">
                        <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building2 className="h-10 w-10 text-blue-600" />
                        </div>
                    </div>

                    {/* Nombre */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nombre de la Organización *
                        </label>
                        <input
                            type="text"
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Ej: Municipalidad de Santiago"
                            required
                        />
                    </div>

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
                            placeholder="76.123.456-7"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email de Contacto *
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="contacto@organizacion.cl"
                            required
                        />
                    </div>

                    {/* Estado */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                            Organización Activa
                        </label>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/organizations')}
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
                            <span>{loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Organización'}</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

import React, { useState, useEffect, useCallback } from 'react';
import { formatRut, cleanRut } from '../utils/rut';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import {
    Users,
    UserPlus,
    Upload,
    Trash2,
    Search,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Download
} from 'lucide-react';
import { format } from 'date-fns';

interface Voter {
    id: string;
    electionId: string;
    userId: string;
    isEligible: boolean;
    hasVoted: boolean;
    addedAt: string;
    user: {
        id: string;
        rut: string;
        email: string;
        fullName: string;
    };
    addedByUser?: {
        fullName: string;
    };
}

interface RegistryStats {
    total: number;
    voted: number;
    eligible: number;
    pending: number;
    participationRate: number;
}

export default function VoterRegistry() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { accessToken, user } = useAuthStore();

    const [voters, setVoters] = useState<Voter[]>([]);
    const [stats, setStats] = useState<RegistryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    // New voter form
    const [formData, setFormData] = useState({
        rut: '',
        fullName: '',
        email: '',
        organizationId: ''
    });
    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
    const [orgSearchTerm, setOrgSearchTerm] = useState('');
    const [showOrgDropdown, setShowOrgDropdown] = useState(false);
    const [isSearchingUser, setIsSearchingUser] = useState(false);
    const [existingUser, setExistingUser] = useState<any>(null);

    // Import form
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);

    const fetchVoters = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/elections/${id}/voters`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch voters');

            const data = await response.json();
            setVoters(data.data.voters);
            setStats(data.data.stats);
        } catch (error) {
            console.error('Error fetching voters:', error);
            toast.error('Error al cargar el padrón');
        } finally {
            setLoading(false);
        }
    }, [id, accessToken]);

    useEffect(() => {
        fetchVoters();
        if (user?.role === 'super_admin') {
            fetchOrganizations();
        }
    }, [fetchVoters, user]);

    const fetchOrganizations = async () => {
        try {
            const response = await fetch('/api/admin/organizations', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setOrganizations(data.data);
            }
        } catch (error) {
            console.error('Error fetching organizations:', error);
        }
    };


    // Check if user exists by RUT
    const checkUserExists = async (rut: string) => {
        if (!rut) return;
        setIsSearchingUser(true);
        try {
            const response = await fetch(`/api/admin/users?search=${rut}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                const cleanedRut = cleanRut(rut);
                const user = data.data.users.find((u: any) => cleanRut(u.rut) === cleanedRut);
                if (user) {
                    setExistingUser(user);
                    setFormData(prev => ({
                        ...prev,
                        fullName: user.fullName,
                        email: user.email
                    }));
                } else {
                    setExistingUser(null);
                }
            }
        } catch (error) {
            console.error('Error searching user:', error);
        } finally {
            setIsSearchingUser(false);
        }
    };

    const handleAddVoter = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let userIdToAdd = existingUser?.id;

            // If user doesn't exist, create it first
            if (!userIdToAdd) {
                // Determine which organizationId to use
                const orgIdToUse = user?.role === 'super_admin' && formData.organizationId
                    ? formData.organizationId
                    : user?.organizationId;

                if (!orgIdToUse) {
                    toast.error('No se pudo obtener la organización');
                    return;
                }

                const createResponse = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        rut: cleanRut(formData.rut),
                        fullName: formData.fullName,
                        email: formData.email,
                        role: 'voter',
                        organizationId: orgIdToUse
                    }),
                });

                if (!createResponse.ok) {
                    const error = await createResponse.json();
                    throw new Error(error.message || 'Error al crear usuario');
                }

                const createData = await createResponse.json();
                userIdToAdd = createData.data.user.id;
                toast.success('Usuario creado exitosamente');
            }

            // Add to registry
            const response = await fetch(`/api/elections/${id}/voters`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: userIdToAdd }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to add voter');
            }

            toast.success('Votante agregado al padrón exitosamente');
            setShowAddModal(false);
            setFormData({ rut: '', fullName: '', email: '', organizationId: '' });
            setExistingUser(null);
            fetchVoters();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al procesar solicitud');
        }
    };

    const handleRemoveVoter = async (userId: string) => {
        if (!confirm('¿Está seguro de eliminar este votante del padrón?')) return;

        try {
            const response = await fetch(`/api/elections/${id}/voters/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) throw new Error('Failed to remove voter');

            toast.success('Votante eliminado del padrón');
            fetchVoters();
        } catch (error) {
            toast.error('Error al eliminar votante');
        }
    };

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!importFile) return;

        setImporting(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').slice(1); // Skip header
                const voters = rows
                    .filter(row => row.trim())
                    .map(row => {
                        const [rut, email, fullName] = row.split(',').map(s => s.trim());
                        return { rut, email, fullName };
                    });

                const response = await fetch(`/api/elections/${id}/voters/import`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ voters }),
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Import failed');

                toast.success(data.message);
                setShowImportModal(false);
                setImportFile(null);
                fetchVoters();
            } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Error en la importación');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsText(importFile);
    };

    const filteredVoters = voters.filter(v =>
        v.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.user.rut.includes(searchTerm) ||
        v.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate('/admin/elections')}
                    className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Padrón Electoral</h1>
                    <p className="text-gray-500">Gestión de votantes habilitados</p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Padrón</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <Users className="w-8 h-8 text-blue-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Han Votado</p>
                                <p className="text-2xl font-bold text-green-600">{stats.voted}</p>
                            </div>
                            <CheckCircle className="w-8 h-8 text-green-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Pendientes</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                            </div>
                            <XCircle className="w-8 h-8 text-orange-500 opacity-20" />
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Participación</p>
                                <p className="text-2xl font-bold text-blue-600">{stats.participationRate.toFixed(1)}%</p>
                            </div>
                            <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-500" />
                        </div>
                    </div>
                </div>
            )}

            {/* Actions Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, RUT o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex-1 md:flex-none"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Importar CSV
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-1 md:flex-none"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Agregar Votante
                    </button>
                </div>
            </div>

            {/* Voters Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Votante</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">RUT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agregado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredVoters.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron votantes en el padrón
                                    </td>
                                </tr>
                            ) : (
                                filteredVoters.map((voter) => (
                                    <tr key={voter.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                                                    {voter.user.fullName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{voter.user.fullName}</div>
                                                    <div className="text-sm text-gray-500">{voter.user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {voter.user.rut}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {voter.hasVoted ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Ya Votó
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {format(new Date(voter.addedAt), 'dd/MM/yyyy HH:mm')}
                                            <div className="text-xs text-gray-400">por {voter.addedByUser?.fullName || 'Sistema'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {!voter.hasVoted && (
                                                <button
                                                    onClick={() => handleRemoveVoter(voter.userId)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Eliminar del padrón"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {showImportModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Importar Padrón</h3>
                            <button onClick={() => setShowImportModal(false)} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleImport}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Archivo CSV
                                </label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <input
                                        type="file"
                                        accept=".csv"
                                        onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="csv-upload"
                                    />
                                    <label htmlFor="csv-upload" className="cursor-pointer">
                                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                        <span className="text-blue-600 hover:underline">Seleccionar archivo</span>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {importFile ? importFile.name : 'Formato: RUT, Email, Nombre'}
                                        </p>
                                    </label>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    El archivo debe tener cabecera y columnas: rut, email, fullName
                                </p>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!importFile || importing}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {importing ? 'Importando...' : 'Importar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Voter Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Agregar Votante al Padrón</h3>
                            <button onClick={() => {
                                setShowAddModal(false);
                                setFormData({ rut: '', fullName: '', email: '', organizationId: '' });
                                setExistingUser(null);
                            }} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleAddVoter}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        RUT
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.rut}
                                            onChange={(e) => {
                                                const formatted = formatRut(e.target.value);
                                                setFormData({ ...formData, rut: formatted });
                                                setExistingUser(null);
                                            }}
                                            onBlur={() => {
                                                if (formData.rut.length >= 8) {
                                                    checkUserExists(formData.rut);
                                                }
                                            }}
                                            placeholder="12.345.678-9"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                        {isSearchingUser && (
                                            <div className="absolute right-3 top-2.5">
                                                <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                                            </div>
                                        )}
                                    </div>
                                    {existingUser && (
                                        <p className="text-xs text-green-600 mt-1 flex items-center">
                                            <CheckCircle className="w-3 h-3 mr-1" />
                                            Usuario encontrado en el sistema
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre Completo
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${existingUser ? 'bg-gray-100' : ''}`}
                                        readOnly={!!existingUser}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 ${existingUser ? 'bg-gray-100' : ''}`}
                                        readOnly={!!existingUser}
                                        required
                                    />
                                </div>

                                {/* Organization selector - only for super_admin */}
                                {user?.role === 'super_admin' && !existingUser && (
                                    <div className="relative">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Organización *
                                        </label>

                                        {/* Selected organization display or search input */}
                                        {formData.organizationId && !showOrgDropdown ? (
                                            <div className="relative">
                                                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between">
                                                    <span className="text-gray-900">
                                                        {organizations.find(o => o.id === formData.organizationId)?.name}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData({ ...formData, organizationId: '' });
                                                            setOrgSearchTerm('');
                                                            setShowOrgDropdown(true);
                                                        }}
                                                        className="text-gray-400 hover:text-gray-600"
                                                    >
                                                        <XCircle className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={orgSearchTerm}
                                                    onChange={(e) => {
                                                        setOrgSearchTerm(e.target.value);
                                                        setShowOrgDropdown(true);
                                                    }}
                                                    onFocus={() => setShowOrgDropdown(true)}
                                                    placeholder="Buscar organización..."
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    required={!formData.organizationId}
                                                />
                                                <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
                                            </div>
                                        )}

                                        {/* Dropdown */}
                                        {showOrgDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowOrgDropdown(false)}
                                                />
                                                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                    {organizations
                                                        .filter(org =>
                                                            org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
                                                        )
                                                        .map(org => (
                                                            <div
                                                                key={org.id}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, organizationId: org.id });
                                                                    setOrgSearchTerm('');
                                                                    setShowOrgDropdown(false);
                                                                }}
                                                                className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${formData.organizationId === org.id ? 'bg-blue-100' : ''
                                                                    }`}
                                                            >
                                                                {org.name}
                                                            </div>
                                                        ))
                                                    }
                                                    {organizations.filter(org =>
                                                        org.name.toLowerCase().includes(orgSearchTerm.toLowerCase())
                                                    ).length === 0 && (
                                                            <div className="px-4 py-2 text-gray-500 text-sm">
                                                                No se encontraron organizaciones
                                                            </div>
                                                        )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {!existingUser && formData.rut.length > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
                                        <p>Este usuario no existe en el sistema. Se creará una cuenta nueva automáticamente y se le enviará una contraseña temporal.</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddModal(false);
                                        setFormData({ rut: '', fullName: '', email: '', organizationId: '' });
                                        setExistingUser(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSearchingUser}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {existingUser ? 'Agregar al Padrón' : 'Crear y Agregar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

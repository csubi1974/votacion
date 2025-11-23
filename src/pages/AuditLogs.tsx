import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Shield, Search, Filter, Download, Calendar, User, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
    id: string;
    user?: {
        id: string;
        fullName: string;
        email: string;
        role: string;
    };
    action: string;
    resourceType: string;
    resourceId?: string;
    ipAddress: string;
    createdAt: string;
}

export default function AuditLogs() {
    const { accessToken } = useAuthStore();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        action: '',
        resourceType: '',
        startDate: '',
        endDate: '',
        userId: '',
    });
    const [pagination, setPagination] = useState({
        total: 0,
        limit: 50,
        offset: 0,
        hasMore: false,
    });

    useEffect(() => {
        fetchAuditLogs();
    }, [filters, pagination.offset]);

    const fetchAuditLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();

            if (filters.action) params.append('action', filters.action);
            if (filters.resourceType) params.append('resourceType', filters.resourceType);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.userId) params.append('userId', filters.userId);
            params.append('limit', pagination.limit.toString());
            params.append('offset', pagination.offset.toString());

            const response = await fetch(`/api/audit/logs?${params}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch audit logs');
            }

            const data = await response.json();
            setLogs(data.data);
            setPagination(prev => ({
                ...prev,
                total: data.pagination.total,
                hasMore: data.pagination.hasMore,
            }));
        } catch (error) {
            toast.error('Error al cargar registros de auditoría');
            console.error('Audit logs fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const handleClearFilters = () => {
        setFilters({
            action: '',
            resourceType: '',
            startDate: '',
            endDate: '',
            userId: '',
        });
        setPagination(prev => ({ ...prev, offset: 0 }));
    };

    const handleExport = () => {
        const csvContent = [
            ['Fecha', 'Usuario', 'Acción', 'Tipo de Recurso', 'IP'],
            ...logs.map(log => [
                format(new Date(log.createdAt), 'PPpp', { locale: es }),
                log.user?.fullName || 'N/A',
                log.action,
                log.resourceType,
                log.ipAddress,
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Registros exportados exitosamente');
    };

    const getActionColor = (action: string) => {
        if (action.includes('FAILED') || action.includes('DENIED')) return 'text-red-600 bg-red-50';
        if (action.includes('SUCCESS') || action.includes('CREATED')) return 'text-green-600 bg-green-50';
        if (action.includes('UPDATED')) return 'text-blue-600 bg-blue-50';
        if (action.includes('DELETED')) return 'text-orange-600 bg-orange-50';
        return 'text-gray-600 bg-gray-50';
    };

    const loadMore = () => {
        setPagination(prev => ({
            ...prev,
            offset: prev.offset + prev.limit,
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Shield className="h-8 w-8 text-blue-600" />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Registros de Auditoría</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Historial completo de actividades del sistema
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleExport}
                        disabled={logs.length === 0}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Filtros</h3>
                    <button
                        onClick={handleClearFilters}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Acción
                        </label>
                        <select
                            value={filters.action}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todas</option>
                            <option value="LOGIN_SUCCESS">Login Exitoso</option>
                            <option value="LOGIN_FAILED">Login Fallido</option>
                            <option value="LOGOUT">Logout</option>
                            <option value="VOTE_CAST">Voto Emitido</option>
                            <option value="ELECTION_CREATED">Elección Creada</option>
                            <option value="USER_CREATED">Usuario Creado</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tipo de Recurso
                        </label>
                        <select
                            value={filters.resourceType}
                            onChange={(e) => handleFilterChange('resourceType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Todos</option>
                            <option value="User">Usuario</option>
                            <option value="Election">Elección</option>
                            <option value="Vote">Voto</option>
                            <option value="Organization">Organización</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Fecha Hasta
                        </label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        Registros ({pagination.total})
                    </h3>
                </div>

                {loading && logs.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12">
                        <Activity className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay registros</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            No se encontraron registros con los filtros aplicados.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha/Hora
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acción
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Recurso
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            IP
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                    {format(new Date(log.createdAt), 'PPp', { locale: es })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {log.user ? (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900 flex items-center">
                                                            <User className="h-4 w-4 text-gray-400 mr-2" />
                                                            {log.user.fullName}
                                                        </div>
                                                        <div className="text-sm text-gray-500">{log.user.email}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-500">Sistema</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {log.resourceType}
                                                {log.resourceId && (
                                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                                        ID: {log.resourceId}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.ipAddress}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Load More */}
                        {pagination.hasMore && (
                            <div className="px-6 py-4 border-t border-gray-200 text-center">
                                <button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                >
                                    {loading ? 'Cargando...' : 'Cargar más'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

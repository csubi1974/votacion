import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Eye, Edit, Trash2, Search, BarChart3, Vote } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../stores/authStore';

interface Election {
  id: string;
  title: string;
  description: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  category: string;
  maxVotesPerUser: number;
  isPublic: boolean;
  options: Array<{
    id: string;
    title: string;
  }>;
}

export default function AdminElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { accessToken } = useAuthStore();

  const fetchElections = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/elections?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch elections');
      }

      const data = await response.json();
      setElections(data.data);
      setTotalPages(1);
    } catch (error) {
      toast.error('Error al cargar elecciones');
      console.error('Elections fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken, searchTerm, statusFilter]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections, currentPage]);

  

  const handleDeleteElection = async (electionId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar esta elección?')) {
      return;
    }

    try {
      const response = await fetch(`/api/elections/${electionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete election');
      }

      toast.success('Elección eliminada exitosamente');
      fetchElections();
    } catch (error) {
      toast.error('Error al eliminar elección');
      console.error('Election deletion error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'scheduled':
        return 'Programada';
      case 'completed':
        return 'Finalizada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case 'board_members':
        return 'Miembros del Directorio';
      case 'policy':
        return 'Políticas';
      case 'budget':
        return 'Presupuesto';
      case 'leadership':
        return 'Liderazgo';
      case 'other':
        return 'Otro';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Elecciones</h1>
        <Link
          to="/admin/elections/new"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Nueva Elección
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Buscar
            </label>
            <div className="mt-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Buscar por título o descripción..."
              />
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Estado
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Todos</option>
              <option value="scheduled">Programada</option>
              <option value="active">Activa</option>
              <option value="completed">Finalizada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Elections list */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Elecciones</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {elections.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Vote className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay elecciones</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva elección.</p>
            </div>
          ) : (
            elections.map((election) => (
              <div key={election.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">{election.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{election.description}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-400">
                        {new Date(election.startDate).toLocaleDateString('es-CL')} - {new Date(election.endDate).toLocaleDateString('es-CL')}
                      </span>
                      <span className="text-xs text-gray-400">
                        {getCategoryText(election.category)}
                      </span>
                      <span className="text-xs text-gray-400">
                        Máx. votos: {election.maxVotesPerUser}
                      </span>
                      {election.options && (
                        <span className="text-xs text-gray-400">
                          {election.options.length} opciones
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(election.status)}`}>
                      {getStatusText(election.status)}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/admin/elections/${election.id}/results`}
                        className="text-green-600 hover:text-green-800"
                        title="Ver resultados"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/admin/elections/${election.id}`}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalles"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <button className="text-gray-600 hover:text-gray-800" title="Editar">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteElection(election.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  Siguiente
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
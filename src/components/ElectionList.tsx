import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Plus, Calendar, Clock, Users, Edit, Trash2, Play, Square } from 'lucide-react';

interface ElectionOption {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  orderIndex: number;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  category: 'board_members' | 'policy' | 'budget' | 'leadership' | 'other';
  maxVotesPerUser: number;
  isPublic: boolean;
  options: ElectionOption[];
  createdAt: string;
  updatedAt: string;
}

export default function ElectionList() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const { accessToken } = useAuthStore();

  const categoryLabels = {
    board_members: 'Miembros de Junta',
    policy: 'Políticas',
    budget: 'Presupuesto',
    leadership: 'Liderazgo',
    other: 'Otro',
  };

  const statusLabels = {
    scheduled: 'Programada',
    active: 'Activa',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-800',
    active: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const fetchElections = useCallback(async () => {
    try {
      const response = await fetch('/api/elections', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar elecciones');
      }

      const data = await response.json();
      setElections(data.data);
    } catch (error) {
      toast.error('Error al cargar las elecciones');
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  

  const handleDelete = async (electionId: string) => {
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
        throw new Error('Error al eliminar elección');
      }

      toast.success('Elección eliminada exitosamente');
      fetchElections();
    } catch (error) {
      toast.error('Error al eliminar la elección');
      console.error('Error deleting election:', error);
    }
  };

  const handleStartElection = async (electionId: string) => {
    try {
      const response = await fetch(`/api/elections/${electionId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al iniciar elección');
      }

      toast.success('Elección iniciada exitosamente');
      fetchElections();
    } catch (error) {
      toast.error('Error al iniciar la elección');
      console.error('Error starting election:', error);
    }
  };

  const handleEndElection = async (electionId: string) => {
    if (!confirm('¿Está seguro de que desea finalizar esta elección?')) {
      return;
    }

    try {
      const response = await fetch(`/api/elections/${electionId}/end`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al finalizar elección');
      }

      toast.success('Elección finalizada exitosamente');
      fetchElections();
    } catch (error) {
      toast.error('Error al finalizar la elección');
      console.error('Error ending election:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Elecciones</h2>
        <button
          onClick={() => window.location.href = '/admin/elections/new'}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Elección</span>
        </button>
      </div>

      {elections.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay elecciones</h3>
          <p className="text-gray-500">Crea tu primera elección para comenzar.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {elections.map((election) => (
            <div key={election.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {election.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[election.status]}`}>
                    {statusLabels[election.status]}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {election.description}
                </p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>
                      {format(new Date(election.startDate), 'PPP', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>
                      {format(new Date(election.endDate), 'PPP', { locale: es })}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-2" />
                    <span>
                      {election.options.length} opciones • Máx. {election.maxVotesPerUser} voto(s)
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Categoría: {categoryLabels[election.category]}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    {election.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartElection(election.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Iniciar elección"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {election.status === 'active' && (
                      <button
                        onClick={() => handleEndElection(election.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Finalizar elección"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => window.location.href = `/admin/elections/${election.id}/edit`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar elección"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {election.status !== 'active' && election.status !== 'completed' && (
                      <button
                        onClick={() => handleDelete(election.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Eliminar elección"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => window.location.href = `/admin/elections/${election.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
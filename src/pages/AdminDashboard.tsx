import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Users, Vote, TrendingUp, Calendar, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  totalUsers: number;
  totalElections: number;
  activeElections: number;
  totalVotes: number;
}

interface RecentElection {
  id: string | number;
  title: string;
  startDate: string;
  endDate: string;
}

interface RecentUser {
  id: string | number;
  fullName: string;
  email: string;
}

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentElections, setRecentElections] = useState<RecentElection[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data.data.stats);
      setRecentElections(data.data.recentElections);
      setRecentUsers(data.data.recentUsers);
    } catch (error) {
      toast.error('Error al cargar datos del dashboard');
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL');
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
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="mt-2 text-gray-600">
          Panel de administración del sistema de votación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Vote className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Elecciones</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalElections || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Elecciones Activas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.activeElections || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Votos</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats?.totalVotes || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Elecciones Recientes</h3>
              <Link
                to="/admin/elections"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentElections.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Vote className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay elecciones</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza creando una nueva elección.</p>
              </div>
            ) : (
              recentElections.map((election) => (
                <div key={election.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{election.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(election.startDate)} - {formatDate(election.endDate)}
                      </p>
                    </div>
                    <Link
                      to={`/admin/elections/${election.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Usuarios Recientes</h3>
              <Link
                to="/admin/users"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
                <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo usuario.</p>
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-gray-900">{user.fullName}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
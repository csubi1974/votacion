import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Users, Vote, TrendingUp, Calendar, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import ParticipationChart from '../components/ParticipationChart';

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
  const { user, accessToken } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentElections, setRecentElections] = useState<RecentElection[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (accessToken) {
      fetchDashboardData();
      fetchChartData();
    }
  }, [accessToken, period]);

  const fetchChartData = async () => {
    try {
      const response = await fetch(`/api/admin/stats/participation?period=${period}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setChartData(data.data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/stats/export', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-votacion-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte descargado correctamente');
      }
    } catch (error) {
      toast.error('Error al exportar reporte');
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-white">
          Bienvenido, {user?.fullName}
        </h1>
        <p className="mt-2 text-gray-400">
          Panel de administración del sistema de votación
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Users className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Usuarios</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalUsers || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Vote className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Elecciones</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalElections || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp className="h-8 w-8 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Elecciones Activas</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.activeElections || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <Calendar className="h-8 w-8 text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Votos</p>
              <p className="text-2xl font-semibold text-white">
                {stats?.totalVotes || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Participation Chart Section */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white">Participación en el Tiempo</h2>
          <div className="flex items-center space-x-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="block w-32 rounded-xl border-slate-600 bg-slate-900/50 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="24h">Últimas 24h</option>
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
            </select>
            <button
              onClick={handleExport}
              className="inline-flex items-center px-4 py-2 border border-slate-600 rounded-xl shadow-sm text-sm font-medium text-gray-300 bg-slate-900/50 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Reporte
            </button>
          </div>
        </div>
        <ParticipationChart data={chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Elecciones Recientes</h3>
              <Link
                to="/admin/elections"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Ver todas
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700">
            {recentElections.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Vote className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-white">No hay elecciones</h3>
                <p className="mt-1 text-sm text-gray-400">Comienza creando una nueva elección.</p>
              </div>
            ) : (
              recentElections.map((election) => (
                <div key={election.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-white">{election.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">
                        {formatDate(election.startDate)} - {formatDate(election.endDate)}
                      </p>
                    </div>
                    <Link
                      to={`/admin/elections/${election.id}`}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <Eye className="h-5 w-5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-white">Usuarios Recientes</h3>
              <Link
                to="/admin/users"
                className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-700">
            {recentUsers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Users className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-white">No hay usuarios</h3>
                <p className="mt-1 text-sm text-gray-400">Comienza creando un nuevo usuario.</p>
              </div>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <span className="text-sm font-medium text-white">
                            {user.fullName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h4 className="text-sm font-medium text-white">{user.fullName}</h4>
                        <p className="text-sm text-gray-400">{user.email}</p>
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
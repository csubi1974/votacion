import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Users, Vote, BarChart3, Settings, Shield, Download } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { toast } from 'sonner';
import ParticipationChart from '../components/ParticipationChart';

interface DashboardStats {
  activeElections: number;
  totalUsers: number;
  totalVotes: number;
  participationRate: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, accessToken } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    activeElections: 0,
    totalUsers: 0,
    totalVotes: 0,
    participationRate: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('24h');
  const [loading, setLoading] = useState(true);

  const fetchChartData = async () => {
    if (!['admin', 'super_admin'].includes(user?.role || '')) return;

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
        // Create a simple JSON download for now (can be enhanced to PDF later)
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (['admin', 'super_admin'].includes(user?.role || '')) {
          const response = await fetch('/api/admin/dashboard', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const { totalUsers, activeElections, totalVotes } = data.data.stats;

            // Calculate participation rate
            const participationRate = totalUsers > 0
              ? Math.round((totalVotes / totalUsers) * 100)
              : 0;

            setStats({
              activeElections,
              totalUsers,
              totalVotes,
              participationRate,
            });
          }
        } else {
          // For voters, fetch available elections count
          const response = await fetch('/api/voting/available', {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setStats({
              activeElections: data.data.length,
              totalUsers: 0, // Hidden for voters
              totalVotes: 0, // Hidden for voters
              participationRate: 0, // Hidden for voters
            });
          }
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchStats();
      if (['admin', 'super_admin'].includes(user?.role || '')) {
        fetchChartData();
      }
    }
  }, [accessToken, period, user?.role]);

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada exitosamente');
    navigate('/');
  };

  const menuItems = [
    {
      title: 'Votaciones Disponibles',
      description: 'Ver y participar en votaciones activas',
      icon: Vote,
      href: '/voting',
      color: 'bg-blue-500',
      roles: ['voter', 'admin', 'super_admin'],
    },
    {
      title: 'Resultados',
      description: 'Ver resultados de votaciones finalizadas',
      icon: BarChart3,
      href: '/results',
      color: 'bg-green-500',
      roles: ['voter', 'admin', 'super_admin'],
    },
    {
      title: 'Gestión de Usuarios',
      description: 'Administrar usuarios del sistema',
      icon: Users,
      href: '/admin/users',
      color: 'bg-purple-500',
      roles: ['admin', 'super_admin'],
    },
    {
      title: 'Gestión de Elecciones',
      description: 'Crear y gestionar elecciones',
      icon: Settings,
      href: '/admin/elections',
      color: 'bg-orange-500',
      roles: ['admin', 'super_admin'],
    },
    {
      title: 'Panel de Administración',
      description: 'Configuración del sistema',
      icon: Shield,
      href: '/admin/dashboard',
      color: 'bg-red-500',
      roles: ['super_admin'],
    },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.roles.includes(user?.role || 'voter')
  );

  return (
    <div>
      {/* Welcome Message */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          ¡Bienvenido, {user?.fullName}!
        </h2>
        <p className="text-gray-400">
          Selecciona una opción del menú para comenzar.
        </p>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map((item, index) => (
          <div
            key={index}
            onClick={() => navigate(item.href)}
            className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg hover:shadow-2xl hover:border-blue-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${item.color} bg-opacity-20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-6 h-6 ${item.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{item.title}</h3>
                </div>
              </div>
              <p className="text-gray-400 text-sm">{item.description}</p>
            </div>
            <div className="px-6 py-3 bg-white/5 border-t border-slate-700 group-hover:bg-blue-500/10 transition-colors">
              <span className="text-blue-400 font-medium text-sm group-hover:text-blue-300 flex items-center">
                Acceder <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Vote className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-400">Votaciones Activas</h3>
              <p className="text-3xl font-bold text-white mt-1">
                {loading ? '...' : stats.activeElections}
              </p>
            </div>
          </div>
        </div>

        {['admin', 'super_admin'].includes(user?.role || '') && (
          <>
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-400">Total Usuarios</h3>
                  <p className="text-3xl font-bold text-white mt-1">
                    {loading ? '...' : stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-400">Participación</h3>
                  <p className="text-3xl font-bold text-white mt-1">
                    {loading ? '...' : `${stats.participationRate}%`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
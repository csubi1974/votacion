import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, Users, Vote, BarChart3, Settings, Shield } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { toast } from 'sonner';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
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
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (accessToken) {
      fetchStats();
    }
  }, [accessToken]);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Vote className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Plataforma de Votación</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
              >
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {user?.fullName?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium hidden sm:block">{user?.fullName}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Message */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Bienvenido, {user?.fullName}!
            </h2>
            <p className="text-gray-600">
              Selecciona una opción del menú para comenzar.
            </p>
          </div>

          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(item.href)}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                <div className="px-6 py-3 bg-gray-50 rounded-b-lg">
                  <span className="text-blue-600 font-medium text-sm hover:text-blue-800">
                    Acceder →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Vote className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Votaciones Activas</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.activeElections}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Total Usuarios</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : stats.totalUsers}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BarChart3 className="w-8 h-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Participación</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {loading ? '...' : `${stats.participationRate}%`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
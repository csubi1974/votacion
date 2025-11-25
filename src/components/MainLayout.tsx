import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import {
    BarChart3,
    Users,
    LogOut,
    Menu,
    X,
    Vote,
    FileText,
    Upload,
    Building2,
    TrendingUp,
    User,
    Home
} from 'lucide-react';
import { toast } from 'sonner';

export default function MainLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Sesión cerrada exitosamente');
            navigate('/login');
        } catch {
            toast.error('Error al cerrar sesión');
        }
    };

    // Define navigation items based on user role
    const getNavigationItems = () => {
        const baseItems = [
            { name: 'Dashboard', href: '/dashboard', icon: Home, roles: ['voter', 'admin', 'super_admin'] },
        ];

        const adminDashboardItems = [
            { name: 'Estadísticas', href: '/admin', icon: BarChart3, roles: ['admin', 'super_admin'] },
        ];

        const voterItems = [
            { name: 'Votar', href: '/voting', icon: Vote, roles: ['voter', 'admin', 'super_admin'] },
            { name: 'Resultados', href: '/results', icon: TrendingUp, roles: ['voter', 'admin', 'super_admin'] },
        ];

        const adminItems = [
            { name: 'Organizaciones', href: '/admin/organizations', icon: Building2, roles: ['super_admin'] },
            { name: 'Usuarios', href: '/admin/users', icon: Users, roles: ['admin', 'super_admin'] },
            { name: 'Importar Usuarios', href: '/admin/bulk-import', icon: Upload, roles: ['admin', 'super_admin'] },
            { name: 'Elecciones', href: '/admin/elections', icon: Vote, roles: ['admin', 'super_admin'] },
            { name: 'Auditoría', href: '/admin/audit', icon: FileText, roles: ['admin', 'super_admin'] },
        ];

        const profileItems = [
            { name: 'Mi Perfil', href: '/profile', icon: User, roles: ['voter', 'admin', 'super_admin'] },
        ];

        // Combine all items
        const allItems = [...baseItems, ...adminDashboardItems, ...voterItems, ...adminItems, ...profileItems];

        // Filter by user role
        return allItems.filter(item => item.roles.includes(user?.role || 'voter'));
    };

    const navigation = getNavigationItems();

    const isActive = (path: string) => {
        if (path === '/dashboard') {
            return location.pathname === path;
        }
        if (path === '/admin') {
            return location.pathname === path || location.pathname === '/admin/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    const getRoleName = (role: string | undefined) => {
        switch (role) {
            case 'super_admin':
                return 'Super Administrador';
            case 'admin':
                return 'Administrador';
            case 'voter':
                return 'Votante';
            default:
                return 'Usuario';
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <Link to="/dashboard" className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
                                <Vote className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold text-gray-900">VotApp</h1>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 mt-6 px-4 overflow-y-auto pb-32">
                        <ul className="space-y-1">
                            {navigation.map((item) => (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive(item.href)
                                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User section */}
                    <div className="absolute bottom-0 w-full border-t border-gray-200 bg-white">
                        <div className="p-4 space-y-3">
                            <div className="flex items-center space-x-3 px-2">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                                        <span className="text-sm font-semibold text-white">
                                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        {user?.fullName || 'Usuario'}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate">
                                        {getRoleName(user?.role)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <div className="sticky top-0 z-40 bg-white shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-semibold text-gray-900 capitalize">
                                {location.pathname === '/dashboard'
                                    ? 'Dashboard'
                                    : location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user?.organizationName && (
                                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    🏢 {user.organizationName}
                                </span>
                            )}
                            <span className="text-sm text-gray-500 hidden md:block">
                                {new Date().toLocaleDateString('es-CL', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="py-6">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}

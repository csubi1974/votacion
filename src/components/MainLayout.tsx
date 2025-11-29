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
            navigate('/');
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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                </div>
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/90 backdrop-blur-xl border-r border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-slate-700/50">
                        <Link to="/dashboard" className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Vote className="h-6 w-6 text-white" />
                            </div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">VotApp</h1>
                        </Link>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
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
                                        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${isActive(item.href)
                                            ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-400 border border-blue-500/20'
                                            : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 h-5 w-5 ${isActive(item.href) ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-300'
                                                }`}
                                        />
                                        {item.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </nav>

                    {/* User section */}
                    <div className="absolute bottom-0 w-full border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
                        <div className="p-4 space-y-3">
                            <div className="flex items-center space-x-3 px-2">
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                        <span className="text-sm font-semibold text-white">
                                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user?.fullName || 'Usuario'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {getRoleName(user?.role)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium text-gray-300 bg-white/5 border border-slate-700 rounded-xl hover:bg-white/10 hover:text-white hover:border-slate-600 transition-all duration-200"
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
                <div className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/5"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <div className="flex items-center space-x-4">
                            <h2 className="text-lg font-semibold text-white capitalize">
                                {location.pathname === '/dashboard'
                                    ? 'Dashboard'
                                    : location.pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Dashboard'}
                            </h2>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user?.organizationName && (
                                <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    🏢 {user.organizationName}
                                </span>
                            )}
                            <span className="text-sm text-gray-400 hidden md:block">
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

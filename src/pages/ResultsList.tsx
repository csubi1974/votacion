import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { BarChart3, Calendar, Users, ArrowLeft, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Election {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    category: string;
    maxVotesPerUser: number;
    isPublic: boolean;
    options: Array<{
        id: string;
        text: string;
        imageUrl?: string;
    }>;
}

export default function ResultsList() {
    const { accessToken } = useAuthStore();
    const [elections, setElections] = useState<Election[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCompletedElections = async () => {
            try {
                const response = await fetch('/api/voting/completed', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                    },
                });

                if (!response.ok) {
                    throw new Error('Error al cargar elecciones completadas');
                }

                const data = await response.json();
                setElections(data.data);
            } catch (error) {
                toast.error('Error al cargar las elecciones completadas');
                console.error('Error fetching completed elections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCompletedElections();
    }, [accessToken]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="mb-8">
                <Link
                    to="/dashboard"
                    className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Volver al Dashboard
                </Link>

                <div className="flex items-center mb-2">
                    <BarChart3 className="w-8 h-8 text-green-600 mr-3" />
                    <h1 className="text-3xl font-bold text-gray-900">Resultados de Votaciones</h1>
                </div>
                <p className="text-gray-600">Consulta los resultados de las votaciones finalizadas</p>
            </div>

            {elections.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
                    <BarChart3 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados disponibles</h3>
                    <p className="text-gray-500">Actualmente no hay elecciones completadas para mostrar.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {elections.map((election) => (
                        <Link
                            key={election.id}
                            to={`/results/${election.id}`}
                            className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                                        {election.title}
                                    </h3>
                                    <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium flex items-center">
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        Finalizada
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                                    {election.description}
                                </p>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        <span>
                                            Finalizó: {format(new Date(election.endDate), 'PPP', { locale: es })}
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Users className="w-4 h-4 mr-2" />
                                        <span>
                                            {election.options.length} opciones
                                        </span>
                                    </div>
                                </div>

                                <div className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-lg font-medium transition-all duration-300 shadow-md hover:shadow-lg text-center">
                                    Ver Resultados
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

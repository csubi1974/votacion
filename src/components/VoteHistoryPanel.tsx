import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';
import { toast } from 'sonner';

interface VoteHistory {
    id: string;
    electionTitle: string;
    electionDescription: string;
    selectedOptions: string[];
    votedAt: string;
    electionCategory: string;
}

export default function VoteHistoryPanel() {
    const { accessToken } = useAuthStore();
    const [voteHistory, setVoteHistory] = useState<VoteHistory[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchVoteHistory();
    }, []);

    const fetchVoteHistory = async () => {
        try {
            const response = await fetch('/api/voting/history', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                throw new Error('Error al cargar historial');
            }

            const data = await response.json();
            setVoteHistory(data.data || []);
        } catch (error) {
            toast.error('Error al cargar tu historial de votos');
            console.error('Error fetching vote history:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (voteHistory.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12 bg-white rounded-lg shadow-md border border-gray-200">
                    <Award className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No has votado aún</h3>
                    <p className="text-gray-500">Tu historial de votaciones aparecerá aquí.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <TrendingUp className="w-8 h-8 mr-3 text-blue-600" />
                    Mi Historial de Votos
                </h1>
                <p className="text-gray-600">Has participado en {voteHistory.length} elección(es)</p>
            </div>

            <div className="space-y-4">
                {voteHistory.map((vote) => (
                    <div
                        key={vote.id}
                        className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {vote.electionTitle}
                                </h3>
                                <p className="text-sm text-gray-600 mb-3">{vote.electionDescription}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span>
                                            Votado el {format(new Date(vote.votedAt), 'PPP p', { locale: es })}
                                        </span>
                                    </div>
                                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                        {vote.electionCategory}
                                    </span>
                                </div>
                            </div>
                            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="text-xs font-medium text-green-800 mb-2">Tu selección:</p>
                            <ul className="space-y-1">
                                {vote.selectedOptions.map((option, index) => (
                                    <li key={index} className="text-sm text-green-700 flex items-center">
                                        <CheckCircle className="w-3 h-3 mr-2" />
                                        {option}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { TrendingUp, Users, Calendar, ArrowLeft, Download, FileText, FileSpreadsheet, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { exportToPDF, exportToExcel, exportToCSV } from '../utils/exportResults';
import { useAuthStore } from '../stores/authStore';
import { io } from 'socket.io-client';

interface ElectionResult {
  election: {
    id: number;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  results: Array<{
    optionId: number;
    text: string;
    votes: number;
    percentage: number;
  }>;
  totalVotes: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export default function ElectionResults() {
  const { id } = useParams<{ id: string }>();
  const { accessToken } = useAuthStore();
  const [results, setResults] = useState<ElectionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchResults = async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/admin/elections/${id}/results`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch election results');
      }

      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error('Election results fetch error:', error);
      toast.error('Error al actualizar resultados');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchResults();
  }, [id, accessToken]);

  // Socket connection
  useEffect(() => {
    if (!id) return;

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      setIsConnected(true);
      socket.emit('join_election', id);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('vote_update', (data) => {
      console.log('New vote received:', data);
      toast.info('¡Nuevo voto registrado! Actualizando resultados...', {
        duration: 2000,
        icon: '🗳️'
      });
      fetchResults();
    });

    return () => {
      socket.emit('leave_election', id);
      socket.disconnect();
    };
  }, [id]);



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No se encontraron resultados para esta elección.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/admin/elections" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{results.election.title}</h1>
                {isConnected && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                    <Activity className="w-3 h-3 mr-1" />
                    En vivo
                  </span>
                )}
              </div>
              <p className="text-gray-500 mt-1">{results.election.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                exportToPDF(results);
                toast.success('PDF generado exitosamente');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <FileText className="-ml-0.5 mr-2 h-4 w-4" />
              Exportar PDF
            </button>
            <button
              onClick={() => {
                exportToExcel(results);
                toast.success('Excel generado exitosamente');
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <FileSpreadsheet className="-ml-0.5 mr-2 h-4 w-4" />
              Exportar Excel
            </button>
            <button
              onClick={() => {
                exportToCSV(results);
                toast.success('CSV generado exitosamente');
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <Download className="-ml-0.5 mr-2 h-4 w-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="text-sm font-medium">
                {formatDate(results.election.startDate)} - {formatDate(results.election.endDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <Users className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Total de Votos</p>
              <p className="text-sm font-medium">{results.totalVotes}</p>
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-gray-400 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className="text-sm font-medium capitalize">{results.election.status}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Resultados por Opción</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results.results}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="text" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="votes" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución de Votos</h3>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <div className="h-64 w-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={results.results}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="votes"
                  >
                    {results.results.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col space-y-2">
              {results.results.map((result, index) => (
                <div key={result.optionId} className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">
                    {result.text}: <span className="font-semibold">{result.percentage.toFixed(1)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Results Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detalle de Resultados</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Votos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Porcentaje
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.results.map((result) => (
                <tr key={result.optionId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{result.text}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.votes}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{result.percentage.toFixed(2)}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${result.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
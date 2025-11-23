import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { CheckCircle, Clock, Users, ArrowLeft, Check, X } from 'lucide-react';

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
  category: string;
  maxVotesPerUser: number;
  isPublic: boolean;
  options: ElectionOption[];
  createdAt: string;
  updatedAt: string;
}

export default function VotingInterface() {
  const { accessToken } = useAuthStore();
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm'>('select');
  const [validating, setValidating] = useState(false);

  const fetchAvailableElections = useCallback(async () => {
    try {
      const response = await fetch('/api/voting/available', {
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
      toast.error('Error al cargar las elecciones disponibles');
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    fetchAvailableElections();
  }, [fetchAvailableElections]);

  

  const fetchElectionDetails = async (electionId: string) => {
    try {
      const response = await fetch(`/api/voting/elections/${electionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar detalles de la elección');
      }

      const data = await response.json();
      setSelectedElection(data.data.election);
      setHasVoted(data.data.hasVoted);
    } catch (error) {
      toast.error('Error al cargar los detalles de la elección');
      console.error('Error fetching election details:', error);
    }
  };

  const handleElectionSelect = (election: Election) => {
    setSelectedElection(election);
    fetchElectionDetails(election.id);
  };

  const handleOptionToggle = (optionId: string) => {
    if (!selectedElection) return;

    setSelectedOptions(prev => {
      if (prev.includes(optionId)) {
        return prev.filter(id => id !== optionId);
      } else {
        if (selectedElection.maxVotesPerUser === 1) {
          return [optionId];
        } else if (prev.length >= selectedElection.maxVotesPerUser) {
          toast.error(`Solo puedes votar por ${selectedElection.maxVotesPerUser} opción(es)`);
          return prev;
        } else {
          return [...prev, optionId];
        }
      }
    });
  };

  const handleValidateVote = async () => {
    if (selectedOptions.length === 0) {
      toast.error('Debes seleccionar al menos una opción');
      return;
    }

    if (!selectedElection) return;

    try {
      setValidating(true);
      const response = await fetch('/api/voting/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          electionId: selectedElection.id,
          optionIds: selectedOptions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al validar el voto');
      }

      setStep('confirm');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al validar el voto');
      console.error('Error validating vote:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleCastVote = async () => {
    if (!selectedElection) return;

    try {
      setValidating(true);
      const response = await fetch('/api/voting/cast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          electionId: selectedElection.id,
          optionIds: selectedOptions,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al registrar el voto');
      }

      toast.success('¡Voto registrado exitosamente!');
      setHasVoted(true);
      setStep('select');
      setSelectedOptions([]);
      fetchAvailableElections();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al registrar el voto');
      console.error('Error casting vote:', error);
    } finally {
      setValidating(false);
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('select');
    } else {
      setSelectedElection(null);
      setSelectedOptions([]);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!selectedElection) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Votaciones Disponibles</h1>
          <p className="text-gray-600">Selecciona una elección para votar</p>
        </div>

        {elections.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay elecciones activas</h3>
            <p className="text-gray-500">Actualmente no hay elecciones disponibles para votar.</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {elections.map((election) => (
              <div
                key={election.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleElectionSelect(election)}
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {election.title}
                    </h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Activa
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {election.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        Finaliza: {format(new Date(election.endDate), 'PPP p', { locale: es })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {election.options.length} opciones • Máx. {election.maxVotesPerUser} voto(s)
                      </span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Votar Ahora
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a elecciones
        </button>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{selectedElection.title}</h1>
            <div className="flex items-center space-x-2">
              {hasVoted && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ✓ Ya votaste
                </span>
              )}
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Activa
              </span>
            </div>
          </div>

          <p className="text-gray-600 mb-4">{selectedElection.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Finaliza: {format(new Date(selectedElection.endDate), 'PPP p', { locale: es })}</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              <span>Máx. {selectedElection.maxVotesPerUser} voto(s) por usuario</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span>{selectedElection.options.length} opciones</span>
            </div>
          </div>
        </div>
      </div>

      {hasVoted ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-green-900 mb-2">¡Ya has votado en esta elección!</h3>
          <p className="text-green-700">Gracias por participar en el proceso democrático.</p>
        </div>
      ) : (
        <>
          {step === 'select' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Selecciona tus opciones ({selectedOptions.length}/{selectedElection.maxVotesPerUser})
                </h2>

                <div className="space-y-3">
                  {selectedElection.options.map((option) => (
                    <div
                      key={option.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedOptions.includes(option.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleOptionToggle(option.id)}
                    >
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            checked={selectedOptions.includes(option.id)}
                            onChange={() => handleOptionToggle(option.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{option.title}</h3>
                          {option.description && (
                            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleValidateVote}
                  disabled={selectedOptions.length === 0 || validating}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {validating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Validando...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuar</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <CheckCircle className="w-6 h-6 text-yellow-600 mr-3" />
                  <h2 className="text-lg font-semibold text-yellow-900">Confirma tu voto</h2>
                </div>
                <p className="text-yellow-800 mb-4">
                  Por favor, revisa cuidadosamente tu selección antes de confirmar. Una vez emitido, tu voto no podrá ser modificado.
                </p>

                <div className="bg-white rounded-lg border border-yellow-200 p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Has seleccionado:</h3>
                  <ul className="space-y-2">
                    {selectedOptions.map((optionId) => {
                      const option = selectedElection.options.find(opt => opt.id === optionId);
                      return (
                        <li key={optionId} className="flex items-center text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-600 mr-2" />
                          {option?.title}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleBack}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleCastVote}
                  disabled={validating}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
                >
                  {validating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Registrando...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirmar Voto</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
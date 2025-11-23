import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Plus, X, Upload } from 'lucide-react';

interface ElectionOption {
  id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  orderIndex: number;
}

interface ElectionFormData {
  title: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  category: 'board_members' | 'policy' | 'budget' | 'leadership' | 'other';
  maxVotesPerUser: number;
  isPublic: boolean;
  options: ElectionOption[];
}

export default function ElectionForm() {
  const { accessToken } = useAuthStore();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState<ElectionFormData>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    category: 'other',
    maxVotesPerUser: 1,
    isPublic: false,
    options: [
      { title: '', description: '', orderIndex: 0 },
      { title: '', description: '', orderIndex: 1 },
    ],
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchElection = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/elections/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar elección');
      }

      const data = await response.json();
      const election = data.data as {
        title: string;
        description: string;
        startDate: string;
        endDate: string;
        category: ElectionFormData['category'];
        maxVotesPerUser: number;
        isPublic: boolean;
        options: Array<{ id: string; text: string; description?: string; imageUrl?: string }>;
      };

      const startDate = new Date(election.startDate);
      const endDate = new Date(election.endDate);

      setFormData({
        title: election.title,
        description: election.description,
        startDate: format(startDate, 'yyyy-MM-dd'),
        startTime: format(startDate, 'HH:mm'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        endTime: format(endDate, 'HH:mm'),
        category: election.category,
        maxVotesPerUser: election.maxVotesPerUser,
        isPublic: election.isPublic,
        options: election.options.map((opt, index) => ({
          id: opt.id,
          title: opt.text,
          description: opt.description || '',
          imageUrl: opt.imageUrl || '',
          orderIndex: index,
        })),
      });
    } catch (error) {
      toast.error('Error al cargar la elección');
      console.error('Error fetching election:', error);
      navigate('/admin/elections');
    } finally {
      setLoading(false);
    }
  }, [id, accessToken, navigate]);

  useEffect(() => {
    if (isEditing) {
      fetchElection();
    }
  }, [isEditing, fetchElection]);

  

  const handleInputChange = (field: keyof ElectionFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, field: keyof ElectionOption, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [
        ...prev.options,
        { title: '', description: '', orderIndex: prev.options.length },
      ],
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length <= 2) {
      toast.error('Debe haber al menos 2 opciones');
      return;
    }

    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index).map((opt, i) => ({
        ...opt,
        orderIndex: i,
      })),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error('El título es requerido');
      return false;
    }

    if (!formData.description.trim()) {
      toast.error('La descripción es requerida');
      return false;
    }

    if (!formData.startDate || !formData.startTime) {
      toast.error('La fecha y hora de inicio son requeridas');
      return false;
    }

    if (!formData.endDate || !formData.endTime) {
      toast.error('La fecha y hora de fin son requeridas');
      return false;
    }

    // Validar fechas
    const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (startDateTime >= endDateTime) {
      toast.error('La fecha de fin debe ser posterior a la fecha de inicio');
      return false;
    }

    if (startDateTime < new Date()) {
      toast.error('La fecha de inicio debe ser futura');
      return false;
    }

    // Validar opciones
    const validOptions = formData.options.filter(opt => opt.title.trim());
    if (validOptions.length < 2) {
      toast.error('Debe proporcionar al menos 2 opciones con título');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        category: formData.category,
        maxVotesPerUser: formData.maxVotesPerUser,
        isPublic: formData.isPublic,
        options: formData.options
          .filter(opt => opt.title.trim())
          .map(opt => ({
            title: opt.title.trim(),
            description: opt.description?.trim() || '',
            imageUrl: opt.imageUrl?.trim() || '',
          })),
      };

      const url = isEditing ? `/api/elections/${id}` : '/api/elections';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar elección');
      }

      toast.success(isEditing ? 'Elección actualizada exitosamente' : 'Elección creada exitosamente');
      navigate('/admin/elections');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al guardar la elección');
      console.error('Error saving election:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Editar Elección' : 'Nueva Elección'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Información General</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ingrese el título de la elección"
                maxLength={200}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describa los detalles de la elección"
                rows={4}
                maxLength={2000}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="board_members">Miembros de Junta</option>
                  <option value="policy">Políticas</option>
                  <option value="budget">Presupuesto</option>
                  <option value="leadership">Liderazgo</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Votos máximos por usuario
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.maxVotesPerUser}
                  onChange={(e) => handleInputChange('maxVotesPerUser', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Hacer pública esta elección
              </label>
            </div>
          </div>

          {/* Fechas y horas */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Período de Votación</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Inicio *
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleInputChange('startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={formData.startDate || format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Fin *
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange('endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Opciones */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Opciones de Votación *</h3>
              <button
                type="button"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar opción</span>
              </button>
            </div>

            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      Opción {index + 1}
                    </span>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Título *
                      </label>
                      <input
                        type="text"
                        value={option.title}
                        onChange={(e) => handleOptionChange(index, 'title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ingrese el título de la opción"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Descripción
                      </label>
                      <textarea
                        value={option.description}
                        onChange={(e) => handleOptionChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describa esta opción (opcional)"
                        rows={2}
                        maxLength={500}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Imagen (URL)
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="url"
                          value={option.imageUrl}
                          onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://ejemplo.com/imagen.jpg"
                        />
                        <button
                          type="button"
                          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-1"
                        >
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Subir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/admin/elections')}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <span className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </span>
              ) : (
                isEditing ? 'Actualizar Elección' : 'Crear Elección'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
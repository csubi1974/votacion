import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader2, CheckCircle, ArrowLeft, Vote, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '../stores/authStore';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();

  const [formData, setFormData] = useState({
    rut: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    organizationId: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const validatePassword = (password: string) => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Una mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Una minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Un número');
    }
    if (!/[@$!%*?&.\-_#]/.test(password)) {
      errors.push('Un carácter especial');
    }

    setPasswordErrors(errors);
    setPasswordStrength(errors.length === 0 ? 4 : Math.max(0, 4 - errors.length));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'password') {
      validatePassword(value);
    }

    if (error) clearError();
  };

  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
    if (clean.length === 0) return '';
    if (clean.length === 1) return clean;
    const body = clean.slice(0, -1);
    const verifier = clean.slice(-1);
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${formattedBody}-${verifier}`;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData(prev => ({
      ...prev,
      rut: formatted,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (passwordErrors.length > 0) {
      toast.error('La contraseña no cumple con los requisitos mínimos');
      return;
    }

    try {
      const dataToSubmit = formData.organizationId
        ? formData
        : { ...formData, organizationId: undefined };

      await register(dataToSubmit);
      toast.success('Registro exitoso! Por favor verifica tu email.');
      navigate('/login');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-600';
    if (passwordStrength === 1) return 'bg-red-500';
    if (passwordStrength === 2) return 'bg-orange-500';
    if (passwordStrength === 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength === 1) return 'Muy débil';
    if (passwordStrength === 2) return 'Débil';
    if (passwordStrength === 3) return 'Aceptable';
    return 'Fuerte';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>

      <div className="max-w-2xl w-full relative">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-gray-400 hover:text-white flex items-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </button>

        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Crear Cuenta</h2>
            <p className="text-gray-400">Completa el formulario para registrarte</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div>
                <label htmlFor="rut" className="block text-sm font-medium text-gray-300 mb-2">
                  RUT
                </label>
                <input
                  type="text"
                  id="rut"
                  name="rut"
                  value={formData.rut}
                  onChange={handleRutChange}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="12.345.678-9"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="tu@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="organizationId" className="block text-sm font-medium text-gray-300 mb-2">
                ID de Organización <span className="text-gray-500">(Opcional)</span>
              </label>
              <input
                type="text"
                id="organizationId"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                placeholder="Deja en blanco para usar organización por defecto"
              />
              <p className="mt-2 text-xs text-gray-500">
                Si no tienes un ID de organización, se te asignará una por defecto
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>

              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400">Fortaleza de la contraseña</span>
                    <span className={`text-xs font-medium ${passwordStrength === 4 ? 'text-green-400' :
                        passwordStrength === 3 ? 'text-yellow-400' :
                          'text-red-400'
                      }`}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition-colors ${level <= passwordStrength ? getStrengthColor() : 'bg-slate-700'
                          }`}
                      />
                    ))}
                  </div>
                  {passwordErrors.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-gray-400">Requisitos faltantes:</p>
                      {passwordErrors.map((error, index) => (
                        <div key={index} className="flex items-center text-xs text-red-400">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-300"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-2 text-xs text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Las contraseñas no coinciden
                </p>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <p className="mt-2 text-xs text-green-400 flex items-center">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {error && (
              <div className="flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || passwordErrors.length > 0 || formData.password !== formData.confirmPassword}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl hover:shadow-lg hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creando cuenta...
                </div>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              ¿Ya tienes una cuenta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
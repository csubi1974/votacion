import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Vote, Shield, BarChart3, Users, CheckCircle, ArrowRight, Lock, Zap, Globe } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Shield,
      title: 'Seguridad Máxima',
      description: 'Encriptación end-to-end y autenticación de dos factores para proteger cada voto.',
    },
    {
      icon: Zap,
      title: 'Resultados Instantáneos',
      description: 'Visualiza resultados en tiempo real con actualizaciones automáticas.',
    },
    {
      icon: Globe,
      title: 'Accesible en Todo Momento',
      description: 'Vota desde cualquier dispositivo, en cualquier lugar del mundo.',
    },
  ];

  const benefits = [
    'Encriptación de grado militar para proteger cada voto',
    'Auditoría completa con trazabilidad de todas las acciones',
    'Accesible desde cualquier dispositivo con conexión a internet',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-900/50 backdrop-blur-lg border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Vote className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  VotaSeguro
                </h1>
              </div>
            </div>

            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Inicio
              </a>
              <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Características
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Comunidad
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Precios
              </a>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-purple-500/50 transition-all flex items-center"
              >
                Comenzar Gratis
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-left space-y-8">
              <div className="inline-block">
                <span className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-medium">
                  Seguridad de Nueva Generación
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-white">Una Plataforma</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Más Segura
                </span>
                <br />
                <span className="text-white">de Votación</span>
              </h1>

              <p className="text-xl text-gray-400 max-w-xl">
                Toma el control total de tus procesos electorales. Votaciones rápidas,
                tarifas bajas y seguridad de nivel empresarial, todo en tu bolsillo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/register')}
                  className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl text-base font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center"
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl text-base font-semibold border border-slate-700 transition-all"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>

            {/* Right Content - Mockup */}
            <div className="relative lg:block hidden">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl blur-3xl opacity-20"></div>

                {/* Phone mockup */}
                <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-slate-700 shadow-2xl">
                  <div className="bg-slate-900 rounded-2xl p-6 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <Vote className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Bienvenido de vuelta</p>
                          <p className="text-sm font-semibold text-white">Usuario Demo</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="w-16 h-8 bg-slate-800 rounded-lg"></div>
                        <div className="w-16 h-8 bg-slate-800 rounded-lg"></div>
                      </div>
                    </div>

                    {/* Stats Card */}
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6">
                      <p className="text-blue-100 text-sm mb-2">Votaciones Activas</p>
                      <p className="text-4xl font-bold text-white mb-4">3</p>
                      <p className="text-blue-100 text-xs">Participa ahora</p>
                    </div>

                    {/* Chart */}
                    <div className="space-y-3">
                      <div className="flex items-end space-x-2 h-32">
                        <div className="flex-1 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg" style={{ height: '60%' }}></div>
                        <div className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg" style={{ height: '80%' }}></div>
                        <div className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg" style={{ height: '70%' }}></div>
                        <div className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg" style={{ height: '90%' }}></div>
                        <div className="flex-1 bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg" style={{ height: '65%' }}></div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-2xl font-bold text-white">42%</p>
                        <p className="text-xs text-gray-400">Participación</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-2xl font-bold text-white">29%</p>
                        <p className="text-xs text-gray-400">Completadas</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-2xl font-bold text-white">18%</p>
                        <p className="text-xs text-gray-400">En Proceso</p>
                      </div>
                      <div className="bg-slate-800 rounded-xl p-4">
                        <p className="text-2xl font-bold text-white">20%</p>
                        <p className="text-xs text-gray-400">Programadas</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <div className="absolute -right-4 top-1/4 bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400">Seguridad</p>
                    <p className="text-sm font-semibold text-white">Certificada</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-gray-300 text-lg">{benefit}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 hover:border-blue-500/50 transition-all">
                <Lock className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">Encriptación Total</h3>
                <p className="text-gray-400 text-sm">Tus datos protegidos con tecnología de punta</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all mt-8">
                <Zap className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">Tiempo Real</h3>
                <p className="text-gray-400 text-sm">Resultados actualizados al instante</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
                <BarChart3 className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">Análisis Avanzado</h3>
                <p className="text-gray-400 text-sm">Gráficos y estadísticas detalladas</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 hover:border-pink-500/50 transition-all mt-8">
                <Users className="w-8 h-8 text-pink-400 mb-4" />
                <h3 className="text-white font-semibold mb-2">Multi-organización</h3>
                <p className="text-gray-400 text-sm">Gestiona múltiples entidades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Características Principales
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Todo lo que necesitas para gestionar procesos electorales de manera profesional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300"
              >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/50">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            ¿Listo para Modernizar tus Votaciones?
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Únete a las organizaciones que ya confían en nosotros para sus procesos electorales.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold hover:shadow-2xl hover:shadow-purple-500/50 transition-all inline-flex items-center"
          >
            Comenzar Gratis
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/50">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  VotaSeguro
                </span>
              </div>
              <p className="text-gray-400 text-sm max-w-md">
                Plataforma de votación segura y transparente para organizaciones modernas.
                Tecnología de punta para procesos electorales confiables.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Características</li>
                <li className="hover:text-white transition-colors cursor-pointer">Seguridad</li>
                <li className="hover:text-white transition-colors cursor-pointer">Precios</li>
                <li className="hover:text-white transition-colors cursor-pointer">Casos de Uso</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="hover:text-white transition-colors cursor-pointer">Documentación</li>
                <li className="hover:text-white transition-colors cursor-pointer">Guías</li>
                <li className="hover:text-white transition-colors cursor-pointer">API</li>
                <li className="hover:text-white transition-colors cursor-pointer">Contacto</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2024 VotaSeguro. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
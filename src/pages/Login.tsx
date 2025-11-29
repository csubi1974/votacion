import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoginForm from '../components/LoginForm';

const Login: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gradient-to-b from-purple-500/10 to-transparent"></div>

      <div className="max-w-md w-full relative">
        <button
          onClick={() => navigate('/')}
          className="mb-4 text-gray-400 hover:text-white flex items-center transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </button>

        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
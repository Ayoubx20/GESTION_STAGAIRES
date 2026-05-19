import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { 
  EnvelopeIcon, 
  ArrowLeftIcon, 
  LockClosedIcon, 
  EyeIcon, 
  EyeSlashIcon, 
  KeyIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  const [userCode, setUserCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form setups for each step
  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, formState: { errors: errorsStep2 } } = useForm();
  const { register: registerStep3, handleSubmit: handleSubmitStep3, watch, formState: { errors: errorsStep3 } } = useForm();

  const newPassword = watch('password');

  // STEP 1: Request Code
  const onSendEmail = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.success) {
        setUserEmail(data.email);
        setStep(2);
        toast.success('Code de sécurité envoyé !', { icon: '✉️' });
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Erreur lors de la demande';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Code with backend before moving to step 3
  const onVerifyCode = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-code', { 
        email: userEmail, 
        code: data.code 
      });
      if (response.success) {
        setUserCode(data.code);
        setStep(3);
        toast.success('Code vérifié avec succès !', { icon: '✅' });
      } else {
        toast.error(response.message || "Code invalide");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Code invalide ou expiré';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const onResetPassword = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { 
        email: userEmail,
        code: userCode,
        password: data.password 
      });
      
      if (response.success) {
        toast.success('Mot de passe réinitialisé avec succès !', { icon: '🔐' });
        navigate('/login');
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Code invalide ou expiré';
      toast.error(message);
      if (message.toLowerCase().includes('code')) {
        setStep(2); // Go back to code step if invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative Glow Effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-md w-full relative z-10 transition-all duration-500 ease-in-out transform">
        
        {/* Header / Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-purple-600 mb-6 shadow-[0_0_40px_rgba(79,70,229,0.4)] transform rotate-12 hover:rotate-0 transition-transform duration-300">
            {step === 1 && <LockClosedIcon className="w-10 h-10 text-white transform -rotate-12" />}
            {step === 2 && <KeyIcon className="w-10 h-10 text-white transform -rotate-12" />}
            {step === 3 && <ShieldCheckIcon className="w-10 h-10 text-white transform -rotate-12" />}
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {step === 1 && "Mot de passe oublié ?"}
            {step === 2 && "Vérification"}
            {step === 3 && "Nouveau mot de passe"}
          </h2>
          <p className="mt-3 text-sm text-gray-400 font-medium">
            {step === 1 && "Pas de panique, ça arrive à tout le monde."}
            {step === 2 && `Un code a été envoyé à ${userEmail}`}
            {step === 3 && "Sécurisez votre compte avec un nouveau mot de passe fort."}
          </p>
        </div>

        {/* Multi-step Progress Bar */}
        <div className="mb-8 flex items-center justify-center space-x-2">
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-primary-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-gray-800'}`}></div>
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-primary-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-gray-800'}`}></div>
          <div className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-primary-500 shadow-[0_0_10px_rgba(79,70,229,0.5)]' : 'bg-gray-800'}`}></div>
        </div>

        {/* Card Container */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/50 rounded-3xl shadow-2xl p-8 transition-all duration-500">
          
          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleSubmitStep1(onSendEmail)} className="space-y-6 animate-fade-in-up">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                  Adresse e-mail associée
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-primary-500">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    {...registerStep1('email', { 
                      required: 'L\'e-mail est requis',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email invalide'
                      }
                    })}
                    className={`block w-full pl-11 pr-4 py-3 bg-gray-800/50 border ${errorsStep1.email ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="vous@exemple.com"
                  />
                </div>
                {errorsStep1.email && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span> {errorsStep1.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Recherche du compte...
                  </div>
                ) : (
                  'Envoyer le code'
                )}
              </button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleSubmitStep2(onVerifyCode)} className="space-y-6 animate-fade-in-up">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
                  Code de sécurité (6 chiffres)
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    id="code"
                    type="text"
                    maxLength="6"
                    {...registerStep2('code', { 
                      required: 'Le code est requis',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'Le code doit contenir exactement 6 chiffres'
                      }
                    })}
                    className={`block w-full pl-11 pr-4 py-3 bg-gray-800/50 border ${errorsStep2.code ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all tracking-[0.5em] text-center font-mono text-xl`}
                    placeholder="••••••"
                  />
                </div>
                {errorsStep2.code && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span> {errorsStep2.code.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500 transition-all hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]"
              >
                Vérifier le code
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors"
                >
                  Je n'ai pas reçu le code, réessayer
                </button>
              </div>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleSubmitStep3(onResetPassword)} className="space-y-6 animate-fade-in-up">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...registerStep3('password', { 
                      required: 'Le mot de passe est requis',
                      minLength: {
                        value: 6,
                        message: 'Minimum 6 caractères'
                      }
                    })}
                    className={`block w-full pl-11 pr-12 py-3 bg-gray-800/50 border ${errorsStep3.password ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errorsStep3.password && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span> {errorsStep3.password.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <ShieldCheckIcon className="h-5 w-5 text-gray-500 group-focus-within:text-primary-500" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerStep3('confirmPassword', { 
                      required: 'Confirmation requise',
                      validate: value => value === newPassword || 'Les mots de passe ne correspondent pas'
                    })}
                    className={`block w-full pl-11 pr-12 py-3 bg-gray-800/50 border ${errorsStep3.confirmPassword ? 'border-red-500' : 'border-gray-700'} rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {errorsStep3.confirmPassword && (
                  <p className="mt-2 text-sm text-red-400 flex items-center">
                    <span className="mr-1">⚠</span> {errorsStep3.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sécurisation...
                  </div>
                ) : (
                  'Confirmer et se connecter'
                )}
              </button>
            </form>
          )}

          {/* Return to Login */}
          <div className="mt-8 pt-6 border-t border-gray-800 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour à la page de connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

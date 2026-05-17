import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { EnvelopeIcon, ArrowLeftIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, KeyIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userEmail, setUserEmail] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register: registerStep1, handleSubmit: handleSubmitStep1, formState: { errors: errorsStep1 } } = useForm();
  const { register: registerStep2, handleSubmit: handleSubmitStep2, watch, formState: { errors: errorsStep2 } } = useForm();

  const newPassword = watch('password');

  const onSendEmail = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: data.email });
      if (response.success) {
        setUserEmail(data.email);
        setStep(2);
        toast.success('Code de réinitialisation envoyé !');
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

  const onResetPassword = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { 
        email: userEmail,
        code: data.code,
        password: data.password 
      });
      
      if (response.success) {
        toast.success('Mot de passe réinitialisé avec succès !');
        navigate('/login');
      } else {
        toast.error(response.message || "Une erreur est survenue");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Code invalide ou expiré';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo w l'3onwan */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 mb-4">
            <span className="text-white text-3xl font-bold">GS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Gestion Stagiaire
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Réinitialisation du mot de passe
          </p>
        </div>

        {/* L'container dyal l'bita9a (Card) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {step === 1 ? (
            <form onSubmit={handleSubmitStep1(onSendEmail)} className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Entrez votre adresse e-mail ci-dessous et nous vous enverrons un code de vérification à 6 chiffres.
              </p>

              {/* Lkhaan dyal l'email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
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
                    className={`input-field pl-10 ${errorsStep1.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="vous@exemple.com"
                  />
                </div>
                {errorsStep1.email && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep1.email.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  'Recevoir le code'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitStep2(onResetPassword)} className="space-y-6">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Un code à 6 chiffres a été envoyé à <strong>{userEmail}</strong>.
                </p>
              </div>

              {/* Lkhaan dyal l'code */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Code de vérification
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
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
                    className={`input-field pl-10 text-center tracking-widest text-lg ${errorsStep2.code ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="123456"
                  />
                </div>
                {errorsStep2.code && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep2.code.message}</p>
                )}
              </div>

              {/* Lkhaan dyal lmot de passe jdid */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...registerStep2('password', { 
                      required: 'Le mot de passe est requis',
                      minLength: {
                        value: 6,
                        message: 'Le mot de passe doit contenir au moins 6 caractères'
                      }
                    })}
                    className={`input-field pl-10 pr-10 ${errorsStep2.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errorsStep2.password && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep2.password.message}</p>
                )}
              </div>

              {/* Lkhaan dyal ta'akid lmot de passe */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...registerStep2('confirmPassword', { 
                      required: 'Veuillez confirmer votre mot de passe',
                      validate: value => value === newPassword || 'Les mots de passe ne correspondent pas'
                    })}
                    className={`input-field pl-10 pr-10 ${errorsStep2.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {errorsStep2.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errorsStep2.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Modification...
                  </div>
                ) : (
                  'Changer le mot de passe'
                )}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Je n'ai pas reçu le code
                </button>
              </div>
            </form>
          )}

          {/* Rjo3 l login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-500 dark:text-gray-400 dark:hover:text-gray-300">
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

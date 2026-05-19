import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginIllustration = ({ isPasswordFocused }) => {
  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      {/* Subtle floating shapes */}
      <span className="absolute top-4 left-10 text-pink-300 text-xl font-light transform rotate-12 animate-pulse">+</span>
      <span className="absolute top-8 right-8 text-blue-300 text-lg font-light transform -rotate-12 animate-pulse" style={{ animationDelay: '0.4s' }}>x</span>

      <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background circle */}
        <circle cx="80" cy="80" r="64" fill="#EBF0FC" />

        {/* Neck */}
        <path d="M70 100 L70 125 L90 125 L90 100 Z" fill="#F4D3B8" />

        {/* Red Shirt */}
        <path d="M35 144 C 35 115 55 112 80 112 C 105 112 125 115 125 144 Z" fill="#F05454" />
        <path d="M68 112 L80 126 L92 112" stroke="#C84141" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Face Base */}
        <circle cx="80" cy="72" r="34" fill="#FFE5D9" />

        {/* Ears */}
        <circle cx="44" cy="76" r="8" fill="#FFE5D9" />
        <circle cx="116" cy="76" r="8" fill="#FFE5D9" />

        {/* Hair */}
        <path d="M 44 76 C 44 40 50 35 80 35 C 110 35 116 40 116 76 C 116 62 100 52 80 52 C 60 52 44 62 44 76 Z" fill="#5C4033" />
        <path d="M 68 35 Q 73 25 83 31 Q 78 35 78 35 Z" fill="#5C4033" />

        {/* Eyes: Interactive based on focus */}
        {isPasswordFocused ? (
          <>
            {/* Closed Eyes (Curved lines) */}
            <path d="M 57 76 Q 62 72 67 76" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 93 76 Q 98 72 103 76" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            {/* Open Eyes (Dots) */}
            <circle cx="62" cy="75" r="4.5" fill="#3D291F" />
            <circle cx="98" cy="75" r="4.5" fill="#3D291F" />
          </>
        )}

        {/* Eyebrows */}
        <path d="M57 66 Q 62 64 67 66" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M93 66 Q 98 64 103 66" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Cheeks */}
        <ellipse cx="54" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />
        <ellipse cx="106" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />

        {/* Mouth */}
        <path d="M72 92 Q 80 100 88 92" stroke="#3D291F" strokeWidth="3" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const onSubmit = async (data) => {
    setLoading(true);
    const result = await login(data.email, data.password);
    setLoading(false);

    if (result.success) {
      navigate('/dashboard', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F5FA] py-12 px-4 sm:px-6 lg:px-8 login-container">
      {/* Dynamically Inject premium Outfit font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .login-container {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>

      <div className="max-w-[420px] w-full bg-white rounded-[32px] shadow-[0_20px_50px_rgba(148,163,184,0.12)] border border-gray-100 p-8 sm:p-10 text-center relative">
        <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight mb-2">
          Welcome Back
        </h2>

        <LoginIllustration isPasswordFocused={isPasswordFocused} />

        <div className="space-y-2 px-2 mt-4">
          <p className="text-slate-700 font-semibold text-[15px] sm:text-[16px] leading-snug">
            Sign in to your account.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="max-w-[280px] mx-auto text-left">
            <div className={`relative border-b transition-colors ${errors.email ? 'border-red-400' : 'border-slate-300 focus-within:border-[#F05454]'}`}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email'
                  }
                })}
                onFocus={() => setIsPasswordFocused(false)}
                placeholder="Enter Email Address"
                className="w-full text-center pb-2 bg-transparent text-slate-800 placeholder-slate-300 focus:outline-none text-[16px]"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-500 text-center">{errors.email.message}</p>
            )}
          </div>

          <div className="max-w-[280px] mx-auto text-left">
            <div className={`relative border-b transition-colors ${errors.password ? 'border-red-400' : 'border-slate-300 focus-within:border-[#F05454]'}`}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password', {
                  required: 'Password is required'
                })}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                placeholder="Enter Password"
                className="w-full text-center pb-2 bg-transparent text-slate-800 placeholder-slate-300 focus:outline-none text-[16px]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 bottom-2 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-500 text-center">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-center pt-2">
            <Link to="/forgot-password" className="text-sm font-semibold text-[#F05454] hover:underline">
              Forgot Password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full max-w-[200px] mx-auto block py-3 px-8 text-[16px] font-bold text-white bg-[#F05454] hover:bg-[#E04343] rounded-full shadow-[0_8px_20px_rgba(240,84,84,0.3)] transition-all transform active:scale-95 duration-200 focus:outline-none disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100">
          <p className="text-sm font-semibold text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#F05454] hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
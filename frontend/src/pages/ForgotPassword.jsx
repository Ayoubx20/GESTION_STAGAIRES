import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import toast from 'react-hot-toast';

// 1. Sad Boy Illustration (Step 1)
const SadBoyIllustration = () => (
  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
    {/* Floating question marks exactly like in the design */}
    <span className="absolute top-2 left-6 text-pink-300 text-2xl font-light transform -rotate-12 animate-bounce">?</span>
    <span className="absolute top-8 right-6 text-pink-300 text-xl font-light transform rotate-12 animate-bounce" style={{ animationDelay: '0.5s' }}>?</span>
    <span className="absolute bottom-16 left-2 text-blue-300 text-2xl font-light transform -rotate-45">?</span>
    <span className="absolute top-16 right-0 text-blue-300 text-lg font-light transform rotate-45">?</span>

    <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      {/* Eyes */}
      <circle cx="62" cy="75" r="4.5" fill="#3D291F" />
      <circle cx="98" cy="75" r="4.5" fill="#3D291F" />

      {/* Eyebrows (Sad) */}
      <path d="M57 66 Q 62 63 67 67" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M93 67 Q 98 63 103 66" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <ellipse cx="54" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />
      <ellipse cx="106" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />

      {/* Sad Mouth */}
      <path d="M72 95 Q 80 89 88 95" stroke="#3D291F" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 2. Smiling Boy Illustration (Step 2)
const SmilingBoyIllustration = () => (
  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
    {/* Floating stars/plus exactly like in the design */}
    <span className="absolute top-4 left-10 text-pink-300 text-xl font-light transform rotate-12 animate-pulse">+</span>
    <span className="absolute top-8 right-8 text-blue-300 text-lg font-light transform -rotate-12 animate-pulse" style={{ animationDelay: '0.4s' }}>x</span>
    <span className="absolute bottom-16 right-4 text-blue-300 text-xl font-light">+</span>

    <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
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

      {/* Eyes */}
      <circle cx="62" cy="75" r="4.5" fill="#3D291F" />
      <circle cx="98" cy="75" r="4.5" fill="#3D291F" />

      {/* Eyebrows */}
      <path d="M57 68 Q 62 65 67 68" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M93 68 Q 98 65 103 68" stroke="#3D291F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* Cheeks */}
      <ellipse cx="54" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />
      <ellipse cx="106" cy="85" rx="6" ry="4" fill="#FFCDB2" fillOpacity="0.8" />

      {/* Smiling Mouth */}
      <path d="M72 92 Q 80 102 88 92" stroke="#3D291F" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  </div>
);

// 3. Security Success Key Illustration (Step 3)
const KeyIllustration = () => (
  <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
    {/* Floating checkmarks/stars */}
    <span className="absolute top-4 left-10 text-emerald-400 text-xl font-light animate-pulse">✓</span>
    <span className="absolute top-8 right-8 text-blue-300 text-lg font-light animate-pulse" style={{ animationDelay: '0.3s' }}>✦</span>

    <svg className="w-40 h-40" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="80" cy="80" r="64" fill="#EBF0FC" />

      {/* Golden Key/Lock illustration */}
      <circle cx="80" cy="70" r="20" stroke="#F5A623" strokeWidth="6" fill="none" />
      <path d="M80 90V120H90V110H80V100H90V90" stroke="#F5A623" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />

      {/* Success Badge */}
      <circle cx="108" cy="108" r="16" fill="#10B981" />
      <path d="M101 108L106 113L115 103" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
);

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');

  // State for step 2 (OTP code fields)
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];

  // State for step 3 (New Password fields)
  const [userEmail, setUserEmail] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP change handler
  const handleOtpChange = (value, index) => {
    // If user pasted a 6-digit code
    if (value.length > 1) {
      const pastedData = value.replace(/[^0-9]/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      for (let i = 0; i < 6; i++) {
        if (pastedData[i]) {
          newOtp[i] = pastedData[i];
        }
      }
      setOtp(newOtp);
      const targetIndex = Math.min(pastedData.length, 5);
      otpRefs[targetIndex].current?.focus();
      return;
    }

    // Clean numeric check
    const numericValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    // Auto-focus next input field
    if (numericValue && index < 5) {
      otpRefs[index + 1].current?.focus();
    }
  };

  // OTP backspace handler
  const handleOtpKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        otpRefs[index - 1].current?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // STEP 1: Request Code
  const onSendEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: email.trim() });
      if (response.success) {
        setUserEmail(email.trim());
        setStep(2);
        toast.success('Security code sent!', { icon: '✉️' });
      } else {
        toast.error(response.message || "An error occurred");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error requesting code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Verify Code
  const onVerifyCode = async (eOrCode) => {
    if (eOrCode && eOrCode.preventDefault) {
      eOrCode.preventDefault();
    }
    const codeString = typeof eOrCode === 'string' ? eOrCode : otp.join('');
    if (codeString.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-reset-code', {
        email: userEmail,
        code: codeString
      });
      if (response.success) {
        setUserCode(codeString);
        setStep(3);
        toast.success('Code verified successfully!', { icon: '✅' });
      } else {
        toast.error(response.message || "Invalid code");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired code';
      toast.error(message);
      // Auto-clear inputs on failure to let user type again quickly
      setOtp(['', '', '', '', '', '']);
      if (otpRefs[0] && otpRefs[0].current) {
        otpRefs[0].current.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-focus on step 2 load and auto-verify when code is full
  useEffect(() => {
    if (step === 2) {
      // Auto-focus first input when empty
      if (otp.join('') === '' && otpRefs[0] && otpRefs[0].current) {
        otpRefs[0].current.focus();
      }
      
      // Auto-verify when 6 digits are typed
      const codeString = otp.join('');
      if (codeString.length === 6 && !loading) {
        onVerifyCode(codeString);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, otp]);

  // Handle Resend Code
  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: userEmail });
      if (response.success) {
        toast.success('Security code resent!', { icon: '✉️' });
        // Clear OTP inputs
        setOtp(['', '', '', '', '', '']);
        otpRefs[0].current?.focus();
      } else {
        toast.error(response.message || "An error occurred");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error resending code';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Reset Password
  const onResetPassword = async (e) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email: userEmail,
        code: userCode,
        password: password
      });

      if (response.success) {
        toast.success('Password reset successfully!', { icon: '🔐' });
        navigate('/login');
      } else {
        toast.error(response.message || "An error occurred");
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired code';
      toast.error(message);
      if (message.toLowerCase().includes('code')) {
        setStep(2); // Go back to code step if invalid
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F3F5FA] py-12 px-4 sm:px-6 lg:px-8 forgot-password-container">
      {/* Dynamically Inject premium Outfit font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        .forgot-password-container {
          font-family: 'Outfit', sans-serif;
        }
      `}</style>

      <div className="max-w-[420px] w-full bg-white rounded-[32px] shadow-[0_20px_50px_rgba(148,163,184,0.12)] border border-gray-100 p-8 sm:p-10 text-center relative">

        {/* STEP 1: Forgot Password Form */}
        {step === 1 && (
          <form onSubmit={onSendEmail} className="space-y-6">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
              Forgot Password?
            </h2>

            <SadBoyIllustration />

            <div className="space-y-2 px-2">
              <p className="text-slate-700 font-semibold text-[15px] sm:text-[16px] leading-snug">
                Enter the email address associated with your account.
              </p>
              <p className="text-slate-400 text-sm">
                We will email you a link to reset your password.
              </p>
            </div>

            <div className="relative mt-8 max-w-[280px] mx-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email Address"
                className="w-full text-center pb-2 bg-transparent border-b border-slate-300 text-slate-800 placeholder-slate-300 focus:outline-none focus:border-[#F05454] text-[16px] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[200px] mx-auto block py-3 px-8 text-[16px] font-bold text-white bg-[#F05454] hover:bg-[#E04343] rounded-full shadow-[0_8px_20px_rgba(240,84,84,0.3)] transition-all transform active:scale-95 duration-200 mt-8 mb-4 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </form>
        )}

        {/* STEP 2: Verification Code Form */}
        {step === 2 && (
          <form onSubmit={onVerifyCode} className="space-y-6">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
              Verification
            </h2>

            <SmilingBoyIllustration />

            <div className="px-2">
              <p className="text-slate-700 font-semibold text-[15px] sm:text-[16px] leading-snug">
                Enter the verification code we just sent you on your email address.
              </p>
            </div>

            <div className="flex justify-center gap-2 my-8">
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={otpRefs[idx]}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  className={`w-10 h-12 text-center text-2xl font-bold bg-transparent border-b-2 focus:outline-none transition-colors ${digit ? 'border-[#F05454] text-slate-800' : 'border-slate-300 text-slate-400'
                    } focus:border-[#F05454]`}
                />
              ))}
            </div>

            <div className="text-sm text-slate-400 mt-4">
              If you didn't receive a code!{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-[#F05454] font-semibold hover:underline bg-transparent border-none p-0 cursor-pointer disabled:opacity-50"
              >
                Resend
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[200px] mx-auto block py-3 px-8 text-[16px] font-bold text-white bg-[#F05454] hover:bg-[#E04343] rounded-full shadow-[0_8px_20px_rgba(240,84,84,0.3)] transition-all transform active:scale-95 duration-200 mt-8 mb-4 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {/* STEP 3: Reset Password Form */}
        {step === 3 && (
          <form onSubmit={onResetPassword} className="space-y-6">
            <h2 className="text-2xl sm:text-[26px] font-bold text-slate-800 tracking-tight">
              New Password
            </h2>

            <KeyIllustration />

            <div className="px-2">
              <p className="text-slate-700 font-semibold text-[15px] sm:text-[16px] leading-snug">
                Enter your new password below.
              </p>
            </div>

            <div className="space-y-6 mt-8 max-w-[280px] mx-auto text-left">
              <div className="relative border-b border-slate-300 focus-within:border-[#F05454] transition-colors">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter New Password"
                  className="w-full text-center pb-2 bg-transparent text-slate-800 placeholder-slate-300 focus:outline-none text-[16px]"
                  required
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

              <div className="relative border-b border-slate-300 focus-within:border-[#F05454] transition-colors">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm Password"
                  className="w-full text-center pb-2 bg-transparent text-slate-800 placeholder-slate-300 focus:outline-none text-[16px]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-0 bottom-2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-[200px] mx-auto block py-3 px-8 text-[16px] font-bold text-white bg-[#F05454] hover:bg-[#E04343] rounded-full shadow-[0_8px_20px_rgba(240,84,84,0.3)] transition-all transform active:scale-95 duration-200 mt-8 mb-4 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="mt-8 pt-4 border-t border-slate-100">
          <Link
            to="/login"
            className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1"
          >
            ← Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ForgotPassword;

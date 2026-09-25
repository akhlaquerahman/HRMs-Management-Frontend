"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  Mail,
  Users,
  CalendarCheck,
  CircleDollarSign,
  TrendingUp,
  Megaphone,
  Bot,
  AlertCircle,
  RotateCcw,
  Sun,
  Moon,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const loginSchema = z.object({
  email: z.string().min(5, "Email is required.").max(100, "Email cannot exceed 100 characters.").email("Please enter a valid email address containing an '@' and a domain (e.g., name@company.com)."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72, "Password cannot exceed 72 characters."),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="w-8 h-8 md:w-10 md:h-10" />,
  CalendarCheck: <CalendarCheck className="w-8 h-8 md:w-10 md:h-10" />,
  CircleDollarSign: <CircleDollarSign className="w-8 h-8 md:w-10 md:h-10" />,
  TrendingUp: <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />,
  Megaphone: <Megaphone className="w-8 h-8 md:w-10 md:h-10" />,
  Bot: <Bot className="w-8 h-8 md:w-10 md:h-10" />
};

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'PASSWORD' | 'OTP'>('PASSWORD');
  const { theme, setTheme } = useTheme();
  
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, getValues, watch, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const emailValue = watch('email');
  const passwordValue = watch('password');

  const { data: contentData } = useQuery({
    queryKey: ['login-content'],
    queryFn: async () => {
      const res = await api.get('/public/login-content');
      return res.data.data;
    }
  });

  const heroSlides = contentData?.heroSlides || [];

  useEffect(() => {
    if (!heroSlides.length) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpSent && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer, otpSent]);

  const formatErrorMsg = (msg: string) => {
    if (!msg) return '';
    return msg.endsWith('.') ? msg : `${msg}.`;
  };

  const mutation = useMutation({
    mutationFn: (data: LoginFormData) => api.post('/auth/login', { email: data.email, password: data.password }),
    onSuccess: (response) => {
      const { token, user } = response.data.data;
      setAuth(user, token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      setErrorMsg(formatErrorMsg(error.response?.data?.message || 'Server error. Please try again later.'));
      setIsLoading(false);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    if (loginMethod === 'PASSWORD' && passwordValue.length < 8) return;
    setErrorMsg('');
    setIsLoading(true);
    mutation.mutate(data);
  };

  const sendOtpMutation = useMutation({
    mutationFn: (email: string) => api.post('/auth/send-login-otp', { email }),
    onSuccess: () => {
      setOtpSent(true);
      setErrorMsg('');
      setIsLoading(false);
      setOtpTimer(60);
    },
    onError: (error: any) => {
      setErrorMsg(formatErrorMsg(error.response?.data?.message || 'Failed to send OTP.'));
      setIsLoading(false);
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: (data: {email: string, otp: string}) => api.post('/auth/verify-login-otp', data),
    onSuccess: (response) => {
      const { token, user } = response.data.data;
      setAuth(user, token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      setErrorMsg(formatErrorMsg(error.response?.data?.message || 'Invalid OTP.'));
      setIsLoading(false);
    },
  });

  const handleSendOtp = () => {
    const email = getValues('email');
    if (!email || errors.email) {
      setErrorMsg('Please enter a valid email address containing an "@" and a domain (e.g., name@company.com).');
      return;
    }
    setIsLoading(true);
    sendOtpMutation.mutate(email);
  };

  const handleVerifyOtp = () => {
    if (otpTimer === 0) {
      setErrorMsg('OTP has expired. Please resend a new one.');
      return;
    }
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }
    setIsLoading(true);
    verifyOtpMutation.mutate({ email: getValues('email'), otp: otpCode });
  };

  const googleMutation = useMutation({
    mutationFn: (token: string) => api.post('/auth/google-login', { token }),
    onSuccess: (response) => {
      const { token, user } = response.data.data;
      setAuth(user, token);
      router.push('/dashboard');
    },
    onError: (error: any) => {
      setErrorMsg(formatErrorMsg(error.response?.data?.message || 'Google Login failed. Please try again.'));
      setIsLoading(false);
    },
  });

  const handleGoogleSuccess = (credentialResponse: any) => {
    if (credentialResponse.credential) {
      setErrorMsg('');
      setIsLoading(true);
      googleMutation.mutate(credentialResponse.credential);
    }
  };

  const isEmailValid = emailValue && !errors.email && emailValue.includes('@');
  
  const isSubmitDisabled = loginMethod === 'PASSWORD' 
    ? (!isEmailValid || passwordValue.length < 8 || isLoading)
    : (otpSent ? (!otpCode || isLoading) : (!isEmailValid || isLoading));

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 font-sans relative">
      
      {/* Theme Toggle Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="fixed top-4 right-4 md:top-6 md:right-6 z-50 rounded-full bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-md transition-transform hover:scale-105" 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      >
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-slate-300" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* LEFT SIDE - DYNAMIC PANEL */}
      <div className="hidden md:flex flex-col w-[45%] lg:w-[48%] xl:w-[52%] relative bg-gradient-to-br from-emerald-500 via-blue-600 to-indigo-700 text-white overflow-hidden p-8 lg:p-12 border-r border-slate-800/20 shadow-2xl shrink-0 min-h-screen">
        
        {/* Decorative Circles */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[12%] right-[12%] w-56 h-56 rounded-full bg-white/10 backdrop-blur-xl border border-white/20"></div>
          <div className="absolute bottom-[10%] left-[8%] w-72 h-72 rounded-full bg-white/10 backdrop-blur-2xl border border-white/10"></div>
          <div className="absolute top-[-15%] left-[-15%] w-[80%] h-[80%] rounded-full bg-white/10 blur-[100px]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full w-full max-w-xl mx-auto py-4">
          
          {/* Top Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30 shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-wider text-white uppercase">Enterprise HRMS</span>
              <span className="text-[10px] font-semibold text-blue-100/80 tracking-widest uppercase">Human Capital Management</span>
            </div>
          </div>

          {/* Center Rotating Hero Section */}
          <div className="my-auto py-12 flex flex-col justify-center relative">
            <AnimatePresence mode="wait">
              {heroSlides.length > 0 && (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="w-full flex flex-col items-start"
                >
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-white/20 backdrop-blur-lg border border-white/30 text-white flex items-center justify-center mb-6 shadow-xl">
                    {iconMap[heroSlides[currentSlide].icon] || <Bot className="w-10 h-10" />}
                  </div>
                  
                  <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold leading-tight tracking-tight mb-4 text-white">
                    {heroSlides[currentSlide].title}
                  </h1>
                  
                  <p className="text-base lg:text-lg text-blue-100/90 font-normal leading-relaxed max-w-lg">
                    {heroSlides[currentSlide].description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Dots */}
            {heroSlides.length > 0 && (
              <div className="flex gap-2 mt-8">
                {heroSlides.map((_: any, i: number) => (
                  <button
                    key={i} 
                    onClick={() => setCurrentSlide(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${currentSlide === i ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/60'}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Footer Section */}
          <div className="pt-6 border-t border-white/20 flex justify-between items-center text-xs text-blue-100/80 uppercase tracking-widest font-medium">
            <div>© {new Date().getFullYear()} Enterprise Inc.</div>
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Enterprise Grade Security</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 bg-slate-50 dark:bg-slate-950 min-h-screen py-10">
        <div className="w-full max-w-md lg:max-w-lg flex flex-col justify-center my-auto">
          
          {/* Mobile Logo Branding */}
          <div className="md:hidden flex flex-col items-center gap-2 mb-6 text-center">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-lg font-black tracking-wider text-slate-900 dark:text-white uppercase">Enterprise HRMS</span>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800 transition-all">
            
            {/* Header Title */}
            <div className="mb-6 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                Welcome Back
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Choose your preferred login method to continue.
              </p>
            </div>

            {/* Login Method Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-6 relative">
              <button
                type="button"
                onClick={() => { setLoginMethod('PASSWORD'); setErrorMsg(''); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg z-10 transition-colors ${loginMethod === 'PASSWORD' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => { setLoginMethod('OTP'); setErrorMsg(''); setOtpSent(false); }}
                className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg z-10 transition-colors ${loginMethod === 'OTP' ? 'text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
              >
                OTP Login
              </button>
              
              <motion.div 
                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200/60 dark:border-slate-600/60"
                initial={false}
                animate={{ left: loginMethod === 'PASSWORD' ? '4px' : 'calc(50%)' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </div>

            {/* Unified Error Message */}
            <AnimatePresence>
              {errorMsg && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs sm:text-sm font-medium flex gap-3 items-center overflow-hidden"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {loginMethod === 'PASSWORD' ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input 
                      {...register('email')} 
                      type="email" 
                      placeholder="name@company.com" 
                      className={`pl-10 h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    />
                  </div>
                  <div className="flex justify-between items-start pt-0.5 px-1">
                    <div className="flex-1">
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-red-500 text-xs font-medium">
                            {errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                      {(emailValue || '').length}/100 characters
                    </span>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <Link href="/forgot-password" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input 
                      {...register('password')} 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="••••••••" 
                      className={`pl-10 pr-10 h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden`} 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex justify-between items-start pt-0.5 px-1">
                    <div className="flex-1">
                      <AnimatePresence>
                        {errors.password && (
                          <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-red-500 text-xs font-medium">
                            {errors.password.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                      {(passwordValue || '').length}/72 characters
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  disabled={isSubmitDisabled} 
                  type="submit" 
                  className="w-full h-11 sm:h-12 mt-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Signing In...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                {/* OTP Flow */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input 
                      {...register('email')} 
                      type="email" 
                      placeholder="name@company.com" 
                      disabled={otpSent}
                      className={`pl-10 h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    />
                  </div>
                  <div className="flex justify-between items-start pt-0.5 px-1">
                    <div className="flex-1">
                      <AnimatePresence>
                        {errors.email && (
                          <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-red-500 text-xs font-medium">
                            {errors.email.message}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">
                      {(emailValue || '').length}/100 characters
                    </span>
                  </div>
                </div>

                <AnimatePresence>
                  {otpSent && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Enter 6-Digit OTP</label>
                      <Input 
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                        type="text" 
                        maxLength={6}
                        placeholder="••••••" 
                        className="h-11 sm:h-12 rounded-xl bg-slate-50 dark:bg-slate-950 border border-blue-500 text-center tracking-[0.5em] font-black text-xl" 
                      />
                      {otpTimer > 0 ? (
                        <p className="text-xs text-slate-500 text-center mt-2">
                          OTP valid for <span className="font-bold text-slate-700 dark:text-slate-300">00:{otpTimer.toString().padStart(2, '0')}</span>
                        </p>
                      ) : (
                        <div className="flex flex-col items-center mt-2">
                          <p className="text-xs text-red-500 font-semibold mb-2">OTP expired. Please resend.</p>
                          <Button 
                            type="button" 
                            variant="outline"
                            size="sm"
                            onClick={handleSendOtp}
                            disabled={isLoading}
                            className="text-xs font-semibold"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                            Resend OTP
                          </Button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {!otpSent ? (
                  <Button 
                    type="button" 
                    onClick={handleSendOtp}
                    disabled={isSubmitDisabled} 
                    className="w-full h-11 sm:h-12 mt-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending...</span>
                    ) : 'Send OTP Code'}
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    onClick={handleVerifyOtp}
                    disabled={isSubmitDisabled} 
                    className="w-full h-11 sm:h-12 mt-2 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
                    ) : 'Verify & Login'}
                  </Button>
                )}
              </div>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-extrabold tracking-widest">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">Secure SSO</span>
              </div>
            </div>

            {/* Google OAuth */}
            <div className="flex justify-center w-full">
              <div className="w-full flex justify-center">
                <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'dummy.apps.googleusercontent.com'}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErrorMsg('Google Login Failed')}
                    theme="outline"
                    size="large"
                    shape="pill"
                    width="100%"
                    text="continue_with"
                  />
                </GoogleOAuthProvider>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

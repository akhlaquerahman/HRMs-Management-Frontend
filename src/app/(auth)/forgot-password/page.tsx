"use client";

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  Mail, 
  ArrowLeft,
  Users,
  CalendarCheck,
  CircleDollarSign,
  TrendingUp,
  Megaphone,
  Bot,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

const requestSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Please enter a valid work email address."),
});

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters.")
    .max(128, "Password is too long.")
    .regex(/[A-Z]/, "Requires uppercase letter.")
    .regex(/[a-z]/, "Requires lowercase letter.")
    .regex(/[0-9]/, "Requires number.")
    .regex(/[^A-Za-z0-9]/, "Requires special character."),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type Step = 'REQUEST_OTP' | 'VERIFY_OTP' | 'RESET_PASSWORD' | 'SUCCESS';

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users className="w-8 h-8 md:w-10 md:h-10" />,
  CalendarCheck: <CalendarCheck className="w-8 h-8 md:w-10 md:h-10" />,
  CircleDollarSign: <CircleDollarSign className="w-8 h-8 md:w-10 md:h-10" />,
  TrendingUp: <TrendingUp className="w-8 h-8 md:w-10 md:h-10" />,
  Megaphone: <Megaphone className="w-8 h-8 md:w-10 md:h-10" />,
  Bot: <Bot className="w-8 h-8 md:w-10 md:h-10" />
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('REQUEST_OTP');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { register: registerRequest, handleSubmit: handleRequestSubmit, watch: watchRequest, formState: { errors: requestErrors } } = useForm({
    resolver: zodResolver(requestSchema),
    mode: 'onBlur',
    defaultValues: { email: '' }
  });

  const { register: registerReset, handleSubmit: handleResetSubmit, watch: watchReset, formState: { errors: resetErrors } } = useForm({
    resolver: zodResolver(resetSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' }
  });

  const requestEmailValue = watchRequest('email');
  const watchPassword = watchReset("password");

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
    if (step === 'VERIFY_OTP' && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const requestMutation = useMutation({
    mutationFn: (data: { email: string }) => api.post('/auth/forgot-password', data),
    onSuccess: (_, variables) => {
      setEmail(variables.email);
      setStep('VERIFY_OTP');
      setTimer(600);
      setErrorMsg('');
      setIsLoading(false);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to send OTP.');
      setIsLoading(false);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (data: { email: string, otp: string }) => api.post('/auth/verify-otp', data),
    onSuccess: () => {
      setStep('RESET_PASSWORD');
      setErrorMsg('');
      setIsLoading(false);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Invalid or expired OTP.');
      setIsLoading(false);
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/reset-password', { email, password: data.password }),
    onSuccess: () => {
      setStep('SUCCESS');
      setErrorMsg('');
      setIsLoading(false);
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Failed to reset password.');
      setIsLoading(false);
    },
  });

  const onRequestSubmit = (data: any) => {
    setErrorMsg('');
    setIsLoading(true);
    requestMutation.mutate(data);
  };
  
  const onResetSubmit = (data: any) => {
    if (!isPasswordValid) return;
    setErrorMsg('');
    setIsLoading(true);
    resetMutation.mutate(data);
  };

  const handleOtpChange = (index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length > 1) {
      const pasted = numericValue.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex(val => val === '');
      const focusIndex = nextEmpty === -1 ? 5 : nextEmpty;
      otpRefs.current[focusIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue !== '' && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const submitOtp = () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    verifyMutation.mutate({ email, otp: otpString });
  };

  const formatTimer = () => {
    const m = Math.floor(timer / 60);
    const s = timer % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const isRequestSubmitDisabled = !requestEmailValue || !!requestErrors.email || isLoading || !requestEmailValue.includes('@');
  const isResetSubmitDisabled = isLoading || !isPasswordValid || !!resetErrors.confirmPassword || !watchReset("confirmPassword");

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* LEFT SIDE - DYNAMIC PANEL */}
      <div className="hidden md:flex flex-col w-[40%] lg:w-[45%] xl:w-[50%] relative bg-[#0a1128] text-white overflow-hidden p-8 lg:p-14 border-r border-slate-800 shadow-2xl shrink-0">
        
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] rounded-full bg-blue-600/10 blur-[140px] mix-blend-screen animate-pulse duration-10000"></div>
          <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[70%] rounded-full bg-indigo-600/10 blur-[140px] mix-blend-screen"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full w-full max-w-xl mx-auto">
          
          {/* Top Logo */}
          <div className="flex flex-col gap-6 mb-8 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/20">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xl font-bold tracking-widest text-white/90 uppercase">Enterprise HRMS</span>
            </div>
          </div>

          {/* Center Rotating Hero Section */}
          <div className="flex-1 flex flex-col justify-center relative min-h-[300px]">
            <AnimatePresence mode="wait">
              {heroSlides.length > 0 && (
                <motion.div
                  key={currentSlide}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full flex flex-col items-start"
                >
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                    {iconMap[heroSlides[currentSlide].icon] || <Bot className="w-10 h-10" />}
                  </div>
                  
                  {/* Title uses clamp for responsive scaling without full stops */}
                  <h1 className="text-[clamp(2rem,4vw,3.5rem)] font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
                    {heroSlides[currentSlide].title}
                  </h1>
                  
                  {/* Description includes full stop per rules */}
                  <p className="text-[clamp(1rem,1.5vw,1.25rem)] text-blue-100/70 font-medium leading-relaxed max-w-[85%]">
                    {heroSlides[currentSlide].description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pagination Dots */}
            {heroSlides.length > 0 && (
              <div className="absolute bottom-0 left-0 flex gap-2">
                {heroSlides.map((_: any, i: number) => (
                  <div 
                    key={i} 
                    className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Footer Section (Version/Stats) */}
          <div className="mt-8 pt-8 border-t border-white/10 flex justify-between items-center text-xs text-blue-200/50 uppercase tracking-wider shrink-0">
            <div>© {new Date().getFullYear()} Enterprise Inc.</div>
            <div>Version {contentData?.version || '1.0.0'}</div>
          </div>
          
        </div>
      </div>

      {/* RIGHT SIDE - FORGOT PASSWORD FORM */}
      <div className="flex-1 flex flex-col justify-center items-center p-4 md:p-8 relative overflow-y-auto overflow-x-hidden bg-slate-50 dark:bg-[#0f172a]">
        <div className="w-full max-w-[420px] lg:max-w-[440px] flex flex-col justify-center min-h-full">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex flex-col items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-widest text-slate-900 dark:text-white uppercase">Enterprise HRMS</span>
          </div>

          {/* Glassmorphism Form Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-8 lg:p-10 shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_40px_rgb(0,0,0,0.2)] border border-white dark:border-slate-800">
            
            <AnimatePresence mode="wait">
              {/* STEP 1: REQUEST OTP */}
              {step === 'REQUEST_OTP' && (
                <motion.div key="req" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="mb-8">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Forgot Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Enter your work email to receive a reset code.</p>
                  </div>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex gap-3 items-center overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleRequestSubmit(onRequestSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Work Email</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <Input 
                          {...registerRequest('email')} 
                          type="email" 
                          placeholder="name@company.com" 
                          className={`pl-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-none text-sm transition-all focus-visible:border-blue-500 focus-visible:ring-blue-500/20 ${requestErrors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                        />
                      </div>
                      <AnimatePresence>
                        {requestErrors.email && (
                          <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-red-500 text-xs font-medium pl-1">
                            {requestErrors.email.message as string}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button 
                      disabled={isRequestSubmitDisabled} 
                      type="submit" 
                      className="w-full h-12 mt-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Sending...</span>
                      ) : (
                        'Send Code'
                      )}
                    </Button>
                  </form>

                  <div className="mt-8 text-center">
                    <Link href="/login" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" /> Back to Login
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: VERIFY OTP */}
              {step === 'VERIFY_OTP' && (
                <motion.div key="verify" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="mb-8">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">Check Your Email</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">
                      We sent a 6-digit code to <span className="font-bold text-slate-700 dark:text-slate-300">{email}</span>.
                    </p>
                  </div>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex gap-3 items-center overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-6">
                    <div className="flex justify-between gap-2 sm:gap-3">
                      {otp.map((digit, i) => (
                        <Input
                          key={i}
                          ref={el => { otpRefs.current[i] = el; }}
                          type="text"
                          maxLength={6} // allowing paste to fill
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          className="w-12 h-14 text-center text-xl font-black rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-none focus-visible:border-blue-500 focus-visible:ring-blue-500/20 transition-all"
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2">
                      <span className={`font-semibold ${timer < 60 ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        Expires in {formatTimer()}
                      </span>
                      <button 
                        type="button"
                        disabled={timer > 0 || isLoading}
                        onClick={() => { setErrorMsg(''); setIsLoading(true); requestMutation.mutate({ email }); }}
                        className="font-bold text-blue-600 dark:text-blue-400 disabled:opacity-50 disabled:text-slate-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      >
                        Resend Code
                      </button>
                    </div>

                    <Button 
                      onClick={submitOtp}
                      disabled={isLoading || otp.join('').length !== 6} 
                      className="w-full h-12 mt-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</span>
                      ) : 'Verify Code'}
                    </Button>
                  </div>

                  <div className="mt-8 text-center">
                    <button onClick={() => { setStep('REQUEST_OTP'); setErrorMsg(''); }} className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1.5">
                      <ArrowLeft className="w-4 h-4" /> Change Email
                    </button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: RESET PASSWORD */}
              {step === 'RESET_PASSWORD' && (
                <motion.div key="reset" variants={containerVariants} initial="hidden" animate="visible" exit="exit">
                  <div className="mb-8">
                    <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">New Password</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Create a strong, unique password.</p>
                  </div>

                  <AnimatePresence>
                    {errorMsg && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium flex gap-3 items-center overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">New Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input 
                          {...registerReset('password')} 
                          type={showPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          className={`pl-10 pr-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-none text-sm transition-all focus-visible:border-blue-500 focus-visible:ring-blue-500/20`} 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      
                      <PasswordStrengthMeter 
                        password={watchPassword} 
                        onValidationChange={setIsPasswordValid} 
                        showErrorMsg={watchPassword.length > 0}
                      />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1 uppercase tracking-wider">Confirm Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                        <Input 
                          {...registerReset('confirmPassword')} 
                          type={showConfirmPassword ? 'text' : 'password'} 
                          placeholder="••••••••" 
                          className={`pl-10 pr-10 h-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-none text-sm transition-all focus-visible:border-blue-500 focus-visible:ring-blue-500/20 ${resetErrors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <AnimatePresence>
                        {resetErrors.confirmPassword && (
                          <motion.p initial={{opacity:0, height:0}} animate={{opacity:1, height:'auto'}} className="text-red-500 text-xs font-medium pl-1">
                            {resetErrors.confirmPassword.message as string}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <Button 
                      disabled={isResetSubmitDisabled} 
                      type="submit" 
                      className="w-full h-12 mt-2 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Resetting...</span>
                      ) : (
                        'Reset Password'
                      )}
                    </Button>
                  </form>
                </motion.div>
              )}

              {/* STEP 4: SUCCESS */}
              {step === 'SUCCESS' && (
                <motion.div key="success" variants={containerVariants} initial="hidden" animate="visible" className="text-center py-6">
                  <div className="w-20 h-20 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-sm">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-extrabold tracking-tight mb-3 text-slate-900 dark:text-white">All Done</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed px-4">
                    Your password has been successfully reset. You can now use your new password to sign in.
                  </p>
                  <Link href="/login" className="block">
                    <Button className="w-full h-12 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all">
                      Go to Login
                    </Button>
                  </Link>
                </motion.div>
              )}
              
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

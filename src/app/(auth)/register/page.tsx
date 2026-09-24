"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  Eye, 
  EyeOff, 
  Loader2, 
  Lock, 
  Mail, 
  ShieldCheck,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const registerSchema = z.object({
  firstName: z.string().min(2, "First name is required."),
  lastName: z.string().min(2, "Last name is required."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  confirmPassword: z.string().min(8, "Confirm password is required."),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const mutation = useMutation({
    mutationFn: (data: RegisterFormData) => api.post('/auth/register', data),
    onSuccess: () => {
      router.push('/login');
    },
    onError: (error: any) => {
      setErrorMsg(error.response?.data?.message || 'Registration failed');
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    setErrorMsg('');
    mutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-12">
      {/* Soft gradient background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-pink-100/50 dark:bg-pink-900/20 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-100/50 dark:bg-purple-900/20 blur-[120px]"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] p-6 sm:p-10 relative z-10"
      >
        {/* Logo Icon */}
        <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center mb-8 mx-auto">
          <Building2 className="w-7 h-7 text-slate-700 dark:text-slate-300" />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Create an Account</h1>
          <p className="text-slate-500 dark:text-slate-400 text-[15px]">Sign up to get started</p>
        </div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2 justify-center"
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="flex gap-4">
            {/* First Name */}
            <div className="space-y-2 flex-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input 
                  {...register('firstName')} 
                  type="text" 
                  placeholder="John" 
                  className={`pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-pink-500 focus-visible:border-pink-500 transition-all ${errors.firstName ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                />
              </div>
              {errors.firstName && <p className="text-red-500 text-xs font-medium pl-1">{errors.firstName.message}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-2 flex-1">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <Input 
                  {...register('lastName')} 
                  type="text" 
                  placeholder="Doe" 
                  className={`pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-pink-500 focus-visible:border-pink-500 transition-all ${errors.lastName ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                />
              </div>
              {errors.lastName && <p className="text-red-500 text-xs font-medium pl-1">{errors.lastName.message}</p>}
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <Input 
                {...register('email')} 
                type="email" 
                placeholder="you@example.com" 
                className={`pl-11 h-12 rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-pink-500 focus-visible:border-pink-500 transition-all ${errors.email ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
              />
            </div>
            {errors.email && <p className="text-red-500 text-xs font-medium pl-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <Input 
                {...register('password')} 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className={`pl-11 pr-11 h-12 rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-pink-500 focus-visible:border-pink-500 transition-all ${errors.password ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs font-medium pl-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Confirm Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <Input 
                {...register('confirmPassword')} 
                type={showConfirmPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                className={`pl-11 pr-11 h-12 rounded-2xl bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 shadow-sm focus-visible:ring-pink-500 focus-visible:border-pink-500 transition-all ${errors.confirmPassword ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-xs font-medium pl-1">{errors.confirmPassword.message}</p>}
          </div>

          <Button 
            disabled={mutation.isPending} 
            type="submit" 
            className="w-full h-12 mt-6 rounded-full font-bold text-[15px] bg-[#d64eab] hover:bg-[#c04098] text-white border-0 shadow-[0_8px_20px_rgba(214,78,171,0.25)] hover:shadow-[0_8px_25px_rgba(214,78,171,0.35)] transition-all active:scale-[0.98]"
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              'Sign Up'
            )}
          </Button>
        </form>

        <div className="mt-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Already have an account? <Link href="/login" className="font-semibold text-slate-800 dark:text-slate-200 hover:underline">Log in</Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}

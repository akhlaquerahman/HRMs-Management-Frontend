import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordStrengthMeterProps {
  password?: string;
  onValidationChange?: (isValid: boolean) => void;
  showErrorMsg?: boolean;
}

export const PasswordStrengthMeter = ({ password = '', onValidationChange, showErrorMsg = true }: PasswordStrengthMeterProps) => {
  const [capsLock, setCapsLock] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === 'function') {
        setCapsLock(e.getModifierState('CapsLock'));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyDown);
    };
  }, []);

  const validations = {
    length: password.length >= 8 && password.length <= 128,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password)
  };

  const score = Object.values(validations).filter(Boolean).length;
  
  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(score === 4);
    }
  }, [score, onValidationChange]);

  const strengthLabels = ['Weak', 'Weak', 'Medium', 'Strong', 'Very Strong'];
  const strengthColors = [
    'bg-slate-200 dark:bg-slate-800',
    'bg-red-500',
    'bg-orange-500',
    'bg-green-400',
    'bg-green-600'
  ];

  // Determine the first failing validation rule for the concise message
  let errorMessage = '';
  if (password.length > 0 && score < 4) {
    if (!validations.length) errorMessage = 'Password must be at least 8 characters long.';
    else if (!validations.uppercase) errorMessage = 'Password must include one uppercase letter.';
    else if (!validations.number) errorMessage = 'Password must include one number.';
    else if (!validations.special) errorMessage = 'Password must include one special character.';
  }

  return (
    <div className="space-y-2 mt-2">
      {/* Caps Lock Warning */}
      <AnimatePresence>
        {capsLock && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-orange-500 font-medium flex items-center"
          >
            Warning: Caps Lock is on!
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Strength Bar */}
      <div className="flex gap-1 h-1 w-full">
        {[1, 2, 3, 4].map((index) => (
          <div 
            key={index}
            className={`h-full flex-1 rounded-full transition-colors duration-500 ${score >= index ? strengthColors[score] : 'bg-slate-200 dark:bg-slate-800'}`}
          />
        ))}
      </div>
      
      {/* Label and Concise Error */}
      <div className="flex justify-between items-start text-xs min-h-[16px]">
        <div className="text-red-500 font-medium flex-1 pr-2">
          {showErrorMsg && errorMessage ? errorMessage : ''}
        </div>
        <div className="font-semibold text-slate-500 dark:text-slate-400 text-right shrink-0">
          {password ? strengthLabels[score] : ''}
        </div>
      </div>
    </div>
  );
};

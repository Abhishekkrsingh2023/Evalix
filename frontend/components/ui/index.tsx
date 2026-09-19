'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700',
      danger: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/20',
      ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200',
      success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-xl',
      lg: 'px-6 py-3 text-base rounded-xl',
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}
export function Card({ children, className, hover }: CardProps) {
  return (
    <div className={cn('glass rounded-2xl p-6', hover && 'card-hover cursor-pointer', className)}>
      {children}
    </div>
  );
}

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'submitted';
  className?: string;
}
export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
    success: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    danger: 'bg-red-500/20 text-red-300 border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    submitted: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border', variants[variant], className)}>
      {children}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}
export function StatCard({ title, value, icon, color = 'from-violet-600 to-indigo-600', subtitle }: StatCardProps) {
  return (
    <Card className="flex items-start gap-4">
      <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', color)}>
        {icon}
      </div>
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-100 mt-0.5">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-400">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all duration-200',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">{title}</h3>
        {children}
      </div>
    </div>
  );
}

export function ScoreBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = (value / max) * 100;
  const color = pct >= 80 ? 'from-emerald-500 to-teal-500' : pct >= 60 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-rose-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm font-semibold text-slate-300 w-8 text-right">{value}</span>
    </div>
  );
}

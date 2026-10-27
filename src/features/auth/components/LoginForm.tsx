'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { loginSchema, type LoginFormValues } from './Login.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export interface LoginFormProps {
  defaultValues?: Partial<LoginFormValues>;
  onSubmit?: (data: LoginFormValues) => void | Promise<void>;
  redirectTo?: string;
}

export function LoginForm({ defaultValues, onSubmit, redirectTo = '/dashboard' }: LoginFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    if (onSubmit) {
      await onSubmit(data);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Credenciales inválidas');
        return;
      }

      // Redirect to target and refresh auth state
      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError('Ocurrió un error al intentar iniciar sesión. Intenta de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 text-sm rounded-md bg-destructive/15 text-destructive border border-destructive/20">
          {serverError}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="login-email">Correo Electrónico</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="tu@ejemplo.com"
          autoComplete="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Contraseña</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
      </Button>
    </form>
  );
}

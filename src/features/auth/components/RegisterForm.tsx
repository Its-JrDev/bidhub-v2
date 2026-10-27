'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { registerSchema, type RegisterFormValues } from './Register.schema';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';

export interface RegisterFormProps {
  defaultValues?: Partial<RegisterFormValues>;
  onSubmit?: (data: RegisterFormValues) => void | Promise<void>;
  redirectTo?: string;
}

export function RegisterForm({ defaultValues, onSubmit, redirectTo = '/dashboard' }: RegisterFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      ...defaultValues,
    },
  });

  const handleFormSubmit = async (data: RegisterFormValues) => {
    setServerError(null);
    if (onSubmit) {
      await onSubmit(data);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error || 'Error al crear la cuenta');
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setServerError('Ocurrió un error al intentar registrar la cuenta. Intenta de nuevo.');
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
        <Label htmlFor="reg-name">Nombre Completo</Label>
        <Input
          id="reg-name"
          type="text"
          placeholder="Juan Pérez"
          autoComplete="name"
          {...register('name')}
        />
        {errors.name && (
          <p className="text-sm font-medium text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-email">Correo Electrónico</Label>
        <Input
          id="reg-email"
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
        <Label htmlFor="reg-password">Contraseña</Label>
        <Input
          id="reg-password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          autoComplete="new-password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm font-medium text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
      </Button>
    </form>
  );
}

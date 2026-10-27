'use client';

import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function LoginPage() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="border-border shadow-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa a tu cuenta para publicar subastas y realizar ofertas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />

          <div className="mt-6 p-3 rounded-lg bg-muted/60 border border-border text-xs space-y-1">
            <p className="font-semibold text-foreground">Credenciales de prueba del seed:</p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Admin:</span> admin@bidhub.internal / Admin123!
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Usuario:</span> carlos@bidhub.internal / User123!
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            ¿No tienes una cuenta?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

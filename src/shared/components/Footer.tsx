'use client';

import { useI18n } from '../hooks/useI18n';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border/40 bg-muted/20 py-8 text-center text-xs text-muted-foreground">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} {t('footer.rights')}</p>
        <p className="text-muted-foreground/80">Plataforma fullstack de subastas impulsada por Next.js 16 y Lumen.</p>
      </div>
    </footer>
  );
}

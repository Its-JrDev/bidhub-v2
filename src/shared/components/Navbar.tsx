'use client';

import Link from 'next/link';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useI18n, type Language } from '../hooks/useI18n';
import { Button } from './ui/button';

interface NavbarProps {
  variant?: 'public' | 'private' | 'admin';
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const { user, loading, logout } = useCurrentUser();
  const { lang, setLang, t } = useI18n();

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'es' ? 'en' : 'es';
    setLang(nextLang);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold text-sm shadow-sm">
              BH
            </span>
            <span>BidHub</span>
          </Link>

          <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
            <Link
              href="/auctions"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {t('nav.auctions')}
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('nav.dashboard')}
                </Link>
                <Link
                  href="/auctions/new"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t('nav.newAuction')}
                </Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="text-primary font-semibold transition-colors hover:underline"
              >
                {t('nav.admin')}
              </Link>
            )}
          </nav>
        </div>

        {/* Right Actions: i18n + Auth */}
        <div className="flex items-center gap-3">
          {/* Visible Language Selector (Requirement 9) */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-accent hover:text-accent-foreground"
            title="Cambiar idioma / Change language"
          >
            🌐 {lang.toUpperCase()}
          </button>

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="hidden sm:inline-block text-xs text-muted-foreground">
                    {user.name} ({user.role})
                  </span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    {t('nav.logout')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      {t('nav.register')}
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}

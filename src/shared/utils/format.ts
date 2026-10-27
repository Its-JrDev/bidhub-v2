export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date | number, locale = 'es'): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Masks bidder identity to comply with privacy requirement (Rule 18):
 * Displays masked alias (e.g. "Al*** C***" or "j***@***.com") rather than full name or email.
 */
export function maskBidder(name: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return parts
      .map((part) => (part.length <= 2 ? `${part[0]}*` : `${part.slice(0, 2)}${'*'.repeat(Math.min(part.length - 2, 4))}`))
      .join(' ');
  }
  if (email && email.includes('@')) {
    const [user, domain] = email.split('@');
    const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user.slice(0, 2)}***`;
    return `${maskedUser}@${domain}`;
  }
  return 'Usuario Anónimo';
}

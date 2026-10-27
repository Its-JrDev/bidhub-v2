'use client';

import { create } from 'zustand';

export type Language = 'es' | 'en';

interface I18nStore {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    'nav.auctions': 'Subastas',
    'nav.dashboard': 'Mi Panel',
    'nav.newAuction': 'Publicar Subasta',
    'nav.admin': 'Administración',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.logout': 'Cerrar Sesión',
    'home.hero.title': 'Subastas exclusivas de artículos de colección',
    'home.hero.subtitle': 'Encuentra cartas raras, relojes vintage, vinilos de primera edición y figuras de culto. Puja seguro en BidHub.',
    'home.explore': 'Explorar Catálogo',
    'home.featured': 'Subastas Destacadas',
    'auction.currentPrice': 'Oferta Actual',
    'auction.startingPrice': 'Precio Inicial',
    'auction.minIncrement': 'Incremento Mínimo',
    'auction.timeRemaining': 'Tiempo Restante',
    'auction.bidsCount': 'ofertas',
    'auction.placeBid': 'Pujar Ahora',
    'auction.status.active': 'Activa',
    'auction.status.closed': 'Cerrada',
    'auction.status.deserted': 'Desierta',
    'auction.status.cancelled': 'Cancelada',
    'footer.rights': 'Todos los derechos reservados. BidHub Inc.',
  },
  en: {
    'nav.auctions': 'Auctions',
    'nav.dashboard': 'Dashboard',
    'nav.newAuction': 'Create Auction',
    'nav.admin': 'Admin Panel',
    'nav.login': 'Sign In',
    'nav.register': 'Sign Up',
    'nav.logout': 'Sign Out',
    'home.hero.title': 'Exclusive Collectibles Online Auctions',
    'home.hero.subtitle': 'Discover rare cards, vintage watches, first-press vinyl records, and collectible figures. Bid securely on BidHub.',
    'home.explore': 'Explore Catalog',
    'home.featured': 'Featured Auctions',
    'auction.currentPrice': 'Current Bid',
    'auction.startingPrice': 'Starting Price',
    'auction.minIncrement': 'Minimum Increment',
    'auction.timeRemaining': 'Time Remaining',
    'auction.bidsCount': 'bids',
    'auction.placeBid': 'Bid Now',
    'auction.status.active': 'Active',
    'auction.status.closed': 'Closed',
    'auction.status.deserted': 'Deserted',
    'auction.status.cancelled': 'Cancelled',
    'footer.rights': 'All rights reserved. BidHub Inc.',
  },
};

export const useI18n = create<I18nStore>((set, get) => ({
  lang: 'es',
  setLang: (lang) => set({ lang }),
  t: (key: string) => {
    const current = get().lang;
    return translations[current]?.[key] || translations.es[key] || key;
  },
}));

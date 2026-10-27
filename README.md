# BidHub v2 — Plataforma Fullstack de Subastas de Coleccionables

Aplicación fullstack desarrollada con **Next.js 16 (App Router + Turbopack)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM (Supabase/PostgreSQL)**, **Zustand** y arquitectura modular generada con **Lumen CLI**.

---

## 🚀 Características y Arquitectura

- **Fullstack Autónomo**: Sin dependencias de APIs externas. Todo el estado y persistencia residen en PostgreSQL / Supabase y se gestionan mediante route handlers nativos de Next.js.
- **Route Groups**: Organización limpia y sin impacto en URL:
  - `(public)`: Inicio (SSG ISR 60s), Catálogo con filtros reactivos (SSR), Detalle de subasta con historial y formulario de ofertas en tiempo real.
  - `(auth)`: Login y Registro con validación de esquemas Zod y react-hook-form.
  - `(private)`: Dashboard de usuario (Mis Subastas, Mis Ofertas), Publicar Subasta, Editar Subasta (Reglas 5 y 19).
  - `(admin)`: Panel de administración con métricas globales, CRUD de categorías (Regla 17) y moderación de subastas (Regla 15).
- **Edge Route Guard**: Autenticación perimetral mediante `src/proxy.ts` (Next.js 16 Proxy specification) con tokens JWT (Access Token de 15m + Refresh Token de 7d en cookies `httpOnly`, `SameSite=lax`, `secure`).
- **Temporizador Seguro**: Componente `CountdownTimer` implementado con `useSyncExternalStore` para prevenir discrepancias y hydration errors entre servidor y cliente.
- **Internacionalización**: Hook `useI18n` con diccionarios bilingües (Español / Inglés) y selector de idioma reactivo.
- **Contenedores**: `Dockerfile` optimizado multi-stage y `docker-compose.yml` para despliegues instantáneos con PostgreSQL.

---

## 📋 Matriz de Cumplimiento de Reglas de Negocio

| Regla | Descripción | Implementación en BidHub |
| :--- | :--- | :--- |
| **1** | Precio inicial > 0, incremento mínimo > 0, fecha de cierre definida. | Validado en `CreateAuction.schema.ts` y en `POST /api/auctions`. |
| **2** | Fecha de cierre entre 1 hora y 7 días desde la publicación. | Función `validateAuctionDuration` en `src/shared/utils/auction-rules.ts`. |
| **3** | Cada subasta pertenece a una categoría existente. | Relación `Category` en Prisma y validación FK en backend. |
| **4** | Máximo 5 subastas activas por vendedor al mismo tiempo. | Control atómico `db.auction.count({ where: { sellerId, status: 'ACTIVE' } }) <= 5`. |
| **5** | El vendedor solo puede editar si no tiene ofertas y está activa. | Validado en `PUT /api/auctions/[id]` y bloqueado en frontend `auctions/[id]/edit`. |
| **6** | Un usuario no puede ofertar en su propia subasta. | Validado en `POST /api/auctions/[id]/bids` y bloqueado en `BidForm.tsx`. |
| **7** | Solo se puede ofertar en subastas activas (no cerradas ni canceladas). | Verificación de estado calculado en `POST /api/auctions/[id]/bids`. |
| **8** | Primera oferta >= precio inicial; siguientes >= oferta actual + incremento mínimo. | Lógica de comparación monetaria estricta con control de concurrencia en `$transaction`. |
| **9** | El usuario con la oferta más alta no puede volver a ofertar consecutivamente. | Bloqueado en backend (`highestBid.bidderId === session.userId`) y avisado en UI. |
| **10** | Las ofertas no se pueden editar ni eliminar. | No se exponen endpoints de mutación ni eliminación para ofertas (`bids`). |
| **11** | Extensión anti-sniper: oferta en los últimos 5 minutos extiende el cierre 5 min. | Función `checkSniperExtension` ejecutada en cada oferta válida. |
| **12 & 13** | Estados: `ACTIVE`, `CLOSED` (con ganador), `DESERTED` o `CANCELLED`. Sin depender de crons externos. | Motor de cálculo determinista `computeAuctionStatus` evaluado al instante de la consulta. |
| **14** | Vendedor puede cancelar su subasta únicamente si no tiene ofertas. | Endpoint `DELETE /api/auctions/[id]` verifica `bids.length === 0`. |
| **15** | Administrador puede cancelar cualquier subasta activa con motivo obligatorio. | Endpoint `POST /api/admin/auctions/[id]/cancel` registra `cancellationReason`. |
| **16** | Subastas canceladas o cerradas se conservan con su historial de ofertas. | Soft-close: los registros persisten en base de datos sin borrado físico. |
| **17** | Una categoría con subastas asociadas no se puede eliminar. | Validado en `DELETE /api/categories/[id]` (retorna HTTP 409 Conflict). |
| **18** | Privacidad: historial público muestra monto y fecha con alias enmascarado. | Utilidad `maskBidder` (ej: `C***** P*****`), postor actual ve `(Tú)`. |
| **19** | Prohibido editar o cancelar subastas ajenas mediante manipulación de URL. | Verificación estricta de propiedad `sellerId === session.userId` en backend y frontend. |
| **20** | Usuario solo puede ver el listado completo de sus propias ofertas. | Endpoint `GET /api/bids/me` filtra exclusivamente por `bidderId = session.userId`. |

---

## 👥 Credenciales de Prueba (Seed)

La base de datos cuenta con un seeder completo (`prisma/seed.ts`) con subastas en los 4 estados:

| Rol | Correo Electrónico | Contraseña | Descripción |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@bidhub.internal` | `Admin123!` | Moderación y gestión de categorías |
| **Usuario 1** | `carlos@bidhub.internal` | `User123!` | Vendedor de Cartas Pokémon y Coleccionables |
| **Usuario 2** | `mariana@bidhub.internal` | `User123!` | Postor activo y coleccionista |
| **Usuario 3** | `lucas@bidhub.internal` | `User123!` | Postor en relojes y cómics |

---

## 🛠️ Puesta en Marcha

### 1. Iniciar Base de Datos Local con Docker
```bash
docker compose up -d postgres
```

### 2. Sincronizar Esquema y Ejecutar Seed
```bash
npx prisma db push
npx prisma db seed
```

### 3. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 🧪 Verificación de Calidad

```bash
# Comprobación de tipos estricta (0 errores)
npm run typecheck

# Auditoría de linter ESLint y React 19 Compiler (0 errores, 0 advertencias)
npm run lint

# Construcción de producción optimizada con Turbopack
npm run build

# Diagnóstico de salud de Lumen
lm doctor
```

---

## 📦 Estructura del Proyecto

```
bidhub-v2/
├── prisma/
│   ├── schema.prisma       # Modelos: User, Category, Auction, Bid
│   └── seed.ts             # Datos iniciales con todas las categorías y 4 estados
├── src/
│   ├── app/
│   │   ├── (admin)/admin/  # Panel de administración, categorías y moderación
│   │   ├── (auth)/         # login y register
│   │   ├── (private)/      # dashboard, auctions/new, auctions/[id]/edit
│   │   ├── (public)/       # home (ISR 60s), catálogo (SSR), auctions/[id] (SSR)
│   │   ├── api/            # 14 Route Handlers fullstack (NextRequest/NextResponse)
│   │   ├── layout.tsx      # Root layout con Navbar y Footer
│   │   └── proxy.ts        # Edge Route Guard (Next.js 16 auth proxy)
│   ├── features/           # Módulos por dominio: admin, auctions, auth, bids, categories
│   └── shared/             # Primitives UI, stores Zustand, hooks y utilidades
├── Dockerfile              # Multi-stage production build
├── docker-compose.yml      # Configuración de servicios PostgreSQL + App
└── README.md
```

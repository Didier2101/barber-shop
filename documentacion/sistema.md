# Documentación del Sistema: Barber Shop

> [!NOTE]
> Este documento contiene la arquitectura completa, estructura, stack tecnológico y reglas de negocio del sistema de gestión para la barbería.

## 1. Stack Tecnológico

El sistema está construido como una aplicación web moderna orientada al rendimiento y la experiencia de usuario.

### Frontend
- **Framework Core**: Next.js 15 (App Router) y React 19.
- **Estilos y UI**: TailwindCSS v4, Framer Motion (para micro-animaciones fluidas).
- **Iconografía**: Lucide React.
- **Notificaciones**: Sonner (Toast) y SweetAlert2 (Modales complejos).
- **Componentes extra**: React Day Picker (Calendarios).

### Gestión del Estado y Fetching
- **Server State**: React Query (`@tanstack/react-query`) para fetching, caché y mutaciones.
- **Global Client State**: Zustand (para estados de la interfaz).

### Backend y Base de Datos
- **Backend as a Service (BaaS)**: Supabase (PostgreSQL).
- **Autenticación**: Supabase Auth (Roles: `owner`, `barber`, `client`).
- **Validación de esquemas**: Zod.

---

## 2. Arquitectura de Carpetas

La estructura sigue las convenciones de Next.js App Router, dividiendo la aplicación en rutas públicas y privadas protegidas por roles.

```text
src/
├── app/
│   ├── (public)/              # Páginas accesibles por cualquier usuario (Landing, Login, Register, Contacto, Servicios, etc.)
│   ├── (private)/             # Rutas protegidas que requieren autenticación
│   │   ├── (owners)/          # Panel del Dueño (Gestión total del negocio)
│   │   ├── (barbers)/         # Panel del Barbero (Gestión de su propia agenda y clientes)
│   │   └── (clients)/         # Panel del Cliente (Gestión de sus reservas y perfil)
│   ├── api/                   # Endpoints del servidor (Next.js API Routes)
│   │   ├── admin/             # Endpoints para acciones críticas (crear/eliminar usuarios)
│   │   ├── barbers/           # Endpoints específicos para lógicas de barberos
│   │   └── services/          # Endpoints para servicios
│   ├── actions/               # Server actions genéricas
│   └── globals.css            # Estilos globales y tokens
├── components/                # Componentes de UI reutilizables
│   ├── forms/                 # Componentes de formularios estandarizados
│   └── headers/               # Navbars y headers (públicos y privados)
├── hooks/                     # Custom Hooks (Lógica de negocio y fetching separada de la UI)
│   ├── barber/                # Hooks para React Query del Barbero (Agenda, Finanzas, Clientes, Stats)
│   ├── client/                # Hooks para React Query del Cliente (Reservas, Promociones)
│   └── owner/                 # Hooks para React Query del Dueño (BaseData, Gastos, Liquidaciones, Equipo, Servicios)
├── lib/                       # Utilidades de terceros (Configuración de Supabase, validaciones, utilidades de clases)
├── providers/                 # Providers de contexto (React Query, Auth, Theme)
├── store/                     # Stores globales de Zustand
└── types/                     # Definiciones estrictas de TypeScript (Esquema de BD e interfaces)
```

---

## 3. Esquema de Base de Datos (Entidades Principales)

El modelo de datos se define en `src/types/index.ts` y mapea las tablas en Supabase.

### 3.1. Usuarios (`Profile`)
Maneja a todos los usuarios del sistema. Los perfiles son creados tras el registro en Supabase Auth.
- **Roles permitidos**: `'owner' | 'barber' | 'client'`
- **Campos clave**: `id`, `name`, `role`, `is_active`, `commission_percentage` (solo para barberos).

### 3.2. Citas (`Appointment`)
El corazón del sistema transaccional.
- **Estados de Cita**: `'pending' | 'confirmed' | 'completed' | 'cancelled' | 'walk-in' | 'occupied'`.
- **Relaciones**:
  - `client_id` (Opcional si es walk-in)
  - `barber_id` (Barbero que atenderá)
  - `services_data` (Lista de servicios prestados)
  - `settlement_id` (Identifica si esta cita ya fue pagada al barbero).
  - `applied_promo_id` (Promoción aplicada).

### 3.3. Servicios (`Service`)
Catálogo de servicios ofrecidos.
- **Campos clave**: `price`, `duration`, `is_active`.

### 3.4. Liquidaciones (`Settlement`)
Registro de pagos a los barberos por su trabajo.
- **Campos clave**: `total_revenue` (Ingreso bruto), `barber_earnings` (Corte del barbero), `owner_earnings` (Ganancia del local), `commission_applied`.

### 3.5. Gastos (`Expense`) y Categorías
Manejo financiero del local.
- **Campos clave**: `amount`, `category`, `period` (Agrupación mensual Ej. 'YYYY-MM').

### 3.6. Promociones (`Promotion`) y Lealtad (`LoyaltySettings`)
Sistemas de retención de clientes.
- **Promociones**: Tienen un tipo de descuento (`'percentage' | 'fixed' | 'free'`) y periodo de validez.
- **Lealtad**: Recompensa después de `N` citas (threshold).

---

## 4. Paneles y Vistas (Dashboards)

### 4.1. Dashboard Dueño (Owner)
El dueño tiene acceso completo a la gestión y configuración del negocio.
- **`/team`**: Gestión de barberos (activar/desactivar, cambiar comisión, crear liquidaciones por servicios pendientes).
- **`/schedules`**: Configuración de horarios de apertura del negocio (`BusinessHour`).
- **`/services`**: CRUD de los servicios ofrecidos.
- **`/expenses`**: Seguimiento de gastos y flujo de caja del local.
- **`/clients`**: Lista maestra de todos los clientes (ver detalles o banear/desactivar).
- **`/promotions`**: Creación de campañas de marketing y configuración del sistema de fidelización.
- **`/settings`**: Configuración general del local (nombre, logo, costos fijos).

### 4.2. Dashboard Barbero (Barber)
Vista optimizada para la operación diaria del barbero.
- **`/agenda`**: Calendario personal interactivo con sus citas, permite registrar walk-ins, completar o cancelar reservas.
- **`/stats`**: Estadísticas personales (ingresos, cortes realizados).
- **`/clients`**: Base de clientes que se han atendido históricamente con él.
- **`/profile`**: Edición de redes sociales (`BarberSocial`) y datos personales.

### 4.3. Dashboard Cliente (Client)
Vista de autogestión para los usuarios finales.
- **`/reservas`**: Interfaz de reserva (`select-barber` -> fechas/horas libres -> confirmación). Visualización del historial y estado de citas.
- **`/profile`**: Datos personales.

---

## 5. Lógica de Negocio y Data Fetching (Hooks)

Para mantener los componentes limpios de lógicas complejas, se aislaron todas las llamadas a la base de datos y React Query en la carpeta `/hooks`.

- **Liquidaciones**: Al liquidar a un barbero (`createSettlement` en `useOwnerMutations`), se registran en una tabla `settlements` y a su vez se actualizan todas las citas (`appointments`) involucradas inyectándoles el `settlement_id`, para que ya no cuenten como "pendientes".
- **Finanzas**: Se calcula el corte del barbero aplicando su `commission_percentage` al precio de los servicios.
- **React Query Cache**: Cada mutación (crear, editar, eliminar) se encarga de invalidar las *query keys* relevantes (ej. `owner-base-data`, `barber-pending-settlement`) para reaccionar en tiempo real en la UI sin tener que refrescar la pantalla manualmente.

---

## 6. Seguridad y Permisos
- Todo acceso administrativo crítico como **crear o eliminar usuarios** de forma permanente se gestiona a través de *Route Handlers* del servidor en `src/app/api/admin/` utilizando un `service_role_key` de Supabase para evadir el *Row Level Security* (RLS) en operaciones que requieren saltar el límite de Auth del cliente.
- El resto de las operaciones (lectura/escritura de citas, perfiles) están protegidas con RLS directamente en la base de datos de Supabase, validando el rol (`auth.uid()` vs `role`).

## 7. Flujo de Interfaz
- Diseñado con una identidad estética profunda (modo oscuro por defecto, *glassmorphism*, bordes traslúcidos).
- Uso intensivo de notificaciones visuales contextuales y modales interactivos para confirmar acciones destructivas (ej. SweetAlert para confirmación de pagos de liquidación y de cancelación de reservas).

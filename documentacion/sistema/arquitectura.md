# Arquitectura y Seguridad del Sistema

Este documento describe la base técnica de BarberShop y cómo garantizamos la integridad de los datos entre diferentes usuarios.

## 🏗️ Estructura de Ruteo (ID-Isolation)
Para evitar la mezcla de datos y asegurar que cada usuario opere en su propio entorno, el sistema utiliza **Ruteo Dinámico Basado en ID**.

### Patrones de URL:
*   **Clientes:** `/dashboard/client/[id]/...`
*   **Barberos:** `/dashboard/barber/[id]/...`
*   **Dueño:** `/dashboard/owner/...` (Acceso centralizado)

## 🔐 Seguridad de Acceso
El sistema implementa tres capas de validación:

1.  **Middleware (Edge Level):**
    *   Valida la existencia de una cookie de autenticación (`barbershop-auth`).
    *   Impide que usuarios no autenticados entren a rutas `/dashboard`.
2.  **Validación de Sesión (Layout Level):**
    *   En el `(private)/layout.tsx`, el sistema verifica en cada carga si la sesión de Supabase sigue activa y si el perfil del usuario existe en la base de datos.
    *   **Ghost Sessions:** Si un usuario es eliminado de la DB pero mantiene datos en `localStorage`, el layout detecta la discrepancia, limpia el store y lo redirige a `/`.
3.  **Ownership Guard (Role Level):**
    *   Cada layout de rol (`(clients)`, `(barbers)`) valida que el `id` en la URL coincida con el `id` del usuario logueado.
    *   *Ejemplo:* Si el Cliente A intenta entrar manualmente a `/dashboard/client/ID-DEL-CLIENTE-B`, el sistema lo detecta y lo redirige forzosamente a su propio dashboard.

## 💾 Persistencia de Datos
*   **Estado Global:** Se utiliza `Zustand` con persistencia en `localStorage`.
*   **Base de Datos:** Supabase (PostgreSQL) con políticas de seguridad de nivel de fila (RLS) pendientes de endurecimiento final.

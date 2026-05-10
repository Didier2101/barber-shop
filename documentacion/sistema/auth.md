# Flujo: Autenticación y Registro

Proceso técnico y de usuario para el acceso a la plataforma.

## 📝 Registro de Usuario (`/register`)
1.  **Ingreso de Datos:** El usuario ingresa Nombre, Email y Contraseña.
2.  **Lógica del Sistema:**
    *   Se crea el usuario en `auth.users` de Supabase.
    *   Se dispara un trigger o inserción manual en la tabla `public.profiles` con el rol predeterminado de `client`.
    *   **Redirección Dinámica:** El sistema redirige inmediatamente a `/dashboard/client/[nuevo-id]`.

## 🔑 Inicio de Sesión (`/login`)
1.  **Validación de Credenciales:** El sistema verifica el email y password.
2.  **Carga de Perfil:** Se recupera el rol del usuario desde la tabla `profiles`.
3.  **Ruteo por Rol:**
    *   Si es `owner` → `/dashboard/owner`
    *   Si es `barber` → `/dashboard/barber/[id]`
    *   Si es `client` → `/dashboard/client/[id]`
4.  **Cookie de Sesión:** Se establece la cookie `barbershop-auth` para que el Middleware permita el acceso a las rutas privadas.

## 🚪 Cierre de Sesión (Logout)
1.  **Limpieza:** Se invoca `supabase.auth.signOut()`.
2.  **Estado Global:** Se ejecuta `clearStore()` de Zustand para borrar datos del usuario del navegador.
3.  **Cookie:** Se elimina la cookie de autenticación.
4.  **Redirección:** El usuario es enviado a la landing page pública `/`.

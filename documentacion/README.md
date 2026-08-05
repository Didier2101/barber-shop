# Documentación BarberShop ERP v1.0

Bienvenido a la documentación oficial del sistema BarberShop. Este documento sirve como guía maestra para entender el funcionamiento, los flujos de usuario y la lógica de negocio de la plataforma.

## 👥 Roles del Sistema
El sistema opera bajo un modelo multi-inquilino (Multi-tenant) con tres niveles de acceso:
1.  **Dueño (Owner):** Control total de la barbería, finanzas, equipo y configuración.
2.  **Barbero (Barber):** Gestión de agenda propia, visualización de ingresos y perfil profesional.
3.  **Cliente (Client):** Reserva de citas, seguimiento de historial y programa de lealtad.

## 📖 Contenido de la Documentación

### 🛡️ Sistema, Arquitectura y Seguridad
*   [Referencia Completa del Sistema (Stack, BD, Flujos)](sistema.md): Documentación global de las entidades, tech stack y estructura general.
*   [Arquitectura y Seguridad](sistema/arquitectura.md): Explicación del ruteo por ID y validación de sesiones.
*   [Blindaje de Promociones](sistema/seguridad_promociones.md): Lógica de bloqueo y seguridad en ofertas.

### 👤 Manual de Clientes
*   [Flujo: Autenticación y Registro](../sistema/auth.md)
*   [Flujo: Reserva de Cita Estándar](reserva_estandar.md)
*   [Flujo: Reserva desde Promoción](reserva_promo.md)
*   [Mi Cuenta y Lealtad](mi_cuenta.md)

### ✂️ Manual de Barberos
*   [Gestión de Agenda y Flujo de Trabajo](duenos/gestion_agenda.md): Timeline continuo y aprobación de citas.
*   [Finanzas y Perfil Profesional](finanzas_perfil.md)

### 💼 Manual de Dueños
*   [Gestión de Equipo (Barberos)](gestion_equipo.md)
*   [Gestión de Servicios y Marketing](marketing_servicios.md)
*   [Contabilidad y Liquidaciones](finanzas_contabilidad.md)

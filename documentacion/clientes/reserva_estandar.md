# Flujo: Reserva de Cita Estándar

Describe el proceso paso a paso para que un cliente realice una reserva de servicio normal sin promociones aplicadas.

## 🏃 Pasos del Usuario

### 1. Inicio del Proceso
*   El cliente inicia sesión y es dirigido a su dashboard: `/dashboard/client/[id]`.
*   Hace clic en el botón principal **"Agendar Mi Cita"**.

### 2. Selección de Barbero
*   Se despliega un modal o se navega a la página de selección de barbero (`/reservas/select-barber`).
*   El sistema muestra solo los barberos marcados como **Activos** en la base de datos.
*   El usuario hace clic en el barbero de su preferencia.

### 3. Configuración de la Cita (`/reservas/barber/[barberId]`)
*   **Selección de Servicios:** El cliente marca uno o varios servicios (Corte, Barba, etc.). El sistema suma automáticamente el precio y la duración total.
*   **Selección de Fecha:** Se abre el selector de fecha.
*   **Cálculo de Horarios:** Al elegir una fecha, el sistema ejecuta la lógica de disponibilidad (ver abajo).
*   **Selección de Hora:** El cliente elige un bloque de tiempo disponible.

### 4. Confirmación
*   El cliente hace clic en **"Confirmar Reserva"**.
*   El sistema muestra un mensaje de éxito y redirige a la pestaña **"Mis Reservas"**.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Cálculo de Disponibilidad:**
    *   El sistema consulta los `business_hours` (Horarios de apertura) del día seleccionado.
    *   Consulta la tabla `appointments` para traer todas las citas ya agendadas de ese barbero en esa fecha específica.
    *   Divide la jornada en bloques de 15 minutos.
    *   Filtra los bloques donde la duración total de los servicios seleccionados no se solape con citas existentes ni con el horario de cierre.
2.  **Registro en DB:**
    *   Se crea un registro en la tabla `appointments` con estado `pending`.
    *   Se guarda el JSON de los servicios en `services_data` para histórico, permitiendo que los precios cambien en el futuro sin afectar citas pasadas.

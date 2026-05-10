# Flujo: Gestión de Agenda y Citas (Barbero)

Describe cómo el barbero interactúa con las reservas realizadas por los clientes y gestiona su jornada.

## 🏃 Pasos del Usuario

### 1. Visualización de la Agenda (`/dashboard/barber/[id]/agenda`)
*   El barbero accede a su calendario personal.
*   El sistema carga las citas del día por defecto.
*   **Diferenciación visual:** Las citas se muestran con colores según su estado (Pendiente, Confirmada, Completada).

### 2. Gestión de Estados de Cita
*   **Confirmar:** Al iniciar la jornada o recibir la notificación, el barbero marca la cita como "Confirmada".
*   **Completar:** Una vez finalizado el servicio, el barbero marca la cita como "Completada". 
    *   *Nota:* Al completar, el sistema activa automáticamente el cálculo de comisión y suma el servicio al contador de lealtad del cliente.
*   **Cancelar:** Si el cliente no asiste, se marca como "Cancelada", liberando el espacio en la agenda.

### 3. Registro de "Walk-ins" (Citas Manuales)
*   Si un cliente llega sin cita previa, el barbero puede usar el formulario de "Venta Rápida" o agendar manualmente desde su panel.
*   El sistema valida que el horario no choque con una cita ya existente.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Sincronización en Tiempo Real:**
    *   El sistema utiliza suscripciones de Supabase (Realtime) para que la agenda del barbero se actualice apenas un cliente realiza una reserva.
2.  **Cálculo de Productividad:**
    *   Cada vez que una cita pasa a `completed`, el sistema incrementa el campo `services_completed` en el perfil del barbero.
    *   Esto alimenta las estadísticas de "Barbero del Mes" y niveles de maestría.

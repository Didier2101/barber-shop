# Flujo: Mi Cuenta y Preferencias (Cliente)

Describe cómo el cliente gestiona sus datos personales y visualiza su fidelidad.

## 🏃 Pasos del Usuario (`/dashboard/client/[id]/profile`)

### 1. Actualización de Datos
*   El cliente puede actualizar su Nombre, Teléfono y Foto de perfil.
*   **Privacidad:** Puede consultar las políticas de manejo de datos aceptadas durante el registro.

### 2. Consulta de Historial
*   En la sección de "Mis Reservas", el cliente puede ver un listado de todas sus citas pasadas.
*   **Reseñas:** Si una cita está completada, el cliente puede dejar una calificación (1-5 estrellas) y un comentario que se verá en el perfil del barbero.

### 3. Seguimiento de Lealtad (Loyalty Tracking)
*   En su dashboard, el cliente visualiza una barra de progreso.
*   El sistema le indica cuántas visitas le faltan para obtener su próximo beneficio gratuito.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Cálculo de Progreso:**
    *   El sistema cuenta las citas con `status: 'completed'` y `is_loyalty_reward: false`.
    *   **Regla de Oro:** Las citas agendadas mediante **Promociones** (ej: descuentos del 20%, 50%, etc.) **SI SUMAN** al contador de lealtad para obtener el premio gratuito.
    *   El conteo es dinámico; si una cita se marca como completada, la barra de progreso se actualiza inmediatamente mediante el hook `useLoyaltySettings`.
2.  **Validación de Reseñas:**
    *   El sistema solo permite calificar citas que estén en estado `completed` para asegurar que las reseñas sean reales.
    *   El promedio de estrellas del barbero se recalcula automáticamente en su perfil público.

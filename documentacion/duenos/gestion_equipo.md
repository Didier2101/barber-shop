# Flujo: Gestión de Equipo y Barberos (Dueño)

Proceso de administración de los recursos humanos de la barbería.

## 🏃 Pasos del Usuario (`/dashboard/owner/team`)

### 1. Alta de un Barbero
*   El dueño registra al barbero (esto suele ser mediante invitación o creación de cuenta).
*   **Configuración Crítica:** El dueño define el `commission_percentage` (ej: 50% para el barbero, 50% para la casa).

### 2. Edición y Estados
*   **Activo/Inactivo:** El dueño puede desactivar a un barbero (ej: por vacaciones o renuncia). Un barbero inactivo **desaparece** de la lista de selección para los clientes, pero sus datos históricos se mantienen para contabilidad.
*   **Actualización de Comisión:** Si un barbero asciende de categoría, el dueño puede ajustar su porcentaje de comisión desde su panel.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Protección de Integridad:**
    *   No se pueden eliminar barberos que tengan citas asociadas. En su lugar, el sistema recomienda marcarlos como `is_active: false`.
2.  **Sincronización de Perfiles:**
    *   Cualquier cambio en el nombre o apodo realizado por el dueño se refleja inmediatamente en la interfaz de reserva del cliente.
3.  **Control de Acceso:**
    *   Solo el rol `owner` tiene permiso para realizar escrituras (`INSERT/UPDATE/DELETE`) sobre la tabla de perfiles de otros empleados.

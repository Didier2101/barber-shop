# Flujo: Contabilidad y Liquidaciones (Dueño)

Describe la gestión financiera global y el proceso de pago al equipo.

## 🏃 Pasos del Usuario

### 1. Liquidación de Comisiones (`/dashboard/owner/liquidations`)
*   El sistema muestra un resumen de las citas completadas por cada barbero que aún no han sido pagadas.
*   El dueño selecciona las citas a pagar y genera una **Liquidación**.
*   **Resultado:** El sistema calcula el total a pagar al barbero y lo que queda para la barbería (basado en comisiones).
*   Se genera un registro histórico del pago.

### 2. Gestión de Gastos (`/dashboard/owner/expenses`)
*   El dueño registra gastos operativos (Arriendo, Servicios, Productos).
*   El sistema resta estos gastos de la utilidad bruta para mostrar la **Utilidad Neta** real.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Cierre de Citas (`settlement_id`):**
    *   Para evitar el doble pago, cada cita tiene un campo `settlement_id`.
    *   Cuando una cita se liquida, se le asigna el ID de la liquidación generada. Las citas con un ID asignado dejan de aparecer en la lista de "pendientes por pagar".
2.  **Reportes Globales:**
    *   El dashboard principal del dueño suma todos los ingresos de la tabla `appointments` y resta los gastos de `expenses` para dar una visión de 360 grados del negocio.
3.  **Seguridad Contable:**
    *   Una vez que una cita ha sido liquidada, se bloquea su edición de precio para asegurar que la contabilidad histórica no sea alterada.

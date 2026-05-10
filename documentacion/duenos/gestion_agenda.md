# Gestión de Agenda y Flujo de Trabajo (Barberos)

Este documento detalla el funcionamiento de la **Agenda Inteligente** y el flujo de vida de una cita desde que el cliente reserva hasta que se liquida en las cuentas.

## 1. Estructura de la Agenda (Timeline)

La agenda del barbero ya no es una vista estática de un solo día. Ahora utiliza un sistema de **Línea de Tiempo Continua** organizada en tres niveles de prioridad:

### A. Solicitudes Pendientes (Prioridad Máxima)
*   **Ubicación:** Parte superior de la pantalla, resaltada en color ámbar.
*   **Contenido:** Todas las citas que el barbero aún no ha aceptado, sin importar la fecha (hoy, mañana o próxima semana).
*   **Acción:** El barbero debe **"Aprobar"** o **"Rechazar"**. Hasta que no se apruebe, la cita no ocupa espacio en el cronograma oficial.

### B. Agenda de Hoy
*   **Ubicación:** Sección central.
*   **Contenido:** Citas confirmadas para el día actual.
*   **Acción:** Al finalizar el servicio, el barbero debe tocar el botón **"Finalizar y Cobrar"**. Esto dispara los cálculos financieros.

### C. Próximas Citas (Timeline Futuro)
*   **Ubicación:** Parte inferior, debajo de hoy.
*   **Contenido:** Todas las citas confirmadas para días futuros, agrupadas por fecha (ej: "Lunes 11 de Mayo").
*   **Visualización:** Permite al barbero planificar su semana haciendo scroll infinito hacia abajo.

---

## 2. Flujo de Estados de una Cita

| Estado | Origen | Acción del Barbero | Resultado |
| :--- | :--- | :--- | :--- |
| **Pendiente** | Cliente reserva desde la App | Botón "Aprobar" | Pasa a la agenda del día correspondiente. |
| **Confirmada** | Barbero aprueba o crea Walk-in | Botón "Finalizar y Cobrar" | La cita se liquida y suma dinero a las finanzas. |
| **Completada** | Barbero da clic en Cobrar | Ninguna (Historial) | El dinero ya está en la billetera y el cliente recibe puntos de lealtad. |
| **Cancelada** | Barbero rechaza o cliente cancela | Ninguna | El espacio queda libre en el calendario. |

---

## 3. Registro de Ventas Rápidas (Walk-in)

Para clientes que llegan sin cita previa a la barbería:
1.  Usar el botón **"Registrar Venta Rápida"** en el Dashboard.
2.  Al completar el formulario, la cita entra directamente como **Completada**.
3.  **Beneficio:** No requiere aprobación manual; el dinero se suma instantáneamente a las cuentas del día.

---

## 4. Responsividad y Usabilidad Móvil

La interfaz ha sido optimizada para un uso 100% móvil:
*   **Navegación:** Se utiliza exclusivamente la barra inferior (Bottom Nav) para evitar menús laterales estorbosos.
*   **Gestos:** Los botones de acción principal (Aprobar/Cobrar) están diseñados para ser operados fácilmente con el pulgar.
*   **Truncado Inteligente:** Los nombres largos de clientes o servicios nunca desbordan la pantalla; se acortan automáticamente con puntos suspensivos para mantener la elegancia visual.

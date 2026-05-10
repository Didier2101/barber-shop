# Flujo: Gestión de Servicios y Promociones (Dueño)

Describe cómo el administrador configura el catálogo de la barbería y las estrategias de marketing.

## ✂️ Gestión de Servicios (`/dashboard/owner/services`)

### 1. Creación de Catálogo
*   El dueño ingresa Nombre, Precio y Duración.
*   **Importante:** La duración es clave para el algoritmo de disponibilidad de citas.

### 2. Eliminación y Seguridad
*   Un servicio puede ser eliminado. Esto no afecta a las citas ya completadas, ya que estas guardan una copia (`services_data`) del servicio en el momento de la reserva.

---

## 🎁 Marketing y Lealtad (`/dashboard/owner/promotions`)

El sistema centraliza las estrategias de fidelización y ofertas en un solo panel, pero separa las acciones de edición en páginas independientes para mayor claridad.

### 1. Lista de Ofertas y Fidelización
*   **Fidelización:** Configuración rápida del programa de puntos (Meta de visitas).
*   **Listado:** Tarjetas visuales de cada promoción activa con resumen de servicios y fechas.

### 2. Creación y Edición (Páginas Dedicadas)
*   **Ruta de Creación:** `/promotions/new`
*   **Ruta de Edición:** `/promotions/[id]/edit`
*   **Comportamiento en la Reserva (UX):**
    *   **Fijación de Servicios:** El sistema forzará que el cliente solo agende los servicios que tú definas en la promo. No podrá agregar ni quitar servicios.
    *   **Vigencia Estricta:** Si defines un día único, el cliente no podrá elegir otra fecha. Si defines un rango, el calendario se limitará a esos días.
    *   **Incentivo de Lealtad:** Las citas con promos suman al contador de "Cortes Gratis", lo que hace tus ofertas mucho más atractivas.

### 2. Control de Eliminación (FK Guard)
*   **Lógica del Sistema:** El sistema no permite borrar una promoción si hay citas que la referencian (Integridad de DB).
*   **Solución implementada:** Al intentar borrar, el sistema primero desvincula la promo de las citas (pone el campo `applied_promo_id` en `null`) para mantener el registro contable y luego elimina la promoción físicamente.

---

## 🏆 Programa de Lealtad (Loyalty)
*   **Configuración:** El dueño define una "Meta de Visitas" (ej: 10 visitas).
*   **Lógica de Conteo:** El sistema cuenta las citas con estado `completed` que NO sean ya un premio.
*   **Compatibilidad con Promociones:** Importante: Las citas donde el cliente aplicó un cupón de descuento **TAMBIÉN SUMAN** al conteo de lealtad. Esto incentiva el uso de promos sin penalizar el progreso del cliente.
*   **Recompensa:** Al llegar al múltiplo exacto (visita 10, 20, 30...), el cliente ve un mensaje de "¡Corte Gratis Disponible!" y el precio de su próxima reserva se calcula en $0 automáticamente.

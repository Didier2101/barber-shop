# Flujo: Reserva desde Promoción (Final)

Este documento detalla el comportamiento automatizado y las reglas de negocio aplicadas cuando un cliente reserva una oferta.

## 🚀 Comportamiento Automatizado

### 1. Inyección de Datos (Cero Clics)
*   Al entrar desde una promo, el sistema identifica los servicios y las fechas de la oferta.
*   **Servicios:** Se auto-seleccionan los servicios vinculados y se **bloquea** cualquier cambio.
*   **Fecha:** 
    *   Si es **Día Único**, el calendario se fija y se inhabilita (`disabled`).
    *   Si es **Rango**, el calendario se restringe para que el usuario solo elija dentro de la vigencia de la promo.

### 2. Blindaje de Interfaz (Locking)
*   Se aplica la propiedad CSS `pointer-events-none` a la sección de servicios para evitar cualquier manipulación accidental.
*   El botón de "Confirmar" solo se activa si hay una hora seleccionada, simplificando el proceso al máximo.

### 3. Retroalimentación de Disponibilidad
*   Si la fecha de la promo coincide con un día en que el barbero está cerrado o no tiene agenda, el sistema muestra un mensaje claro: *"El barbero podría estar cerrado o sin agenda este día (Día de la semana)"*.

---

## 🏆 Integración con Lealtad

*   **Suma de Puntos:** A pesar de ser una reserva con descuento o promoción, esta visita **CUENTA** para el programa de lealtad (visitas para el corte gratis).
*   **Restricción:** El sistema diferencia automáticamente entre una "Promoción" (descuento) y un "Premio de Lealtad" (100% gratis por puntos). Las promociones permiten seguir acumulando puntos, los premios no.

---

## ⚙️ Especificaciones Técnicas
*   **Persistencia:** La `promo_id` se arrastra desde el Dashboard -> Selección de Barbero -> Pantalla de Reserva.
*   **Caché:** Se ha configurado `staleTime: 0` para asegurar que las promociones reflejen cambios inmediatos realizados por el dueño.

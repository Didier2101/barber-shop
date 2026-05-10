# Blindaje de Promociones (Seguridad de Ofertas)

Este documento explica los mecanismos de seguridad implementados para asegurar que las promociones creadas en el sistema se cumplan estrictamente por parte de los clientes.

## 1. Funcionamiento del Guardián de Promociones

Cuando un cliente accede a la reserva a través de una promoción específica (botón "Reservar" en una tarjeta de oferta), el sistema activa el **Modo Blindado**.

### Bloqueos de Selección:
*   **Servicios Fijos:** El sistema pre-selecciona automáticamente los servicios incluidos en la promoción. El cliente **no puede desmarcar** estos servicios ni añadir otros diferentes, asegurando que el precio final coincida con la oferta.
*   **Inmovilización de Interfaz:** Los elementos de selección de servicios se vuelven "solo lectura" (`pointer-events-none`) para evitar manipulaciones accidentales o intencionadas.

## 2. Restricciones de Fecha y Tiempo

### Promociones de Rango (Ej: "Semana del Padre")
*   Si la promoción es válida por un rango de fechas, el calendario de reserva se limita **exclusivamente** a esos días. Los demás días aparecen bloqueados.

### Promociones de Día Único (Ej: "Solo por Hoy")
*   Si la promoción es para una fecha específica, el sistema selecciona automáticamente esa fecha y **bloquea el selector**. El cliente solo puede elegir la **hora** del turno.

## 3. Identificación Visual (Badge de Oferta)

Para dar confianza tanto al cliente como al barbero, cuando una promoción está activa:
1.  Aparece un **Badge Naranja** en la parte superior del formulario de reserva.
2.  Muestra el **Nombre de la Oferta** y la **Fecha de Vencimiento**.
3.  Si este badge no aparece, significa que es una reserva estándar y el precio no tendrá descuento automático.

## 4. Integración con el Sistema de Lealtad

Es importante notar que:
*   Las citas realizadas bajo una promoción **TAMBIÉN suman puntos** al contador de lealtad del cliente (Elite Rewards).
*   Esto incentiva a los clientes a aprovechar las ofertas sin sentir que están perdiendo su progreso hacia el corte gratuito.

---

*Nota: Cualquier intento de acceder a la URL de reserva de una promoción expirada resultará en una redirección a la reserva estándar sin los bloqueos ni los descuentos aplicados.*

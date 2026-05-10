# Flujo: Finanzas y Perfil Profesional (Barbero)

Describe cómo el barbero controla sus ingresos y gestiona su marca personal.

## 🏃 Pasos del Usuario

### 1. Control de Ingresos (`/dashboard/barber/[id]/stats`)
*   El barbero visualiza sus ganancias en tiempo real.
*   **Métricas clave:** Total facturado, Citas completadas y **Comisión Acumulada**.
*   **Estado de Liquidación:** Puede ver qué parte de sus ganancias ya fue pagada por el dueño y qué tiene pendiente de cobro.

### 2. Gestión de Perfil (`/dashboard/barber/[id]/profile`)
*   **Información Pública:** El barbero actualiza su "Apodo" (Nickname) y Biografía, que es lo que los clientes ven al reservar.
*   **Portafolio:** Puede subir su foto de perfil para generar confianza.
*   **Redes Sociales:** Vinculación de Instagram o portafolio externo para mostrar sus cortes.

---

## ⚙️ Lógica del Sistema (Backend/Logic)

1.  **Cálculo de Comisiones:**
    *   El sistema utiliza el `commission_percentage` definido en el perfil del barbero (configurado por el dueño).
    *   Fórmula: `Ganancia Barbero = Precio Cita * (Porcentaje / 100)`.
2.  **Aislamiento de Datos:**
    *   A través de las políticas de seguridad (RLS), un barbero **solo puede ver** sus propias estadísticas y citas. No tiene acceso a los datos de sus compañeros.
3.  **Histórico de Pagos:**
    *   Al consultar sus finanzas, el sistema filtra los registros de la tabla `settlements` donde su ID sea el beneficiario, permitiendo ver el detalle de cada pago recibido.

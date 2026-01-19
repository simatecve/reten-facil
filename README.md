<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# RetenFácil Venezuela

Aplicación web para generar y gestionar comprobantes de retención de IVA del SENIAT en Venezuela, con lectura automática de facturas mediante IA y panel de gestión para empresas, proveedores y equipo.

## Características principales

- **Autenticación y perfiles**
  - Registro de administradores con correo y contraseña.
  - Inicio de sesión mediante Supabase Auth.
  - Perfil de usuario (nombre y teléfono) editable.
  - Soporte para dos roles: `admin` y `operator`.

- **Gestión de empresas (agentes de retención)**
  - Crear, editar y eliminar empresas asociadas al administrador.
  - Campos: razón social, RIF, dirección fiscal. 
  - Carga de **logo**, **firma** y **sello** mediante Supabase Storage.
  - Control interno de **correlativo** (`last_correlation_number`) usado para numerar los comprobantes.

- **Gestión de proveedores**
  - Alta, edición y eliminación de proveedores.
  - Búsqueda por nombre o RIF.
  - Campo de **tasa de retención por defecto** (75% o 100%) que se aplica al crear comprobantes.
  - Ranking de "proveedores más activos" según retenciones emitidas.

- **Wizard de nueva retención (3 pasos)**
  1. Selección de la **empresa emisora** (agente de retención).
  2. Selección o creación del **proveedor**:
     - Búsqueda rápida por nombre o RIF.
     - Opción de **escanear factura** (imagen) con IA para sugerir proveedor, RIF y datos de la factura.
  3. Carga de **facturas** e ítems del comprobante:
     - Fecha, N° factura, N° control, monto total.
     - Cálculo automático de **base imponible**, **IVA** y **monto retenido** según la alícuota (16%) y la tasa de retención (75% o 100%).
     - Posibilidad de agregar varias facturas a un mismo comprobante y eliminar ítems individuales.

- **Generación de comprobantes de retención**
  - Emisión de un comprobante con número correlativo automático por empresa y período fiscal (`YYYYMM` + correlativo de 8 dígitos).
  - Al guardar:
    - Si el proveedor no existe aún, se crea automáticamente.
    - Se sube opcionalmente la **imagen de la factura** al bucket `facturas` en Supabase Storage y se guarda la URL pública.
    - Se actualiza el correlativo de la empresa.
  - Posibilidad de **editar** comprobantes existentes reutilizando los datos guardados.

- **Historial de comprobantes**
  - Listado de todas las retenciones del usuario (o del admin correspondiente).
  - Muestra empresa, proveedor, número de comprobante y total retenido.
  - Acciones por fila:
    - Ver comprobante en detalle (vista SENIAT).
    - Editar comprobante (reabre el wizard en el paso 3 con los datos cargados).

- **Visualización del comprobante (formato SENIAT)**
  - Componente dedicado que presenta el comprobante con el formato oficial del SENIAT:
    - Datos de agente de retención (empresa).
    - Datos del sujeto retenido (proveedor).
    - Tabla de operaciones con IVA, base imponible, montos exentos y montos retenidos.
    - Totales globales de compras, base, IVA y retención.
  - Botones para:
    - Ver la **imagen de la factura** de respaldo (si existe).
    - Descargar el comprobante en **PDF** (renderizado vía `html2canvas` + `jspdf`).

- **Dashboard**
  - Resumen visual de la actividad:
    - Total retenido.
    - IVA gestionado.
    - Número de proveedores y comprobantes.
  - Gráfico de tendencia de retenciones de los últimos 6 meses.
  - Listado de **top proveedores** por monto retenido.

- **Reportes y exportación**
  - Filtros por rango de fechas, empresa y proveedor.
  - Resumen de:
    - Número de comprobantes filtrados.
    - Base imponible total.
    - Total retenido.
  - Tabla de detalles por comprobante.
  - Exportación a:
    - **CSV/Excel**.
    - **PDF** (reporte formateado con `html2canvas` + `jspdf`).

- **Comunidad & soporte**
  - Muro de temas creados por usuarios (tabla `community_topics`).
  - Visualización de un tema con su contenido completo.
  - Sistema de comentarios (tabla `community_comments`).

- **Gestión de equipo (operadores)**
  - Los administradores pueden crear usuarios operador:
    - Alta de usuario vía `supabase.auth.signUp` con email y clave temporal.
    - Creación de perfil asociado con rol `operator` y referencia al `admin_id`.
  - Listado de operadores con opción de eliminación del perfil.

- **Asistente IA integrado**
  - Botón flotante "Asistente IA" que abre un chat contextual.
  - El contexto incluye:
    - Perfil del usuario.
    - Empresas registradas.
    - Últimos comprobantes generados.
  - Usa la API de Gemini (`@google/genai`) para responder dudas fiscales sobre retenciones, porcentajes, etc.'

- **Persistencia local de estado**
  - Se guarda en `localStorage`:
    - Última ruta visitada.
    - Paso del wizard.
    - Empresa, proveedor e ítems en edición.
    - Porcentaje de retención seleccionado.

## Requisitos y configuración

- **Node.js** (versión recomendada LTS).
- **Supabase**:
  - URL y clave `anon` ya configuradas en `lib/supabase.ts`.
  - Opcionalmente, puedes definir `SUPABASE_ANON_KEY` en el entorno para sobrescribir la clave pública.
- **Gemini API**:
  - Debes definir `GEMINI_API_KEY` en un archivo `.env.local` en la raíz del proyecto.
  - Vite lo expone a la app como `process.env.API_KEY`.

## Ejecutar en local

1. Instala las dependencias:
   `npm install`
2. Crea el archivo `.env.local` en la raíz y define tu clave de Gemini:
   `GEMINI_API_KEY=tu_clave_de_gemini`
3. (Opcional) Configura `SUPABASE_ANON_KEY` si quieres usar otra clave pública de Supabase.
4. Inicia el servidor de desarrollo:
   `npm run dev`
5. Abre la aplicación en tu navegador en:
   `http://localhost:3000`

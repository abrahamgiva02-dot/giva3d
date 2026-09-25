# GIVA 3D — Catálogo Profesional de Impresión 3D

Plataforma moderna, tecnológica y responsive construida para **GIVA 3D**, orientada a la venta de productos impresos en 3D, regalos personalizados y fabricación de piezas a medida.

---

## 🚀 Características Principales

1. **Estrategia Visual de Marketplace**:
   - Tarjetas de producto que destacan el **precio unitario más bajo disponible** (ejemplo: **S/ 4.00 c/u** *desde 24 unidades*).
   - Identidad visual limpia con fondo claro, morado eléctrico (`#7c3aed`), detalles en azul eléctrico (`#0284c7`), y acentos en verde lima/amarillo para ofertas y precios.

2. **Sistema Inteligente de Precios por Escala (Volumen)**:
   - Niveles por producto:
     - **1 unidad**: Precio base
     - **6 unidades**: Descuento nivel 1
     - **12 unidades**: Descuento nivel 2
     - **24+ unidades**: Descuento mayorista
   - Recálculo en tiempo real tanto en la ficha individual de producto como dentro del carrito.

3. **Checkout Directo por WhatsApp**:
   - El cliente añade productos al carrito y genera con un solo clic el mensaje formateado y estructurado con el detalle de cantidades, color elegido, precio unitario aplicado, subtotales y total general.

4. **Servicio Especial: "Fabricamos tu Pieza" (Diseño a Medida)**:
   - Sección dedicada para repuestos rotos de autos, motos, máquinas y electrodomésticos, con botón directo para cotizar por WhatsApp.

5. **Panel Administrativo Completo (`/admin`)**:
   - **Dashboard**: Métricas de productos publicados, ocultos, categorías y banners activos.
   - **Productos**: Crear, editar, cambiar precios por volumen y **ocultar/publicar** del catálogo sin borrar.
   - **Banners**: Administrar el carrusel del Home (ordenar, cambiar enlaces, imágenes y textos).

---

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS con paleta personalizada
- **Iconos**: Lucide React
- **Estado Global**: Zustand con persistencia en `localStorage`
- **Base de Datos & Storage**: Supabase (esquema preparado en `supabase/schema.sql`)

---

## 📦 Instalación y Ejecución

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔐 Acceso al Panel de Administración

- **Ruta**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Autenticación**: Email y Contraseña configurados en Supabase Auth (`Authentication > Users`).

---

## ⚙️ Configuración del Número de WhatsApp

Para cambiar el número de WhatsApp donde se reciben los pedidos y cotizaciones:

Edita el archivo `src/lib/config.ts`:
```ts
export const SITE_CONFIG = {
  name: 'GIVA 3D',
  whatsappNumber: '51987654321', // Coloca aquí el código de país y número (ej: 51987654321)
  whatsappDisplay: '+51 987 654 321',
  // ...
};
```

---

## 🗄️ Configuración de Supabase (Opcional)

El proyecto funciona inmediatamente con almacenamiento local y datos precargados. Cuando desees conectar tu proyecto de Supabase en la nube:

1. Ve a tu panel de Supabase y abre el **SQL Editor**.
2. Copia y ejecuta todo el contenido de `supabase/schema.sql`.
3. Crea un archivo `.env.local` en la raíz con tus claves:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

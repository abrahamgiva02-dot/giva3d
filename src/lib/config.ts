import { CartItem } from '@/types';
import { formatCurrency } from './pricing';

export const SITE_CONFIG = {
  name: 'GIVA 3D',
  tagline: 'Impresión 3D profesional y trabajos personalizados',
  description: 'Catálogo profesional de productos en 3D, figuras articuladas, regalos personalizados, piezas industriales y servicio de diseño a medida.',
  currency: 'S/',
  whatsappNumber: '51987654321', // Reemplazar con el número oficial de GIVA 3D
  whatsappDisplay: '+51 987 654 321',
  email: 'contacto@giva3d.com',
  location: 'Lima, Perú',
  shippingInfo: 'Envíos a todo el Perú y entregas coordinadas',
};

/**
 * Builds the WhatsApp checkout URL with the structured cart message
 */
export function buildWhatsAppCartUrl(items: CartItem[], total: number): string {
  let message = `Hola *${SITE_CONFIG.name}*, quiero realizar el siguiente pedido:\n\n`;

  items.forEach((item) => {
    const colorInfo = item.selectedColor ? ` (Color: ${item.selectedColor})` : '';
    message += `• *${item.quantity} × ${item.product.name}*${colorInfo}\n`;
    message += `  ${formatCurrency(item.unitPrice)} c/u\n`;
    message += `  Subtotal: ${formatCurrency(item.subtotal)}\n\n`;
  });

  message += `*TOTAL: ${formatCurrency(total)}*\n\n`;
  message += `Quisiera consultar disponibilidad y coordinar la entrega.`;

  const encoded = encodeURIComponent(message);
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encoded}`;
}

/**
 * Builds the WhatsApp URL for a custom piece quote ("Fabricamos tu pieza")
 */
export function buildWhatsAppCustomQuoteUrl(): string {
  const message = `Hola *${SITE_CONFIG.name}*, tengo una pieza que necesito fabricar / reemplazar mediante impresión 3D.\n\n` +
    `¿Podrían indicarme cómo enviarles fotografías, medidas o el modelo 3D para evaluarlo y cotizarlo?`;
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds the WhatsApp URL for inquiring about a single product
 */
export function buildWhatsAppProductInquiryUrl(productName: string, selectedColor?: string): string {
  const colorPart = selectedColor ? ` en color ${selectedColor}` : '';
  const message = `Hola *${SITE_CONFIG.name}*, tengo una consulta sobre el producto *${productName}*${colorPart}. ¿Tienen stock o tiempo estimado de entrega?`;
  return `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

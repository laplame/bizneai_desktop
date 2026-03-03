/**
 * Contacto del desarrollador para soporte BizneAI POS
 */
export const DEVELOPER_WHATSAPP = '525527947775';

export const getWhatsAppUrl = (message: string): string => {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${DEVELOPER_WHATSAPP}?text=${encoded}`;
};

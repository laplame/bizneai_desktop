/**
 * Genera IDs de ticket únicos y monótonos por dispositivo.
 *
 * Antes: `TKT-${Math.random()*100000}` (~100k valores) → colisiones (~50% tras
 * ~370 ventas) → tickets duplicados. Ahora: contador secuencial persistido en
 * localStorage + fecha, de forma que nunca se repite en el mismo equipo.
 * Formato: `TKT-YYYYMMDD-00001`.
 */
const SALE_SEQ_KEY = 'bizneai-sale-seq';

function pad(n: number, w: number): string {
  return String(n).padStart(w, '0');
}

/** Incrementa y devuelve el siguiente ID de ticket (persiste el contador). */
export function nextSaleTicketId(now: Date = new Date()): string {
  let seq = 0;
  try {
    seq = parseInt(localStorage.getItem(SALE_SEQ_KEY) || '0', 10) || 0;
  } catch {
    /* ignore */
  }
  seq += 1;
  try {
    localStorage.setItem(SALE_SEQ_KEY, String(seq));
  } catch {
    /* ignore */
  }
  const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`;
  return `TKT-${ymd}-${pad(seq, 5)}`;
}

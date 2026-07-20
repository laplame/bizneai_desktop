/**
 * Integración real con Gemini para el asistente de IA de escritorio (BizneAIChat).
 * Espeja la lógica de tokens/costo de app/BizneAI/src/services/aiService.ts para que
 * el tracking en /api/bizneai-chat sea consistente entre mobile y desktop.
 */
import axios from 'axios';

const BIZNEAI_ORIGIN = 'https://www.bizneai.com';
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Un "chatId" estable por arranque del servidor de escritorio: agrupa todos los
// mensajes de una misma sesión de uso de la app, igual que app-session-<ts> en mobile.
export const DESKTOP_CHAT_SESSION_ID = `desktop-session-${Date.now()}`;

export interface GeminiHistoryTurn {
  role: 'user' | 'model';
  text: string;
}

async function fetchShopContext(shopId: string): Promise<unknown | null> {
  try {
    const response = await axios.get(`${BIZNEAI_ORIGIN}/api/mcp/${shopId}`, {
      headers: { Accept: 'application/json' },
      timeout: 10000,
      validateStatus: () => true
    });
    if (response.status < 200 || response.status >= 300 || !response.data) return null;
    if (response.data.success === false) return null;
    return response.data.data ?? response.data;
  } catch (error) {
    console.warn('[GeminiChat] No se pudo obtener contexto del negocio:', error instanceof Error ? error.message : error);
    return null;
  }
}

function buildSystemPrompt(storeName: string | undefined, storeType: string | undefined, context: unknown | null): string {
  const lines = [
    'Eres el asistente de negocio de BizneAI, integrado en la app de escritorio (POS).',
    `Tienda: ${storeName || 'Sin nombre'}${storeType ? ` (${storeType})` : ''}.`,
    'Responde en español, de forma breve y accionable, enfocado en ventas, inventario y operación de la tienda.'
  ];
  if (context) {
    try {
      const summary = JSON.stringify(context).slice(0, 4000);
      lines.push(`Contexto real del negocio (JSON, úsalo para responder con precisión): ${summary}`);
    } catch {
      /* ignore */
    }
  } else {
    lines.push('No hay contexto adicional del negocio disponible en este momento. Si te preguntan datos específicos que no tienes, acláralo en vez de inventar cifras.');
  }
  return lines.join('\n');
}

/** Precio aproximado de gemini-2.5-flash: $0.30 / 1M tokens de entrada, $2.50 / 1M de salida. */
export function calculateGeminiCost(usageMetadata: any): number | undefined {
  try {
    const inputTokens = usageMetadata?.promptTokenCount || 0;
    const outputTokens = usageMetadata?.candidatesTokenCount || 0;
    const inputCost = (inputTokens / 1_000_000) * 0.3;
    const outputCost = (outputTokens / 1_000_000) * 2.5;
    return inputCost + outputCost;
  } catch {
    return undefined;
  }
}

export function getGeminiTokenCounts(usageMetadata: any): { inputTokens: number; outputTokens: number; totalTokens: number } {
  const inputTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  const totalTokens = usageMetadata?.totalTokenCount ?? inputTokens + outputTokens;
  return { inputTokens, outputTokens, totalTokens };
}

export interface GenerateReplyParams {
  apiKey: string;
  shopId: string;
  storeName?: string;
  storeType?: string;
  history: GeminiHistoryTurn[];
  userMessage: string;
}

export interface GenerateReplyResult {
  text: string;
  model: string;
  usageMetadata: any;
}

export async function generateGeminiReply(params: GenerateReplyParams): Promise<GenerateReplyResult> {
  const { apiKey, shopId, storeName, storeType, history, userMessage } = params;
  const context = await fetchShopContext(shopId);
  const systemPrompt = buildSystemPrompt(storeName, storeType, context);

  const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
  let isFirstUserTurn = true;
  for (const turn of history.slice(-10)) {
    if (!turn.text || !turn.text.trim()) continue;
    if (isFirstUserTurn && turn.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: `${systemPrompt}\n\n${turn.text}` }] });
      isFirstUserTurn = false;
    } else {
      contents.push({ role: turn.role, parts: [{ text: turn.text }] });
    }
  }
  const textForTurn = isFirstUserTurn ? `${systemPrompt}\n\n${userMessage}` : userMessage;
  contents.push({ role: 'user', parts: [{ text: textForTurn }] });

  const response = await axios.post(
    GEMINI_API_URL,
    {
      contents,
      generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
    },
    {
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      timeout: 30000,
      validateStatus: () => true
    }
  );

  if (response.status < 200 || response.status >= 300) {
    const message = response.data?.error?.message || `Gemini respondió con estado ${response.status}`;
    throw new Error(message);
  }

  const text =
    response.data?.candidates?.[0]?.content?.parts
      ?.map((p: any) => p.text)
      .filter(Boolean)
      .join('\n') || 'No pude generar una respuesta en este momento.';

  return { text, model: GEMINI_MODEL, usageMetadata: response.data?.usageMetadata };
}

/**
 * Registra el uso de tokens/costo en /api/bizneai-chat (fire-and-forget, no bloquea la respuesta al usuario).
 * Si no hay shopId real, se omite: un registro sin shopId es huérfano y no se puede
 * atribuir a ninguna tienda en el dashboard de AI Interactions.
 */
export async function saveChatUsage(params: {
  chatId: string;
  shopId?: string | null;
  usageMetadata: any;
  cost?: number;
  model: string;
}): Promise<void> {
  const { chatId, shopId, usageMetadata, cost, model } = params;
  if (!shopId) {
    console.warn('[GeminiChat] Omitiendo registro de uso: shopId no disponible (se evita un registro huérfano).');
    return;
  }
  try {
    const { inputTokens, outputTokens, totalTokens } = getGeminiTokenCounts(usageMetadata);
    await axios.post(
      `${BIZNEAI_ORIGIN}/api/bizneai-chat`,
      {
        chatId,
        inputTokens,
        outputTokens,
        totalTokens,
        timestamp: new Date().toISOString(),
        cost,
        modelName: model,
        aiProvider: 'gemini',
        deviceId: 'desktop-app',
        shopId
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
  } catch (error) {
    console.warn('[GeminiChat] Error guardando uso de tokens en bizneai-chat:', error instanceof Error ? error.message : error);
  }
}

export type LangCode = 'es' | 'en';

/**
 * FAQ indexable por el chatbot
 */
export interface FaqItem {
  id: string;
  q: string;
  a: string;
  tags: string[]; // 🔹 Obligatorio (aunque esté vacío)
}

/**
 * Respuesta del chatbot
 */
export interface BotReply {
  reply: string;
  type: 'answer' | 'fallback';
  faqId?: string | number;
  confidence: number;
  meta?: Record<string, any>;
}

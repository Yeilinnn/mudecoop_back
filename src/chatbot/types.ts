export type LangCode = 'es' | 'es-cr';

export interface BotReply {
  reply: string;
  type: 'answer' | 'fallback';
  faqId?: string;
  confidence: number; // 0..1
  meta?: {
    matchedQuestion?: string;
    tokens?: string[];
  };
}

export interface FaqItem {
  id: string;
  q: string;
  a: string;
  tags?: string[];
}

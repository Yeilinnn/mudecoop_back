// src/chatbot/chatbot.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { removeStopwords, spa as stopES } from 'stopword';
import type { BotReply, FaqItem, LangCode } from './types';
import { normalize } from './utils/text-normalizer';
import { buildEsIndex, LunrIndex } from './search/builder';
import faqsES from './data/faqs_es.json';

/** ========= Sinónimos / alias para ampliar cobertura ========= */
const SYNONYMS: Record<string, string[]> = {
  reserva: ['reservar', 'reservación', 'booking', 'apartado', 'cupo', 'mesa'],
  horario: ['horarios', 'hora', 'apertura', 'cierre', 'abren', 'abierto', 'abiertos'],
  ubicacion: ['ubicación', 'direccion', 'dirección', 'lugar', 'donde', 'mapa', 'cómo', 'como', 'llegar'],
  menu: ['menú', 'carta', 'platos', 'comidas', 'alimentos'],
  marea: ['mareas', 'tide'],
  mudecoop: ['cooperativa', 'proyecto'],
};

function expandTokens(tokens: string[]) {
  const out: string[] = [];
  for (const t of tokens) {
    out.push(t);
    for (const [k, arr] of Object.entries(SYNONYMS)) {
      if (t === k || arr.includes(t)) {
        out.push(k, ...arr);
      }
    }
  }
  return Array.from(new Set(out));
}

function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>) {
  const inter = new Set([...a].filter((x) => b.has(x))).size;
  const uni = new Set([...a, ...b]).size || 1;
  return inter / uni;
}

/** ========= Intent Router (reglas rápidas) ========= */
const INTENTS: { name: string; patterns: RegExp[]; tags: string[] }[] = [
  { name: 'reservas',  patterns: [/reserv(a|ar|ación)/i, /booking/i, /mesa/i, /cupo/i], tags: ['reservas','booking','mesa','telefono','whatsapp'] },
  { name: 'horarios',  patterns: [/horari(o|os)/i, /apertura/i, /cierre/i, /abren?/i],   tags: ['horarios','apertura','cierre'] },
  { name: 'ubicacion', patterns: [/ubicaci(ón|on)/i, /direccion/i, /direcci(ón|on)/i, /(donde|dónde)/i, /(como|cómo)\s+llegar/i, /mapa/i], tags: ['ubicacion','como llegar','mapa'] },
  { name: 'menu',      patterns: [/men(ú|u)/i, /carta/i, /platos/i, /comidas/i],        tags: ['menu','carta','platos'] },
  { name: 'mareas',    patterns: [/marea(s)?/i, /tide/i],                               tags: ['marea','mareas'] },
  { name: 'mudecoop',  patterns: [/mudecoop/i, /cooperativa/i, /proyecto/i],            tags: ['mudecoop','cooperativa','proyecto'] },
];

function detectIntent(rawText: string): string[] {
  const hits: string[] = [];
  for (const intent of INTENTS) {
    if (intent.patterns.some((rx) => rx.test(rawText))) {
      hits.push(...intent.tags);
    }
  }
  return Array.from(new Set(hits.map((t) => normalize(t))));
}

type SearchEnv = { index: LunrIndex; refMap: Map<string, FaqItem> };

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly log = new Logger(ChatbotService.name);
  private es!: SearchEnv;

  // ===== Umbrales/ajustes (calibrables) =====
  private SCORE_THRESHOLD = 0.26; // más estricto para reducir falsos positivos
  private MIN_LEN_FOR_SEARCH = 2;
  private MIN_JACCARD = 0.25;     // solapamiento mínimo pregunta↔(q+tags)
  private TAG_HIT_BONUS = 0.12;   // bonus si la consulta toca tags/intención
  private FALLBACK =
    'Perdona, no encontré información para eso. ¿Quieres preguntar sobre reservas, horarios, ubicación o MUDECOOP?';

  onModuleInit() {
    this.es = buildEsIndex(faqsES as FaqItem[]);
    this.log.log(`Índice ES cargado con ${this.es.refMap.size} FAQs`);
  }

  getFaqs(lang: LangCode = 'es'): FaqItem[] {
    return Array.from(this.es.refMap.values());
  }

  health() {
    return { ok: true, faqs: this.es.refMap.size };
  }

  /** Pre-match: exacto o startsWith sobre la "q" normalizada */
  private tryExactOrStartsWith(qNorm: string): FaqItem | undefined {
    for (const f of this.es.refMap.values()) {
      const fq = normalize(f.q);
      if (fq === qNorm) return f;
      if (qNorm.length >= 6 && fq.startsWith(qNorm)) return f;
    }
    return undefined;
  }

  private fallbackWithHints(tokens: string[], suggestions?: string[]): BotReply {
    const hint =
      suggestions && suggestions.length
        ? ` Quizás quisiste decir: ${suggestions.map((s) => `“${s}”`).join(', ')}.`
        : '';
    return {
      reply: this.FALLBACK + hint,
      type: 'fallback',
      confidence: 0,
      meta: { tokens },
    };
  }

  async reply(message: string, lang: LangCode = 'es'): Promise<BotReply> {
    // 1) Normalización (para búsqueda) + intención (con texto crudo)
    const normalized = normalize(message);
    const intentTags = detectIntent(message);

    if (!normalized || normalized.length < this.MIN_LEN_FOR_SEARCH) {
      return { reply: this.FALLBACK, type: 'fallback', confidence: 0, meta: { tokens: [] } };
    }

    // 2) Tokens útiles (sin stopwords) + sinónimos
    let tokens = removeStopwords(normalized.split(' '), stopES).filter((t) => t.length >= 2);
    if (tokens.length === 0) {
      return { reply: this.FALLBACK, type: 'fallback', confidence: 0, meta: { tokens: [] } };
    }
    tokens = Array.from(new Set(tokens));
    const expanded = expandTokens(tokens);

    // 3) Pre-match exacto/startsWith
    const exact = this.tryExactOrStartsWith(normalized);
    if (exact) {
      return {
        reply: exact.a,
        type: 'answer',
        faqId: exact.id,
        confidence: 1,
        meta: { matchedQuestion: exact.q, tokens },
      };
    }

    // 4) Query lunr: +obligatorio, * si ≥4, ~1 si ≥6
    const query = expanded
      .map((t) => {
        const term = t.replace(/[~*]/g, '');
        const star = term.length >= 4 ? '*' : '';
        const fuzzy = term.length >= 6 ? '~1' : '';
        return `+${term}${star}${fuzzy}`;
      })
      .join(' ');

    const { index, refMap } = this.es;
    const results = index.search(query);
    if (!results.length) {
      return this.fallbackWithHints(tokens);
    }

    // 5) Filtrar candidatos por intención (si hubo intención detectada)
    let filtered = results;
    if (intentTags.length) {
      filtered = results.filter((r) => {
        const f = refMap.get(r.ref)!;
        const fTags = new Set<string>((f.tags ?? []).map((t) => normalize(t)));
        return intentTags.some((t) => fTags.has(t));
      });
      if (!filtered.length) filtered = results; // si todos se fueron, mantén todos
    }

    const base = filtered.length ? filtered : results;
    const qset = new Set<string>(tokens);

    // 6) Ranking: mezcla de score, Jaccard y bonus por tags/intención
    const ranked = base
      .map((r) => {
        const f = refMap.get(r.ref)!;
        const fTags = new Set<string>((f.tags ?? []).map((t) => normalize(t)));
        const fTokens = new Set<string>(normalize(`${f.q} ${(f.tags ?? []).join(' ')}`).split(' '));

        const overlap = jaccard(qset, fTokens);
        const tagHits = [...qset].filter((t) => fTags.has(t)).length;
        const intentHits = intentTags.filter((t) => fTags.has(t)).length;

        const tagBonus = tagHits > 0 ? this.TAG_HIT_BONUS : 0;
        const intentBonus = intentHits > 0 ? this.TAG_HIT_BONUS : 0;

        const mix = (r.score * 0.6) + (overlap * 0.3) + tagBonus + intentBonus;
        return { ref: r.ref, score: r.score, overlap, tagHits, intentHits, mix, faq: f };
      })
      .sort((a, b) => b.mix - a.mix);

    const best = ranked[0];
    const confidence = Math.max(0, Math.min(1, best.score));

    // 7) Filtros mínimos (endurecidos)
    if (best.score < this.SCORE_THRESHOLD || best.overlap < this.MIN_JACCARD) {
      const suggestions = ranked.slice(0, 3).map((r) => r.faq.q);
      return this.fallbackWithHints(tokens, suggestions);
    }

    return {
      reply: best.faq.a,
      type: 'answer',
      faqId: best.faq.id,
      confidence,
      meta: {
        matchedQuestion: best.faq.q,
        tokens,
        // descomenta si quieres depurar:
        // tagHits: best.tagHits,
        // intentHits: best.intentHits,
      },
    };
  }
}

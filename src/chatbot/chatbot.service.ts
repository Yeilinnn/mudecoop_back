import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { removeStopwords, spa as stopES } from 'stopword';
import type { BotReply, FaqItem, LangCode } from './types';
import { normalize } from './utils/text-normalizer';
import { buildEsIndex, LunrIndex } from './search/builder';
import { Faq } from '../faqs/entities/faq.entity';
import { ChatbotSetting } from './entities/chatbot-setting.entity';
import { ChatbotMessage } from './entities/chatbot-message.entity';

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

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly log = new Logger(ChatbotService.name);
  private es!: { index: LunrIndex; refMap: Map<string, FaqItem> };

  constructor(
    @InjectRepository(Faq) private readonly faqRepo: Repository<Faq>,
    @InjectRepository(ChatbotSetting) private readonly settingRepo: Repository<ChatbotSetting>,
    @InjectRepository(ChatbotMessage) private readonly messageRepo: Repository<ChatbotMessage>,
  ) {}

  // ===== Ajustes OPTIMIZADOS =====
  private SCORE_THRESHOLD = 0.1;   // 🔧 Muy permisivo para pruebas
  private MIN_LEN_FOR_SEARCH = 2;
  private MIN_JACCARD = 0.1;       // 🔧 Muy permisivo para pruebas
  private TAG_HIT_BONUS = 0.12;
  private FALLBACK = 'Perdona, no encontré información para eso.';

  // ==============================================
  // 🔁 Inicialización
  // ==============================================
  async onModuleInit() {
    await this.rebuildIndexFromDb();
  }

  // ==============================================
  // 🔄 Reconstruir índice desde la BD (MEJORADO)
  // ==============================================
  async rebuildIndexFromDb(): Promise<void> {
    try {
      const faqs = await this.faqRepo.find({ where: { isVisible: true } });

      if (!faqs.length) {
        this.es = buildEsIndex([]);
        this.log.warn('⚠️ No hay FAQs visibles. Índice vacío.');
        return;
      }

      const items: FaqItem[] = faqs.map((f) => {
        let parsedTags: string[] = [];

        try {
          const rawTags = f.tags as any; // Type assertion para manejar casos edge
          
          // 🔧 MEJORA: Manejo robusto de tags (puede venir como string o array)
          if (Array.isArray(rawTags)) {
            parsedTags = rawTags.filter((t): t is string => typeof t === 'string');
          } else if (typeof rawTags === 'string') {
            const trimmed = rawTags.trim();
            if (!trimmed) {
              parsedTags = [];
            } else if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
              // Intenta parsear si es string JSON
              const parsed = JSON.parse(trimmed);
              parsedTags = Array.isArray(parsed) ? parsed : [];
            } else {
              // Si no es JSON válido, trata como CSV simple
              parsedTags = trimmed.split(',').map(t => t.trim()).filter(Boolean);
            }
          } else if (rawTags && typeof rawTags === 'object' && rawTags !== null) {
            // Caso edge: objeto extraño
            parsedTags = Object.values(rawTags).filter((v): v is string => typeof v === 'string');
          } else {
            parsedTags = [];
          }
        } catch (err) {
          this.log.warn(`⚠️ Error parseando tags para FAQ #${f.id}: ${err}`);
          parsedTags = [];
        }

        return {
          id: f.id.toString(),
          q: f.question,
          a: f.answer,
          tags: parsedTags,
        };
      });

      this.es = buildEsIndex(items);
      
      // 🔧 Log detallado de lo que se indexó
      this.log.log(`🤖 Índice recargado con ${items.length} FAQs`);
      items.slice(0, 3).forEach(item => {
        this.log.debug(`  - FAQ #${item.id}: "${item.q}" | tags: [${item.tags.join(', ')}]`);
      });
    } catch (err) {
      this.log.error('❌ Error reconstruyendo índice desde BD', err);
      this.es = buildEsIndex([]);
    }
  }

  // ==============================================
  // ⚙️ Configuración ON/OFF del chatbot
  // ==============================================
  async getSetting(): Promise<{ isEnabled: boolean }> {
    const setting = await this.settingRepo.findOne({ where: { id: 1 } });
    return { isEnabled: setting?.isEnabled ?? false };
  }

  async updateSetting(isEnabled: boolean) {
    const existing = await this.settingRepo.findOne({ where: { id: 1 } });
    if (existing) {
      existing.isEnabled = isEnabled;
      await this.settingRepo.save(existing);
    } else {
      await this.settingRepo.save(this.settingRepo.create({ isEnabled }));
    }
    return { ok: true, isEnabled };
  }

  // ==============================================
  // 💬 CRUD de mensajes automáticos
  // ==============================================
  async getMessages() {
    return this.messageRepo.find({ order: { displayOrder: 'ASC' } });
  }

  async createMessage(dto: Partial<ChatbotMessage>) {
    const msg = this.messageRepo.create(dto);
    return this.messageRepo.save(msg);
  }

  async updateMessage(id: number, dto: Partial<ChatbotMessage>) {
    await this.messageRepo.update(id, dto);
    return this.messageRepo.findOneBy({ id });
  }

  async deleteMessage(id: number) {
    await this.messageRepo.delete(id);
    return { deleted: true };
  }

  // ==============================================
  // 🧠 Respuesta del chatbot - VERSIÓN OPTIMIZADA
  // ==============================================
  async reply(message: string, lang: LangCode = 'es'): Promise<BotReply> {
    const setting = await this.getSetting();
    if (!setting.isEnabled) {
      return {
        reply: '🤖 El chatbot está desactivado temporalmente.',
        type: 'fallback',
        confidence: 0,
      };
    }

    if (!this.es?.index) {
      this.log.warn('⚠️ Índice no inicializado aún.');
      return { reply: this.FALLBACK, type: 'fallback', confidence: 0, meta: { tokens: [] } };
    }

    const normalized = normalize(message);
    if (!normalized || normalized.length < this.MIN_LEN_FOR_SEARCH) {
      return { reply: this.FALLBACK, type: 'fallback', confidence: 0, meta: { tokens: [] } };
    }

    let tokens = removeStopwords(normalized.split(' '), stopES).filter((t) => t.length >= 2);
    if (!tokens.length) {
      return { reply: this.FALLBACK, type: 'fallback', confidence: 0, meta: { tokens: [] } };
    }

    tokens = Array.from(new Set(tokens));
    const expanded = expandTokens(tokens);

    const { index, refMap } = this.es;
    
    // 🔧 MEJORA: Múltiples estrategias de búsqueda
    let results: any[] = [];
    let queryUsed = '';

    // Estrategia 1: Búsqueda flexible con boost
    if (results.length === 0) {
      queryUsed = expanded
        .map((t) => {
          const term = t.replace(/[~*]/g, '');
          const star = term.length >= 4 ? '*' : '';
          const fuzzy = term.length >= 6 ? '~1' : '';
          const boost = term.length >= 6 ? '^2' : term.length >= 4 ? '^1.5' : '';
          return `${term}${star}${fuzzy}${boost}`;
        })
        .join(' ');

      this.log.debug(`🔍 Estrategia 1: "${queryUsed}"`);
      try {
        results = index.search(queryUsed);
      } catch (err) {
        this.log.warn(`⚠️ Error en búsqueda estrategia 1: ${err}`);
      }
    }

    // Estrategia 2: Solo términos importantes con wildcards
    if (results.length === 0 && tokens.length > 0) {
      const importantTokens = tokens.filter(t => t.length >= 4);
      if (importantTokens.length > 0) {
        queryUsed = importantTokens.map(t => `${t}*`).join(' ');
        this.log.debug(`🔍 Estrategia 2: "${queryUsed}"`);
        try {
          results = index.search(queryUsed);
        } catch (err) {
          this.log.warn(`⚠️ Error en búsqueda estrategia 2: ${err}`);
        }
      }
    }

    // Estrategia 3: Término más largo con fuzzy
    if (results.length === 0 && expanded.length > 0) {
      const longestTerm = expanded.reduce((a, b) => a.length > b.length ? a : b);
      queryUsed = `${longestTerm}* ${longestTerm}~1`;
      this.log.debug(`🔍 Estrategia 3: "${queryUsed}"`);
      try {
        results = index.search(queryUsed);
      } catch (err) {
        this.log.warn(`⚠️ Error en búsqueda estrategia 3: ${err}`);
      }
    }

    if (!results.length) {
      this.log.debug('❌ No se encontraron resultados en ninguna estrategia');
      const fallbackMsg = await this.messageRepo.findOne({
        where: { kind: 'fallback', isActive: true },
      });
      const fallback = fallbackMsg?.content ?? this.FALLBACK;
      return { 
        reply: fallback, 
        type: 'fallback', 
        confidence: 0, 
        meta: { tokens, query: queryUsed, strategies: 3 } 
      };
    }

    this.log.debug(`✅ Se encontraron ${results.length} resultados`);

    const qset = new Set<string>(tokens);
    const ranked = results
      .map((r) => {
        const f = refMap.get(r.ref)!;
        const fTokens = new Set<string>(
          normalize(`${f.q} ${(f.tags ?? []).join(' ')}`).split(' ').filter(t => t.length >= 2)
        );
        const overlap = jaccard(qset, fTokens);
        const mix = r.score * 0.6 + overlap * 0.4;
        return { ref: r.ref, score: r.score, overlap, mix, faq: f };
      })
      .sort((a, b) => b.mix - a.mix);

    const best = ranked[0];
    
    this.log.debug(
      `📊 Mejor: FAQ #${best.faq.id} | score=${best.score.toFixed(3)} | overlap=${best.overlap.toFixed(3)} | mix=${best.mix.toFixed(3)}`
    );

    // 🔧 MEJORA: Umbrales muy bajos para permitir más resultados
    if (best.score < this.SCORE_THRESHOLD && best.overlap < this.MIN_JACCARD) {
      this.log.debug(
        `⚠️ Por debajo de umbrales (score>=${this.SCORE_THRESHOLD}, overlap>=${this.MIN_JACCARD})`
      );
      const fallbackMsg = await this.messageRepo.findOne({
        where: { kind: 'fallback', isActive: true },
      });
      const fallback = fallbackMsg?.content ?? this.FALLBACK;
      return { 
        reply: fallback, 
        type: 'fallback', 
        confidence: best.score, 
        meta: { 
          tokens, 
          query: queryUsed,
          bestScore: best.score, 
          bestOverlap: best.overlap,
          bestQuestion: best.faq.q
        } 
      };
    }

    this.log.log(`✅ Respuesta: FAQ #${best.faq.id} - "${best.faq.q}"`);

    return {
      reply: best.faq.a,
      type: 'answer',
      faqId: best.faq.id,
      confidence: best.score,
      meta: { matchedQuestion: best.faq.q, tokens, query: queryUsed },
    };
  }

  // ==============================================
  // 🩺 Health + Debug
  // ==============================================
  health() {
    return { ok: true, faqs: this.es?.refMap?.size ?? 0 };
  }

  // 🩺 Método de debugging
  async debugSearch(message: string) {
    const normalized = normalize(message);
    const allTokens = normalized.split(' ').filter(t => t.length >= 2);
    const tokens = removeStopwords(allTokens, stopES);
    const expanded = expandTokens(tokens);
    
    const debugInfo: any = {
      original: message,
      normalized,
      allTokens,
      tokensAfterStopwords: tokens,
      expanded,
      faqsInIndex: this.es?.refMap?.size ?? 0,
      indexExists: !!this.es?.index,
    };

    // Pruebas de búsqueda directa
    if (this.es?.index) {
      const tests = [
        'horario*',
        'horarios',
        'horario~1',
        tokens.join(' '),
      ];

      debugInfo.searchTests = {};
      for (const testQuery of tests) {
        try {
          const results = this.es.index.search(testQuery);
          debugInfo.searchTests[testQuery] = {
            count: results.length,
            top3: results.slice(0, 3).map(r => ({
              ref: r.ref,
              score: r.score,
              question: this.es.refMap.get(r.ref)?.q,
            })),
          };
        } catch (err) {
          debugInfo.searchTests[testQuery] = { error: String(err) };
        }
      }
    }

    this.log.log(`🔍 Debug completo:\n${JSON.stringify(debugInfo, null, 2)}`);
    return debugInfo;
  }
}
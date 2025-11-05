import lunr from 'lunr';
import { FaqItem } from '../types';
import { normalize } from '../utils/text-normalizer';

// 👇 Soporte para español
const stemmerSupport = require('lunr-languages/lunr.stemmer.support');
const es = require('lunr-languages/lunr.es');
stemmerSupport(lunr);
es(lunr);

export type LunrIndex = lunr.Index;

/**
 * 🧠 Construye índice en español optimizado
 */
export function buildEsIndex(
  faqs: FaqItem[]
): { index: LunrIndex; refMap: Map<string, FaqItem> } {
  const refMap = new Map<string, FaqItem>();

  const idx = lunr(function () {
    // @ts-ignore
    this.use((lunr as any).es);

    this.ref('id');
    this.field('q', { boost: 8 });
    this.field('tags', { boost: 6 });
    this.field('a', { boost: 2 });

    faqs.forEach((f) => {
      refMap.set(f.id, f);
      const tags = Array.isArray(f.tags) ? f.tags.join(' ') : '';
      this.add({
        id: f.id,
        q: normalize(f.q ?? ''),
        a: normalize(f.a ?? ''),
        tags: normalize(tags),
      } as any);
    });
  });

  return { index: idx, refMap };
}

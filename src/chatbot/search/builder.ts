/* eslint-disable @typescript-eslint/no-var-requires */
import lunr from 'lunr';
import { FaqItem } from '../types';

// 👇 Importa SOLO los submódulos correctos
const stemmerSupport = require('lunr-languages/lunr.stemmer.support');
const es = require('lunr-languages/lunr.es');

// Inicializa soporte y español
stemmerSupport(lunr);
es(lunr);

export type LunrIndex = lunr.Index;

export function buildEsIndex(faqs: FaqItem[]): { index: LunrIndex; refMap: Map<string, FaqItem> } {
  const refMap = new Map<string, FaqItem>();

  const idx = lunr(function () {
    // @ts-ignore
    this.use((lunr as any).es);

    this.ref('id');

    // ⬇️ Boosts: pregunta (4x), tags (2x), respuesta (1x)
    this.field('q',   { boost: 4 });
    this.field('tags',{ boost: 2 });
    this.field('a',   { boost: 1 });

    faqs.forEach((f) => {
      refMap.set(f.id, f);
      this.add({
        id: f.id,
        q: f.q,
        a: f.a,
        tags: (f.tags ?? []).join(' ')
      } as any);
    });
  });

  return { index: idx, refMap };
}

import removeAccents from 'remove-accents';

// elimina signos básicos y normaliza espacios
const PUNCTUATION_REGEX = /[¡!¿?\.,;:()\[\]'"«»]/g;

export function normalize(text: string) {
  const lower = (text || '').toLowerCase();
  const noAcc = removeAccents(lower);
  const noPunct = noAcc.replace(PUNCTUATION_REGEX, ' ');
  return noPunct.replace(/\s+/g, ' ').trim();
}

// src/contact/contact.kinds.ts
export const CONTACT_KINDS = [
  'address',
  'phone',
  'email',
  'facebook',
  'instagram',
  'tiktok',
] as const;

export type ContactKind = typeof CONTACT_KINDS[number];

export const DEFAULT_TITLE_BY_KIND: Record<ContactKind, string> = {
  address: 'Dirección',
  phone: 'Tel',
  email: 'Correo',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
};

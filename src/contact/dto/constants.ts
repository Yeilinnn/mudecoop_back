// src/contact/dto/constants.ts
export const CONTACT_KINDS = [
  'address',
  'phone',
  'email',
  'facebook',
  'instagram',
  'tiktok',
] as const;

export type ContactKind = (typeof CONTACT_KINDS)[number];

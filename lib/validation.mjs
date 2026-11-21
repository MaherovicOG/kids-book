import { z } from 'zod';
import { stories, availableHeroes, bookLanguageCodes } from './catalog.mjs';
export const orderSchema = z.object({
  requestId: z.uuid(),
  customerName: z.string().trim().min(2).max(100),
  email: z.email().max(254).transform(value => value.toLowerCase()),
  whatsapp: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, 'Use the country code, for example +212612345678.'),
  deliveryMethod: z.enum(['email', 'whatsapp']),
  childName: z.string().trim().min(1).max(80),
  age: z.coerce.number().int().min(2).max(12),
  sex: z.enum(['male', 'female']),
  language: z.enum(bookLanguageCodes),
  siteLanguage: z.enum(['en','fr','ar']).default('en'),
  currency: z.enum(['EUR','USDT']),
  favoriteColor: z.string().trim().min(1).max(60),
  favoriteAnimal: z.string().trim().min(1).max(60),
  adventure: z.string().refine(value => stories.some(story => story.id === value), 'Choose a story.'),
  superhero: z.string(),
  notes: z.string().trim().max(1500).default(''),
  consent: z.literal('yes'),
  website: z.literal('').default('')
}).superRefine((value, context) => {
  if (!availableHeroes(value.sex).some(hero => hero.id === value.superhero)) {
    context.addIssue({ code: 'custom', path: ['superhero'], message: 'Choose an available superhero outfit.' });
  }
});
export const updateSchema = z.object({ status: z.enum(['new','confirmed','in_progress','delivered','cancelled']), adminNotes: z.string().max(4000).default('') });
export function imageMime(bytes) {
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

import { z } from 'zod';
export const MODULE_LABELS: Record<string,string> = { talk:'Razgovor', pronunciation:'Izgovor', writing:'Pisanje', listening:'Slušanje', reading:'Čitanje', vocabulary:'Vokabular', grammar:'Gramatika' };
export const COURSE_LABELS: Record<string,string> = { 'no:general':'Norveški · Opšti A2', 'no:health':'Norveški · Zdravstveni B1', 'de:general':'Nemački · Opšti A2', 'de:health':'Nemački · Zdravstveni B1', 'en:general':'Engleski · Opšti A2' };
export const surveySchema = z.object({
 engagement:z.number().int().min(1).max(5), pace:z.number().int().min(1).max(5),
 modules:z.array(z.enum(['talk','pronunciation','writing','listening','reading','vocabulary','grammar'])).min(1).max(2).refine(v=>new Set(v).size===v.length),
 difficulty:z.enum(['easy','right','hard']), ai:z.number().int().min(1).max(5), accessibility:z.enum(['smooth','minor','problems']), device:z.enum(['phone','computer','tablet']),
 frustration:z.string().max(2000).default(''), suggestion:z.string().trim().min(1).max(2000), recommend:z.number().int().min(1).max(10), email:z.union([z.literal(''),z.string().email().max(254)]).default(''),
});
export type SurveyAnswers = z.infer<typeof surveySchema>;
export const ANSWER_LABELS: Record<string,string> = {easy:'Previše lako',right:'Baš po meri',hard:'Preteško',smooth:'Brzo i pregledno',minor:'Sitni zastoji ili nejasnoće',problems:'Tehnički problemi',phone:'Mobilni telefon',computer:'Računar / Laptop',tablet:'Tablet'};
export function nps(values:number[]) { return values.length ? Math.round(100*(values.filter(v=>v>=9).length-values.filter(v=>v<=6).length)/values.length) : null; }

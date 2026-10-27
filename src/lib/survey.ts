import { z } from 'zod';
export const MODULE_LABELS: Record<string,string> = { talk:'Razgovor', pronunciation:'Izgovor', writing:'Pisanje', listening:'Slušanje', reading:'Čitanje', vocabulary:'Vokabular', grammar:'Gramatika' };
export const COURSE_LABELS: Record<string,string> = { 'no:general':'Norveški · Opšti A2', 'no:health':'Norveški · Zdravstveni B1', 'de:general':'Nemački · Opšti A2', 'de:health':'Nemački · Zdravstveni B1', 'en:general':'Engleski · Opšti A2' };
export const surveySchema = z.object({
 testedCourse:z.enum(['no:general','no:health','de:general','de:health','en:general']),
 engagement:z.number().int().min(1).max(5), pace:z.number().int().min(1).max(5),
 modules:z.array(z.enum(['talk','pronunciation','writing','listening','reading','vocabulary','grammar'])).min(1).max(7).refine(v=>new Set(v).size===v.length),
 difficulty:z.enum(['easy','right','hard']), ai:z.number().int().min(1).max(5), accessibility:z.enum(['smooth','minor','problems']), device:z.enum(['phone','computer','tablet']),
 frustration:z.string().trim().min(1).max(2000), suggestion:z.string().trim().min(1).max(2000), recommend:z.number().int().min(1).max(10), email:z.union([z.literal(''),z.string().email().max(254)]).default(''),
 continueUsing:z.enum(['yes','maybe','no']), notifyCourses:z.boolean().optional(),
}).superRefine((v,ctx)=>{if(v.continueUsing==='yes'&&typeof v.notifyCourses!=='boolean')ctx.addIssue({code:z.ZodIssueCode.custom,path:['notifyCourses'],message:'Izaberi da li želiš obaveštenja.'});if(v.continueUsing!=='yes'&&v.notifyCourses===true)ctx.addIssue({code:z.ZodIssueCode.custom,path:['notifyCourses'],message:'Obaveštenja su dostupna ako želiš da nastaviš.'});});
export type SurveyAnswers = z.infer<typeof surveySchema>;
export const CONTINUATION_LABELS:Record<string,string>={yes:'Da',maybe:'Još nisam siguran/na',no:'Ne'};
export const ANSWER_LABELS: Record<string,string> = {easy:'Previše lako',right:'Baš po meri',hard:'Preteško',smooth:'Brzo i pregledno',minor:'Sitni zastoji ili nejasnoće',problems:'Tehnički problemi',phone:'Mobilni telefon',computer:'Računar / Laptop',tablet:'Tablet'};
export function nps(values:number[]) { return values.length ? Math.round(100*(values.filter(v=>v>=9).length-values.filter(v=>v<=6).length)/values.length) : null; }

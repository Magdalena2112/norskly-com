import { describe,it,expect } from 'vitest';
import {surveySchema,nps} from './survey';
const valid={testedCourse:'no:general',engagement:3,pace:4,modules:['talk'],difficulty:'right',ai:4,accessibility:'smooth',device:'phone',frustration:'Nije bilo problema',suggestion:'Više dijaloga',recommend:8,email:'',continueUsing:'yes',notifyCourses:false};
describe('survey rules',()=>{
 it('allows all seven different useful modules',()=>{expect(surveySchema.safeParse({...valid,modules:['talk','writing','reading','listening','vocabulary','grammar','pronunciation']}).success).toBe(true);expect(surveySchema.safeParse({...valid,modules:['talk','talk']}).success).toBe(false)});
 it('accepts all five active test courses but not unavailable courses',()=>{for(const testedCourse of ['no:general','no:health','de:general','de:health','en:general'])expect(surveySchema.safeParse({...valid,testedCourse}).success).toBe(true);expect(surveySchema.safeParse({...valid,testedCourse:'en:health'}).success).toBe(false)});
 it('requires an answer to question nine',()=>{expect(surveySchema.safeParse({...valid,frustration:'  '}).success).toBe(false);expect(surveySchema.safeParse(valid).success).toBe(true)});
 it('requires a continuation preference',()=>{expect(surveySchema.safeParse({...valid,continueUsing:undefined}).success).toBe(false)});
 it('requires explicit notification preference only for interested learners',()=>{expect(surveySchema.safeParse({...valid,notifyCourses:undefined}).success).toBe(false);expect(surveySchema.safeParse({...valid,notifyCourses:true}).success).toBe(true);expect(surveySchema.safeParse({...valid,continueUsing:'no',notifyCourses:undefined}).success).toBe(true);expect(surveySchema.safeParse({...valid,continueUsing:'no',notifyCourses:true}).success).toBe(false)});
 it('uses ratings from 1 to 5',()=>{expect(surveySchema.safeParse({...valid,engagement:6}).success).toBe(false);expect(surveySchema.safeParse({...valid,ai:0}).success).toBe(false)});
 it('uses recommendation from 1 to 10',()=>{expect(surveySchema.safeParse({...valid,recommend:10}).success).toBe(true);expect(surveySchema.safeParse({...valid,recommend:11}).success).toBe(false)});
 it('permits an optional email but validates supplied contacts',()=>{expect(surveySchema.safeParse(valid).success).toBe(true);expect(surveySchema.safeParse({...valid,email:'wrong'}).success).toBe(false)});
 it('computes NPS with promoters 9–10 and detractors 1–6',()=>{expect(nps([10,9,8,6])).toBe(25);expect(nps([])).toBeNull()});
});

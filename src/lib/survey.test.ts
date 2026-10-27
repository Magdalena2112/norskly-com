import { describe,it,expect } from 'vitest';
import {surveySchema,nps} from './survey';
const valid={engagement:3,pace:4,modules:['talk'],difficulty:'right',ai:4,accessibility:'smooth',device:'phone',frustration:'',suggestion:'Više dijaloga',recommend:8,email:''};
describe('survey rules',()=>{
 it('allows at most two useful modules',()=>{expect(surveySchema.safeParse({...valid,modules:['talk','writing']}).success).toBe(true);expect(surveySchema.safeParse({...valid,modules:['talk','writing','reading']}).success).toBe(false)});
 it('uses ratings from 1 to 5',()=>{expect(surveySchema.safeParse({...valid,engagement:6}).success).toBe(false);expect(surveySchema.safeParse({...valid,ai:0}).success).toBe(false)});
 it('uses recommendation from 1 to 10',()=>{expect(surveySchema.safeParse({...valid,recommend:10}).success).toBe(true);expect(surveySchema.safeParse({...valid,recommend:11}).success).toBe(false)});
 it('permits an optional email but validates supplied contacts',()=>{expect(surveySchema.safeParse(valid).success).toBe(true);expect(surveySchema.safeParse({...valid,email:'wrong'}).success).toBe(false)});
 it('computes NPS with promoters 9–10 and detractors 1–6',()=>{expect(nps([10,9,8,6])).toBe(25);expect(nps([])).toBeNull()});
});

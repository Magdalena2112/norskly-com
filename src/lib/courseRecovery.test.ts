import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Keep server invariants checked without mutating real learner enrollment in tests.
const sql=readFileSync('drizzle/migrations/0021_legacy_course_recovery.sql','utf8');
describe('legacy enrollment recovery boundaries',()=>{
 it('requires strict administrator authorization on both RPCs',()=>{
  expect(sql.match(/IF auth.uid\(\) IS NULL OR NOT public.is_strict_admin\(auth.uid\(\)\)/g)).toHaveLength(2);
 });
 it('limits recovery to profiles and healthcare progress predating isolation',()=>{
  expect(sql).toContain('lp.created_at<to_timestamp(1793103214144/1000.0)');
  expect(sql).toContain("l.course='health' AND p.created_at<to_timestamp(1793103214144/1000.0)");
  expect(sql).toContain("lp.language IN ('no','de')");
 });
 it('records a decision once and restores healthcare B1 without XP or progress writes',()=>{
  expect(sql).toContain('profile_id uuid NOT NULL UNIQUE');
  expect(sql).toContain("CASE WHEN p_course='health' THEN 'B1' ELSE lp.level END");
  expect(sql).toContain("'already_resolved',true");
  expect(sql).not.toMatch(/(?:UPDATE|INSERT INTO|DELETE FROM) public\.(?:user_xp|activities|course_lesson_progress|survey_responses)/i);
 });
});
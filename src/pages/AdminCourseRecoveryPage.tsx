import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';

type Candidate = { profile_id:string; display_name:string; language:string; level:string; health_lessons:number; general_lessons:number; progress:{lesson:string;course:string;steps:string[];status:string}[] };
const courseName = (course:string) => course==='health'?'Zdravstveni kurs · B1':'Opšti kurs';
export default function AdminCourseRecoveryPage() {
 const qc=useQueryClient();
 const [selection,setSelection]=useState<{candidate:Candidate;course:string}|null>(null);
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const candidates=useQuery({queryKey:['legacy-course-recovery'],queryFn:async()=>{const {data,error}=await supabase.rpc('legacy_course_recovery_candidates');if(error)throw error;return data as unknown as Candidate[];}});
 const audit=useQuery({queryKey:['course-recovery-audit'],queryFn:async()=>{const {data,error}=await supabase.from('course_enrollment_recoveries').select('*').order('reviewed_at',{ascending:false});if(error)throw error;return data;}});
 async function confirm(){if(!selection)return;setBusy(true);setError('');try{const {error}=await supabase.rpc('resolve_legacy_course_enrollment',{p_profile_id:selection.candidate.profile_id,p_course:selection.course});if(error)throw error;await Promise.all(['legacy-course-recovery','course-recovery-audit','course-enrollment','language-profile'].map(key=>qc.invalidateQueries({queryKey:[key]})));setSelection(null);}catch{setError('Upis nije potvrđen. Osveži pregled i pokušaj ponovo.');}finally{setBusy(false);}}
 return <AdminLayout><main className="max-w-5xl mx-auto"><h1 className="font-display text-3xl">Raniji upisi</h1>
 <p className="text-muted-foreground mt-3 mb-8">Zdravstveni napredak sačuvan pre odvajanja kurseva. Potvrdi sa učenikom koji kurs želi da nastavi.</p>
 {candidates.isLoading?<p>Učitavanje…</p>:candidates.error?<p role="alert">Pregled nije dostupan.</p>:!candidates.data?.length?<p>Nema upisa koji čekaju potvrdu.</p>:<section className="divide-y divide-border">{candidates.data.map(c=><article key={c.profile_id} className="py-6"><h2 className="font-semibold text-lg">{c.display_name} · {c.language==='no'?'Norveški':'Nemački'}</h2><p className="text-sm text-muted-foreground mt-2">Trenutno: opšti kurs · {c.level}. Zdravstvene lekcije: {c.health_lessons}; opšte lekcije: {c.general_lessons}.</p>
 {c.general_lessons>0&&<p className="text-sm text-primary mt-3">Postoji napredak u oba kursa — proveri željeni upis pre potvrde.</p>}
 <ul className="my-4 space-y-2 text-sm">{c.progress.map(p=><li key={p.lesson} className="break-words">{p.lesson} · {p.steps.length} završenih koraka · {p.status==='completed'?'Završeno':'U toku'}</li>)}</ul>
 <div className="flex flex-wrap gap-3"><Button onClick={()=>{setError('');setSelection({candidate:c,course:'health'});}}>Vrati zdravstveni B1</Button><Button variant="outline" onClick={()=>{setError('');setSelection({candidate:c,course:'general'});}}>Potvrdi opšti kurs</Button></div></article>)}</section>}
 <section className="mt-10 border-t border-border pt-6"><h2 className="font-display text-xl mb-4">Potvrđeni upisi</h2>{audit.error?<p role="alert">Istorija nije dostupna.</p>:audit.data?.map(a=><p key={a.id} className="text-sm py-2">{a.language==='no'?'Norveški':'Nemački'} · {courseName(a.selected_course)} · {new Date(a.reviewed_at).toLocaleString('sr-Latn')}</p>)}</section>
 <AlertDialog open={!!selection} onOpenChange={open=>{if(!open&&!busy)setSelection(null);}}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Potvrdi upis</AlertDialogTitle><AlertDialogDescription>{selection?.candidate.display_name} — {courseName(selection?.course??'general')}. Drugi kurs ostaje nedostupan. Napredak se ne briše, a XP ostaje isti.</AlertDialogDescription></AlertDialogHeader>{error&&<p role="alert" className="text-destructive">{error}</p>}<AlertDialogFooter><AlertDialogCancel disabled={busy}>Odustani</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={e=>{e.preventDefault();void confirm();}}>{busy?'Čuvanje…':'Potvrdi upis'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
 </main></AdminLayout>;
}
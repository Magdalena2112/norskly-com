import {useState} from 'react';
import {Link} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {supabase} from '@/integrations/supabase/client';
import {useAuth} from '@/context/AuthContext';
import {Button} from '@/components/ui/button';
import {MessageSquareHeart,X,ArrowRight} from 'lucide-react';
import {useSelectedCourse} from "@/hooks/useSelectedCourse";
export default function SurveyInvitation({language,completed=false}:{language:string;completed?:boolean}) {
 const course=useSelectedCourse(language);
 const {user}=useAuth(); const [dismissed,setDismissed]=useState(false);
 const {data, isLoading}=useQuery({queryKey:['survey-status',user?.id,language,course],enabled:!!user,queryFn:async()=>{const {data,error}=await supabase.from('survey_responses').select('id').eq('user_id',user?.id ?? '').eq('language',language).eq('course',course);if(error)throw error;return data;}});
 if(!user||dismissed||isLoading||data?.length)return null;
 return <section className="mt-8 py-6 border-y border-primary/20 flex gap-4 items-start">
 <MessageSquareHeart className="w-6 h-6 text-primary shrink-0 mt-1"/>
 <div className="flex-1 min-w-0"><h2 className="font-display text-xl text-primary">{completed?'Kako ti se dopala ova lekcija?':'Pomažeš nam da promenimo pravila igre'}</h2>
 <p className="text-sm text-muted-foreground mt-2 mb-4">Tvoji utisci oblikuju Norskly. Podeli šta ti pomaže u učenju, a šta možemo da unapredimo.</p>
 <Button asChild variant="outline"><Link to={`/anketa?lang=${language}&course=${course}`}>Podeli utiske · 5–7 min <ArrowRight className="w-4 h-4 ml-2"/></Link></Button>
 <span className="text-xs text-primary block mt-2">+50 XP za prvu anketu o ovom kursu</span></div>
 <Button variant="ghost" size="icon" aria-label="Skloni poziv za anketu" onClick={()=>setDismissed(true)}><X className="w-4 h-4"/></Button>
 </section>;
}

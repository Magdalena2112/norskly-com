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
 return <section className="mt-4 py-2.5 px-3 rounded-xl border border-primary/15 bg-cream/70 flex gap-2.5 items-center">
 <MessageSquareHeart className="w-4 h-4 text-primary shrink-0"/>
 <p className="flex-1 min-w-0 text-xs sm:text-sm text-muted-foreground">{completed?'Kako ti se dopala ova lekcija?':'Tvoji utisci nam pomažu da unapredimo platformu.'}</p>
 <Link to={`/anketa?lang=${language}&course=${course}`} className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap flex items-center">Podeli utiske <ArrowRight className="w-3.5 h-3.5 ml-1"/></Link>
 <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" aria-label="Skloni poziv za anketu" onClick={()=>setDismissed(true)}><X className="w-3.5 h-3.5"/></Button>
 </section>;
}

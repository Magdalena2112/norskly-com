import StudentLayout from "@/components/student/StudentLayout";
import MyDictionaryPanel from "@/components/MyDictionaryPanel";
import { getCurrentLanguageCode, langGenitive } from "@/lib/currentLanguage";

export default function MyDictionaryPage() {
  const lang = getCurrentLanguageCode();
  return (
    <StudentLayout>
      <div className="container max-w-4xl py-6 sm:py-8">
        <h1 className="text-display text-2xl sm:text-3xl text-primary">Moj rečnik</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Tvoje lične reči i izrazi {langGenitive(lang)} jezika — iz lekcija ili koje sam dodaš.</p>
        <MyDictionaryPanel language={lang} />
      </div>
    </StudentLayout>
  );
}

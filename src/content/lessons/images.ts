// Illustrations per lesson, keyed by lesson_code. Placement mirrors the source document.
import i1 from "@/assets/lessons/en-a1-l01-1.webp.asset.json";
import i2 from "@/assets/lessons/en-a1-l01-2.webp.asset.json";
import i3 from "@/assets/lessons/en-a1-l01-3.webp.asset.json";
import i4 from "@/assets/lessons/en-a1-l01-4.webp.asset.json";
import i5 from "@/assets/lessons/en-a1-l01-5.webp.asset.json";
import i6 from "@/assets/lessons/en-a1-l01-6.webp.asset.json";
import i7 from "@/assets/lessons/en-a1-l01-7.webp.asset.json";
import i8 from "@/assets/lessons/en-a1-l01-8.webp.asset.json";
import i9 from "@/assets/lessons/en-a1-l01-9.webp.asset.json";
import i10 from "@/assets/lessons/en-a1-l01-10.webp.asset.json";
import i11 from "@/assets/lessons/en-a1-l01-11.webp.asset.json";
import i12 from "@/assets/lessons/en-a1-l01-12.webp.asset.json";
import i13 from "@/assets/lessons/en-a1-l01-13.webp.asset.json";
import i14 from "@/assets/lessons/en-a1-l01-14.webp.asset.json";
import a2t1 from "@/assets/lessons/en-a2-l01-t1.webp.asset.json";
import a2t2 from "@/assets/lessons/en-a2-l01-t2.webp.asset.json";
import a2t3 from "@/assets/lessons/en-a2-l01-t3.webp.asset.json";
import noT3 from "@/assets/lessons/no-a2-l01-t3.webp";

export interface LessonImages {
  cover?: string;
  texts: Record<string, string>;
  /** First image is the module card cover; all are shown inside the module. */
  modules: Record<string, string[]>;
}

export const LESSON_IMAGES: Record<string, LessonImages> = {
  "NO-A2-L01": {
    cover: a2t1.url,
    texts: { "NO-A2-L01-T01": a2t1.url, "NO-A2-L01-T02": a2t2.url, "NO-A2-L01-T03": noT3 },
    modules: {},
  },
  "EN-A2-L01": {
    cover: a2t1.url,
    texts: { "EN-A2-L01-T01": a2t1.url, "EN-A2-L01-T02": a2t2.url, "EN-A2-L01-T03": a2t3.url },
    modules: {},
  },
  "EN-A1-L01": {
    cover: i1.url,
    texts: { "EN-A1-L01-T01": i2.url, "EN-A1-L01-T02": i3.url, "EN-A1-L01-T03": i4.url },
    modules: {
      grammar: [i5.url, i6.url, i7.url],
      vocabulary: [i8.url, i9.url],
      reading: [i10.url],
      listening: [i8.url],
      writing: [i11.url],
      pronunciation: [i12.url],
      speaking: [i13.url],
      culture: [i10.url],
      review: [i14.url, i3.url],
    },
  },
};

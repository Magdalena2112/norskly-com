import a2mix01 from "@/assets/lessons/en-a2-l01-mix01.webp.asset.json";
import a2mix02 from "@/assets/lessons/en-a2-l01-mix02.webp.asset.json";
import a2mix03 from "@/assets/lessons/en-a2-l01-mix03.webp.asset.json";
import a2mix04 from "@/assets/lessons/en-a2-l01-mix04.webp.asset.json";
import a2mix05 from "@/assets/lessons/en-a2-l01-mix05.webp.asset.json";
import a2mix06 from "@/assets/lessons/en-a2-l01-mix06.webp.asset.json";
import a2mix07 from "@/assets/lessons/en-a2-l01-mix07.webp.asset.json";
import a2mix08 from "@/assets/lessons/en-a2-l01-mix08.webp.asset.json";
import a2mix09 from "@/assets/lessons/en-a2-l01-mix09.webp.asset.json";
import a2mix10 from "@/assets/lessons/en-a2-l01-mix10.webp.asset.json";
import a2st01 from "@/assets/lessons/en-a2-l01-st01.webp.asset.json";
import a2st02 from "@/assets/lessons/en-a2-l01-st02.webp.asset.json";
import a2st03 from "@/assets/lessons/en-a2-l01-st03.webp.asset.json";
import a2st04 from "@/assets/lessons/en-a2-l01-st04.webp.asset.json";
import a2st05 from "@/assets/lessons/en-a2-l01-st05.webp.asset.json";
import a2st06 from "@/assets/lessons/en-a2-l01-st06.webp.asset.json";
import a2st07 from "@/assets/lessons/en-a2-l01-st07.webp.asset.json";
import a2st08 from "@/assets/lessons/en-a2-l01-st08.webp.asset.json";
import a2st09 from "@/assets/lessons/en-a2-l01-st09.webp.asset.json";
import a2st10 from "@/assets/lessons/en-a2-l01-st10.webp.asset.json";
import a2ps01 from "@/assets/lessons/en-a2-l01-ps01.webp.asset.json";
import a2ps02 from "@/assets/lessons/en-a2-l01-ps02.webp.asset.json";
import a2ps03 from "@/assets/lessons/en-a2-l01-ps03.webp.asset.json";
import a2ps04 from "@/assets/lessons/en-a2-l01-ps04.webp.asset.json";
import a2ps05 from "@/assets/lessons/en-a2-l01-ps05.webp.asset.json";
import a2pc01 from "@/assets/lessons/en-a2-l01-pc01.webp.asset.json";
import a2pc02 from "@/assets/lessons/en-a2-l01-pc02.webp.asset.json";
import a2pc03 from "@/assets/lessons/en-a2-l01-pc03.webp.asset.json";
import a2pc04 from "@/assets/lessons/en-a2-l01-pc04.webp.asset.json";
import a2pc05 from "@/assets/lessons/en-a2-l01-pc05.webp.asset.json";
// Images attached to individual exercise items via `item.image` keys.
import p1 from "@/assets/lessons/en-a1-l01-pr08-1.png.asset.json";
import p2 from "@/assets/lessons/en-a1-l01-pr08-2.png.asset.json";
import p3 from "@/assets/lessons/en-a1-l01-pr08-3.png.asset.json";
import p4 from "@/assets/lessons/en-a1-l01-pr08-4.png.asset.json";

export const ITEM_IMAGES: Record<string, string> = {
  "pr08-1": p1.url,
  "pr08-2": p2.url,
  "pr08-3": p3.url,
  "pr08-4": p4.url,
};

import vocabImgs from "./EN-A1-L01.vocab-images.json";
// Vocabulary picture crops, keyed as "<poster>:<word>" (e.g. "v2:teacher").
for (const [poster, words] of Object.entries(vocabImgs as Record<string, Record<string, string>>)) {
  for (const [w, url] of Object.entries(words)) ITEM_IMAGES[`${poster}:${w}`] = url;
}

// EN-A2-L01 grammar exercise illustrations.
ITEM_IMAGES["a2:ps01"] = a2ps01.url;
ITEM_IMAGES["a2:ps02"] = a2ps02.url;
ITEM_IMAGES["a2:ps03"] = a2ps03.url;
ITEM_IMAGES["a2:ps04"] = a2ps04.url;
ITEM_IMAGES["a2:ps05"] = a2ps05.url;
ITEM_IMAGES["a2:pc01"] = a2pc01.url;
ITEM_IMAGES["a2:pc02"] = a2pc02.url;
ITEM_IMAGES["a2:pc03"] = a2pc03.url;
ITEM_IMAGES["a2:pc04"] = a2pc04.url;
ITEM_IMAGES["a2:pc05"] = a2pc05.url;
ITEM_IMAGES["a2:mix01"] = a2mix01.url;
ITEM_IMAGES["a2:mix02"] = a2mix02.url;
ITEM_IMAGES["a2:mix03"] = a2mix03.url;
ITEM_IMAGES["a2:mix04"] = a2mix04.url;
ITEM_IMAGES["a2:mix05"] = a2mix05.url;
ITEM_IMAGES["a2:mix06"] = a2mix06.url;
ITEM_IMAGES["a2:mix07"] = a2mix07.url;
ITEM_IMAGES["a2:mix08"] = a2mix08.url;
ITEM_IMAGES["a2:mix09"] = a2mix09.url;
ITEM_IMAGES["a2:mix10"] = a2mix10.url;
ITEM_IMAGES["a2:st01"] = a2st01.url;
ITEM_IMAGES["a2:st02"] = a2st02.url;
ITEM_IMAGES["a2:st03"] = a2st03.url;
ITEM_IMAGES["a2:st04"] = a2st04.url;
ITEM_IMAGES["a2:st05"] = a2st05.url;
ITEM_IMAGES["a2:st06"] = a2st06.url;
ITEM_IMAGES["a2:st07"] = a2st07.url;
ITEM_IMAGES["a2:st08"] = a2st08.url;
ITEM_IMAGES["a2:st09"] = a2st09.url;
ITEM_IMAGES["a2:st10"] = a2st10.url;

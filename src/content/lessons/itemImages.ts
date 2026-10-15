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

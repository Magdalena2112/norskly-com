import a2rd1 from "@/assets/lessons/en-a2-l01-rd1.webp.asset.json";
import a2rd2 from "@/assets/lessons/en-a2-l01-rd2.webp.asset.json";
import a2rd3 from "@/assets/lessons/en-a2-l01-rd3.webp.asset.json";
import a2wr01 from "@/assets/lessons/en-a2-l01-wr01.webp.asset.json";
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

// EN-A2-L01 vocabulary exercise illustrations.
import a2vo01 from "@/assets/lessons/en-a2-l01-vo01.webp.asset.json";
import a2vo02 from "@/assets/lessons/en-a2-l01-vo02.webp.asset.json";
import a2vo03 from "@/assets/lessons/en-a2-l01-vo03.webp.asset.json";
import a2vo04 from "@/assets/lessons/en-a2-l01-vo04.webp.asset.json";
import a2vo05 from "@/assets/lessons/en-a2-l01-vo05.webp.asset.json";
import a2vo06 from "@/assets/lessons/en-a2-l01-vo06.webp.asset.json";
import a2vo07 from "@/assets/lessons/en-a2-l01-vo07.webp.asset.json";
import a2vo08 from "@/assets/lessons/en-a2-l01-vo08.webp.asset.json";
import a2vo09 from "@/assets/lessons/en-a2-l01-vo09.webp.asset.json";
import a2vo10 from "@/assets/lessons/en-a2-l01-vo10.webp.asset.json";
import a2vo11 from "@/assets/lessons/en-a2-l01-vo11.webp.asset.json";
import a2vo12 from "@/assets/lessons/en-a2-l01-vo12.webp.asset.json";
import a2vo13 from "@/assets/lessons/en-a2-l01-vo13.webp.asset.json";
import a2vo14 from "@/assets/lessons/en-a2-l01-vo14.webp.asset.json";
import a2vo15 from "@/assets/lessons/en-a2-l01-vo15.webp.asset.json";
import a2vo16 from "@/assets/lessons/en-a2-l01-vo16.webp.asset.json";
import a2vo17 from "@/assets/lessons/en-a2-l01-vo17.webp.asset.json";
import a2vo18 from "@/assets/lessons/en-a2-l01-vo18.webp.asset.json";
import a2vo19 from "@/assets/lessons/en-a2-l01-vo19.webp.asset.json";
import a2vo20 from "@/assets/lessons/en-a2-l01-vo20.webp.asset.json";
ITEM_IMAGES["a2:vo01"] = a2vo01.url;
ITEM_IMAGES["a2:vo02"] = a2vo02.url;
ITEM_IMAGES["a2:vo03"] = a2vo03.url;
ITEM_IMAGES["a2:vo04"] = a2vo04.url;
ITEM_IMAGES["a2:vo05"] = a2vo05.url;
ITEM_IMAGES["a2:vo06"] = a2vo06.url;
ITEM_IMAGES["a2:vo07"] = a2vo07.url;
ITEM_IMAGES["a2:vo08"] = a2vo08.url;
ITEM_IMAGES["a2:vo09"] = a2vo09.url;
ITEM_IMAGES["a2:vo10"] = a2vo10.url;
ITEM_IMAGES["a2:vo11"] = a2vo11.url;
ITEM_IMAGES["a2:vo12"] = a2vo12.url;
ITEM_IMAGES["a2:vo13"] = a2vo13.url;
ITEM_IMAGES["a2:vo14"] = a2vo14.url;
ITEM_IMAGES["a2:vo15"] = a2vo15.url;
ITEM_IMAGES["a2:vo16"] = a2vo16.url;
ITEM_IMAGES["a2:vo17"] = a2vo17.url;
ITEM_IMAGES["a2:vo18"] = a2vo18.url;
ITEM_IMAGES["a2:vo19"] = a2vo19.url;
ITEM_IMAGES["a2:vo20"] = a2vo20.url;

// EN-A2-L01 reading text illustrations.
ITEM_IMAGES["a2:rd1"] = a2rd1.url;
ITEM_IMAGES["a2:rd2"] = a2rd2.url;
ITEM_IMAGES["a2:rd3"] = a2rd3.url;

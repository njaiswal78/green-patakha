// Single source of truth for the cracker list. Imported by the browser game
// and by the Worker (API, MCP, docs), so keep it plain ES module data.

/** @typedef {"ground" | "sky" | "hand"} Kind */

export const CRACKERS = [
  {
    id: "phuljhadi",
    name: "Phuljhadi",
    hindi: "फुलझड़ी",
    english: "Sparkler",
    kind: "hand",
    loudness: 0,
    seconds: 9,
    about: "The one every child holds first. A wire coated in iron filings that burns down in a shower of branching gold sparks.",
  },
  {
    id: "anar",
    name: "Anar",
    hindi: "अनार",
    english: "Flower pot",
    kind: "ground",
    loudness: 1,
    seconds: 8,
    about: "A clay cone that throws a fountain of gold and silver sparks about two storeys high, with a long hiss.",
  },
  {
    id: "chakri",
    name: "Chakri",
    hindi: "चकरी",
    english: "Ground spinner",
    kind: "ground",
    loudness: 1,
    seconds: 7,
    about: "A coiled paper tube that spins on the ground, throws a ring of sparks and wanders towards your feet.",
  },
  {
    id: "pencil",
    name: "Colour Pencil",
    hindi: "पेंसिल",
    english: "Colour stick",
    kind: "ground",
    loudness: 0,
    seconds: 8,
    about: "A thin stick that burns with a red, green or purple flame. Quiet, smoky in real life, smokeless here.",
  },
  {
    id: "bijli",
    name: "Bijli",
    hindi: "बिजली",
    english: "Bijli cracker",
    kind: "ground",
    loudness: 2,
    seconds: 2,
    about: "Small red paper crackers, sold in packets of 50. A short fuse and a sharp crack.",
  },
  {
    id: "bullet",
    name: "Bullet Bomb",
    hindi: "बुलेट बम",
    english: "Bullet bomb",
    kind: "ground",
    loudness: 3,
    seconds: 3,
    about: "A stubby red cylinder no bigger than a thumb. Quick fuse, and a crack far louder than it looks.",
  },
  {
    id: "sutli",
    name: "Sutli Bomb",
    hindi: "सुतली बम",
    english: "Twine bomb",
    kind: "ground",
    loudness: 3,
    seconds: 4,
    about: "A ball of powder wrapped tight in jute twine. Long fuse, everyone runs, and the bang shakes windows.",
  },
  {
    id: "hydrogen",
    name: "Hydrogen Bomb",
    hindi: "हाइड्रोजन बम",
    english: "Big bomb",
    kind: "ground",
    loudness: 3,
    seconds: 5,
    about: "The heavyweight of the cracker shop. A fat paper block with a long fuse and the deepest boom of the night.",
  },
  {
    id: "ladi",
    name: "1000 Wala Ladi",
    hindi: "लड़ी",
    english: "Cracker string",
    kind: "ground",
    loudness: 3,
    seconds: 9,
    about: "Hundreds of small crackers braided on one fuse. It rips down the street, pop after pop, and leaves a carpet of red paper.",
  },
  {
    id: "ladi100",
    name: "100 Wala Ladi",
    hindi: "100 वाला लड़ी",
    english: "Short cracker string",
    kind: "ground",
    loudness: 2,
    seconds: 4,
    about: "The short string every lane starts the night with. A quick rattle of small pops, over in a few seconds.",
  },
  {
    id: "rocket",
    name: "Rocket",
    hindi: "रॉकेट",
    english: "Bottle rocket",
    kind: "sky",
    loudness: 2,
    seconds: 4,
    about: "Stood in an empty glass bottle, lit, and gone with a whoosh. Bursts high over the rooftops.",
  },
  {
    id: "multirocket",
    name: "Multi Rocket",
    hindi: "मल्टी रॉकेट",
    english: "Rocket rack",
    kind: "sky",
    loudness: 2,
    seconds: 7,
    about: "Seven rockets on one fuse. They leave one after another, whoosh after whoosh, and burst in a row over the rooftops.",
  },
  {
    id: "skyshot",
    name: "12 Shot",
    hindi: "स्काई शॉट",
    english: "Sky shot cake",
    kind: "sky",
    loudness: 2,
    seconds: 10,
    about: "A box of 12 tubes that fires shell after shell into the sky: peony, willow, ring and crackle.",
  },
  {
    id: "saanp",
    name: "Saanp Goli",
    hindi: "साँप की गोली",
    english: "Snake tablet",
    kind: "ground",
    loudness: 0,
    seconds: 9,
    about: "A tiny black tablet that grows a long curling ash snake. No bang, just wonder.",
  },
  {
    id: "tikli",
    name: "Tikli Bandook",
    hindi: "टिकली बंदूक",
    english: "Cap gun",
    kind: "hand",
    loudness: 1,
    seconds: 4,
    about: "The toy pistol and its red roll of paper caps. Click, pop, click, pop, and a whiff of smoke.",
  },
];

export const CRACKER_IDS = new Set(CRACKERS.map((c) => c.id));

export const LOUDNESS_LABEL = ["Gentle", "Medium", "Loud", "Very loud"];

/**
 * Cleans a sky wish or sender name and returns "" when it looks like a scam: a link, an email or a phone number
 * shown on our domain in a WhatsApp preview borrows our trust. ponytail: pattern filter, not moderation;
 * a determined troll can still write rude words, which is why wishes are never stored or listed anywhere.
 */
export function cleanWish(s, max = 80) {
  const w = String(s || "").replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim().slice(0, max);
  return /https?:|www\.|@|\.(com|in|net|org|co|io|ly|xyz|me|app|link|top|site|info)\b/i.test(w) || (w.match(/\d/g) || []).length >= 5 ? "" : w;
}

/** Splits a wish into sky bursts of at most `width` characters (word-wrapped), so each line stays big enough to read on a phone. */
export function wishLines(text, width = 22) {
  const lines = [];
  for (let word of String(text).split(/\s+/).filter(Boolean)) {
    while (word.length > width) lines.push(word.slice(0, width)), (word = word.slice(width));
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + 1 + word.length <= width) lines[last] += " " + word;
    else lines.push(word);
  }
  return lines;
}

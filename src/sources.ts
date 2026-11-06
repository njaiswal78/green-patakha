// Every outside fact the site states, with where it came from. Pages quote
// these; nothing on the site should claim more than what is here.

export const CHECKED = "6 November 2026";

export const SRC = {
  noiseRule: {
    url: "https://www.pib.gov.in/newsite/PrintRelease.aspx?relid=77780",
    label: "PIB: Noise standards for fire-crackers, Environment (Protection) Rules, 1986, Schedule I, No. 89",
  },
  scOrder: {
    url: "https://api.sci.gov.in/supremecourt/1985/63998/63998_1985_1_1501_65037_FinalOrder_15-Oct-2025.pdf",
    label: "Supreme Court of India, order of 15 October 2025 (2025 INSC 1233)",
  },
  virtualDiwali: { url: "https://virtualdiwali.com/virtual-crackers", label: "virtualdiwali.com/virtual-crackers" },
  faris: { url: "https://farisfarooq.com/crackers/diwali-crackers-simulator-game", label: "farisfarooq.com Diwali crackers simulator" },
  shareMyInvite: { url: "https://www.sharemyinvite.in/virtual-crackers", label: "sharemyinvite.in/virtual-crackers" },
  oxaam: { url: "https://www.oxaam.com/tools/green-diwali-crackers/", label: "oxaam.com Green Diwali Cracker Burst" },
  sounds: { url: "https://commons.wikimedia.org/wiki/Category:Fireworks_sounds", label: "Wikimedia Commons" },
};

export const COMPETITORS = [
  {
    name: "Virtual Diwali",
    src: SRC.virtualDiwali,
    price: "Free",
    crackers: "7 listed",
    sound: "“Every cracker has its own sound.” Source not listed",
    volume: "Mute “from the top corner”",
    freedom: "Find 16 hidden boxes in the game; a simulator mode has every cracker",
    openSource: "Not listed",
    extra: "3D mohalla, 108 diyas, shared lantern sky",
  },
  {
    name: "Faris Farooq Rah simulator",
    src: SRC.faris,
    price: "Free",
    crackers: "6",
    sound: "Synthesised. “There are no recordings.”",
    volume: "Not listed",
    freedom: "Tap anywhere, no score",
    openSource: "Not listed",
    extra: "Write a wish with the phuljhadi, share a link",
  },
  {
    name: "ShareMyInvite",
    src: SRC.shareMyInvite,
    price: "Free to tap; paid greeting (“One payment”)",
    crackers: "Rockets, flower pots, sparklers, finale",
    sound: "Not listed",
    volume: "Speaker button",
    freedom: "Tap the sky",
    openSource: "Not listed",
    extra: "Personalised family greeting with a photo",
  },
  {
    name: "OXAAM Green Diwali",
    src: SRC.oxaam,
    price: "Free",
    crackers: "5",
    sound: "“Crackers pop and rockets whistle.” Source not listed",
    volume: "“Use the sound button to switch it off”",
    freedom: "Rounds of 20 with a timing score",
    openSource: "Not listed",
    extra: "Score and combos to share",
  },
];

// ─── Tile definitions ─────────────────────────────────────────────────────────

export type Suit = "circles" | "bamboo" | "wind" | "dragon";
export type TileType = "shield" | "redflag" | "action";

export interface TileInfo {
  id: string;
  suit: Suit;
  hanzi: string;
  num: number | null;
  icon: string;
  label: string;
  tip: string;
  /** A short real-world example shown when a player taps the tile. */
  example: string;
  type: TileType;
}

/** A tile instance id looks like "A1:3" (base id + copy index). */
export type TileInstance = string;

export const TILE_DATA: Record<string, TileInfo> = {
  // ── Suit A: Circles 筒 (blue) ──────────────────────────────────────────────
  A1: { id: "A1", suit: "circles", hanzi: "筒", num: 1, icon: "🛡", label: "Guard Info", tip: "Guard your personal info", example: "Never share your NRIC, OTP or bank login because real agencies will never ask for them.", type: "shield" },
  A2: { id: "A2", suit: "circles", hanzi: "筒", num: 2, icon: "🪪", label: "NRIC?", tip: "They ask for your NRIC", example: "A 'bank officer' asks you to read out your full NRIC to 'verify your identity'.", type: "redflag" },
  A3: { id: "A3", suit: "circles", hanzi: "筒", num: 3, icon: "❓", label: "Why?", tip: "Ask why they need it", example: "Ask 'Why do you need this?': a real caller can explain; a scammer dodges.", type: "shield" },
  A4: { id: "A4", suit: "circles", hanzi: "筒", num: 4, icon: "👮", label: "Fake Cop", tip: "Fake government / police officer", example: "'This is the police, your account is linked to crime. Transfer your savings to a safe account.'", type: "redflag" },
  A5: { id: "A5", suit: "circles", hanzi: "筒", num: 5, icon: "📞", label: "Call Back", tip: "Hang up, call the real number back", example: "Hang up and call the number on the back of your bank card to check.", type: "shield" },
  A6: { id: "A6", suit: "circles", hanzi: "筒", num: 6, icon: "👤", label: "Unknown", tip: "Wrong-number 'friend'", example: "A stranger texts 'Hi, it's me, I changed my number!' to act like a friend.", type: "redflag" },
  A7: { id: "A7", suit: "circles", hanzi: "筒", num: 7, icon: "🚫", label: "Block", tip: "Ignore and block", example: "Don't reply, block the number and delete the message.", type: "shield" },
  A8: { id: "A8", suit: "circles", hanzi: "筒", num: 8, icon: "💰", label: "Sure Win?", tip: "'Insider' investment tip", example: "'Insider tip: guaranteed 30% returns this week, only a few slots left!'", type: "redflag" },
  A9: { id: "A9", suit: "circles", hanzi: "筒", num: 9, icon: "⚠", label: "Not Real", tip: "Guaranteed returns = fake", example: "No real investment guarantees profit, so 'guaranteed returns' means scam.", type: "shield" },

  // ── Suit B: Bamboo 條 (green) ──────────────────────────────────────────────
  B1: { id: "B1", suit: "bamboo", hanzi: "條", num: 1, icon: "💡", label: "Gut", tip: "Trust your gut", example: "If something feels off, trust that feeling and stop before you act.", type: "shield" },
  B2: { id: "B2", suit: "bamboo", hanzi: "條", num: 2, icon: "⏰", label: "Hurry!", tip: '"Act now!" pressure', example: "'Act now! Your account will be frozen in 10 minutes.'", type: "redflag" },
  B3: { id: "B3", suit: "bamboo", hanzi: "條", num: 3, icon: "😴", label: "Wait", tip: "Sleep on it", example: "Sleep on it because a genuine offer won't disappear if you take a day to check.", type: "shield" },
  B4: { id: "B4", suit: "bamboo", hanzi: "條", num: 4, icon: "🎰", label: '"Win"', tip: "Fake lottery win", example: "'Congratulations! You've won $5,000, just pay a small fee to release it.'", type: "redflag" },
  B5: { id: "B5", suit: "bamboo", hanzi: "條", num: 5, icon: "🚷", label: "No Entry", tip: "You never entered any draw", example: "You never joined any lucky draw, so you can't have won one.", type: "shield" },
  B6: { id: "B6", suit: "bamboo", hanzi: "條", num: 6, icon: "❤", label: "Fake Love", tip: "Romance stranger", example: "An online 'partner' you've never met asks for money for an 'emergency'.", type: "redflag" },
  B7: { id: "B7", suit: "bamboo", hanzi: "條", num: 7, icon: "🤝", label: "Meet", tip: "Insist on meeting in person", example: "Insist on meeting face-to-face before sending anyone money.", type: "shield" },
  B8: { id: "B8", suit: "bamboo", hanzi: "條", num: 8, icon: "🤐", label: "Secret?", tip: '"Don\'t tell anyone"', example: "'Don't tell your family about this and keep it our little secret.'", type: "redflag" },
  B9: { id: "B9", suit: "bamboo", hanzi: "條", num: 9, icon: "📢", label: "Tell", tip: "Tell someone you trust", example: "Tell someone you trust before acting as they may spot the trick you missed.", type: "shield" },

  // ── Winds (red-tinted bg) ──────────────────────────────────────────────────
  WE: { id: "WE", suit: "wind", hanzi: "東", num: null, icon: "🎭", label: "Official", tip: "Fake official / government impersonation", example: "A caller claims to be from a government agency demanding immediate payment.", type: "redflag" },
  WS: { id: "WS", suit: "wind", hanzi: "南", num: null, icon: "🎣", label: "Phish", tip: "Phishing bait", example: "A text with a link: 'Update your bank details here' and leading to a fake site.", type: "redflag" },
  WW: { id: "WW", suit: "wind", hanzi: "西", num: null, icon: "💎", label: "Offer", tip: "Phantom offer", example: "A 'job' paying a lot for easy work, but you must pay a deposit first.", type: "redflag" },
  WN: { id: "WN", suit: "wind", hanzi: "北", num: null, icon: "👻", label: "Friend", tip: "Fake friend", example: "'Mum, I lost my phone, please transfer to this new number urgently.'", type: "redflag" },

  // ── Dragons (gold bg) ──────────────────────────────────────────────────────
  DR: { id: "DR", suit: "dragon", hanzi: "中", num: null, icon: "➕", label: "ADD", tip: "Install ScamShield · Enable 2FA · Set Money Lock", example: "Add protections: install ScamShield, turn on 2FA, set up Money Lock at your bank.", type: "action" },
  DG: { id: "DG", suit: "dragon", hanzi: "發", num: null, icon: "✓", label: "CHECK", tip: "Call 1799 · Verify with official source · Ask family", example: "Check first: call 1799 (ScamShield Helpline) to verify anything suspicious.", type: "action" },
  DW: { id: "DW", suit: "dragon", hanzi: "白", num: null, icon: "📣", label: "TELL", tip: "Tell family · Tell police · Tell community", example: "Tell others: warn family, report to police (999 / 1799), alert your community.", type: "action" },
};

/** All distinct tile base ids, in canonical order. */
export const TILE_BASES = Object.keys(TILE_DATA);

/** Get base tile id from an instance (e.g. "A1:3" → "A1"). */
export function base(tileInstance: TileInstance): string {
  return tileInstance.split(":")[0];
}

/** Get tile data from an instance id. */
export function getTile(tileInstance: TileInstance): TileInfo | undefined {
  return TILE_DATA[base(tileInstance)];
}

export const SEAT_NAMES: Record<number, string> = { 0: "東", 1: "南", 2: "西", 3: "北" };
export const SEAT_FULL: Record<number, string> = {
  0: "East 東",
  1: "South 南",
  2: "West 西",
  3: "North 北",
};

// ── DNA cards (scam-defence facts surfaced when a tile is claimed) ─────────────
export interface DnaCard {
  title: string;
  stat: string;
  tool: string;
  src: string;
}

export const DNA_CARDS: Record<string, DnaCard> = {
  WE: { title: "Govt Impersonation", stat: "$242.9M lost to govt impersonation in 2025, +60.5% Y/Y", tool: "Call 1799 to verify any govt call", src: "SPF Annual Scams Brief 2025" },
  WN: { title: "Fake Friend", stat: "'Lost my phone' relative scam remains top-5 elder scam", tool: "Call the real person on a known number first", src: "SPF 2025" },
  WS: { title: "Phishing", stat: "84% of scam cases involved online platforms", tool: "Enable 2FA · Never click unverified links", src: "SPF 2025" },
  WW: { title: "Phantom Offer", stat: "Investment + job scams combined: $200M+ in 2025", tool: "Verify on ScamAlert.sg · Call 1799", src: "SPF 2025" },
  B2: { title: "Urgency Pressure", stat: "73% of bank-impersonation scams used a 24-hour deadline", tool: "Real banks never demand instant action", src: "SPF 2025" },
  B8: { title: "Secrecy Signal", stat: "'Don't tell family' is the red flag before a transfer request", tool: "Tell someone you trust immediately", src: "SPF 2025" },
  DR: { title: "ADD Protections", stat: "Money Lock: 479,000 customers locked ~$44B from transfers", tool: "Enable Money Lock at your bank today", src: "MAS 2025" },
  DG: { title: "CHECK First", stat: "ScamShield blocked 120,000+ scam entities since 2022", tool: "Call 1799 (ScamShield Helpline, 24/7)", src: "SPF 2025" },
  DW: { title: "TELL Someone", stat: "Scam cases fell 24.8% in 2025, the first-ever decline in Singapore", tool: "Report to police.gov.sg · Tell your community", src: "SPF 2025" },
  A4: { title: "Fake Police", stat: 'Real police never ask you to transfer money or "safeguard" funds', tool: "Hang up · Call 999 to verify", src: "SPF Advisory" },
};

export function getDnaCard(tileBase: string): DnaCard | null {
  return DNA_CARDS[tileBase] || null;
}

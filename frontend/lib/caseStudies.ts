// Real-life Singapore case studies for the educational pause. When a Pung/Chi
// triggers a LESSON, the iPad's second stage and the player phones show one of
// these so a younger player can teach an elder: what the scam is, a past local
// example, the red flags that example reveals, and the actions to take.
//
// Keyed by tile base id, mirroring the DNA_CARDS coverage (GAME_MECHANIC_BRIEF §6).
// Pure presentation content, so it lives on the frontend: the LESSON payload
// already carries the triggering bases. Reuse the cited stat/source from
// DNA_CARDS rather than restating figures here.
//
// House style: no em-dashes anywhere in the copy.

import { TILE_DATA, DNA_CARDS } from "./tiles";

export interface ScamCase {
  /** A short plain-language description of what this kind of scam is. */
  whatItIs: string;
  /** One past Singapore example, summarised for a quick read-aloud. */
  example: string;
  /** A few red flags the example illustrates, so an elder can spot the pattern. */
  redFlags: string[];
  /** Concrete things to do, or avoid, to stay safe. */
  actions: string[];
  /** Optional link to the real advisory or article. */
  link?: string;
}

export const CASE_STUDIES: Record<string, ScamCase> = {
  // ── WE: Government / official impersonation ──────────────────────────────────
  WE: {
    whatItIs:
      "Someone pretends to be from a government agency (police, MOH, ICA, a ministry) and says you are in trouble or owe money, so you pay or hand over details fast.",
    example:
      "You got a call from a 'government officer' who said your identity was used in a money-laundering case. To 'clear your name' you were told to move your savings to a 'safe account'. You transferred tens of thousands before your son realised the agency does not work this way.",
    redFlags: [
      "An unexpected call claiming to be a government officer.",
      "You are accused of a crime and told only they can fix it.",
      "You are told to transfer money to a 'safe account' to prove innocence.",
      "You are told to stay on the line and not hang up.",
    ],
    actions: [
      "Hang up. No real agency asks you to move money to a safe account.",
      "Call 1799 (the ScamShield Helpline) to check before doing anything.",
      "Verify the agency yourself using a number from its official website.",
    ],
  },

  // ── WN: Fake friend / relative ("lost my phone") ─────────────────────────────
  WN: {
    whatItIs:
      "A message from a new number claims to be your child, relative or friend who lost their phone, then asks you to transfer money urgently.",
    example:
      "You received a WhatsApp from a number you did not recognise: 'Mum, I dropped my phone, this is my new number.' Soon after, 'your son' said he could not pay a supplier and asked you to transfer the money for him. Your real son was at work the whole time and knew nothing about it.",
    redFlags: [
      "A new, unknown number says it belongs to someone you know.",
      "They cannot take a call and only want to chat by text.",
      "A sudden money request follows, framed as urgent.",
      "The story explains away every check you try to make.",
    ],
    actions: [
      "Call the person on their old, known number to confirm.",
      "Ask a question only the real person could answer.",
      "Never transfer money based on a text from a new number.",
    ],
  },

  // ── WS: Phishing ─────────────────────────────────────────────────────────────
  WS: {
    whatItIs:
      "A text, email or message contains a link to a fake login page that looks real, to steal your bank password, card details or one-time passwords (OTP).",
    example:
      "You got an SMS saying your account was locked and you must 'verify' through a link. The page looked exactly like your bank. After you keyed in your login and OTP, money was drawn from your account within minutes.",
    redFlags: [
      "A message with a link asking you to log in or 'verify'.",
      "The link address is slightly off or not the bank's real site.",
      "It warns your account is locked unless you act now.",
      "It asks for your password or OTP, which a real bank never does.",
    ],
    actions: [
      "Do not click links in messages. Open the bank's app yourself.",
      "Never share your OTP or password with anyone.",
      "Turn on 2FA, and use the bank's official app to check alerts.",
    ],
  },

  // ── WW: Phantom investment / job offer ───────────────────────────────────────
  WW: {
    whatItIs:
      "An offer that looks too good to be true: a high-return investment or an easy 'work from home' job that quietly asks you to pay money in first.",
    example:
      "You joined a chat group promising daily returns from an investment platform. Early small 'profits' let you withdraw a little, which built your trust. When you put in your savings, the platform asked for more 'tax' and 'fees' to release the money, then vanished.",
    redFlags: [
      "Guaranteed or unusually high returns with little risk.",
      "Small early payouts to win your trust before a big ask.",
      "A job that pays well but needs a deposit or 'training fee' first.",
      "Pressure to recruit friends or to act before a deadline.",
    ],
    actions: [
      "Check the company on the MAS Investor Alert List and ScamAlert.sg.",
      "Real jobs and real investments never ask you to pay to get in.",
      "Call 1799 if you are unsure before sending any money.",
    ],
  },

  // ── B1: Trust your gut (a habit that prevents loss) ──────────────────────────
  B1: {
    whatItIs:
      "Not a scam itself, but the habit of trusting that 'something feels off' feeling and stopping to check, because that instinct is often the first warning of a scam.",
    example:
      "You felt uneasy when a 'bank officer' rushed you to move money, even though you could not say exactly why. You trusted that feeling, hung up to check with your son, and avoided losing your savings.",
    redFlags: [
      "A request that feels wrong even if you cannot explain why.",
      "Pressure that makes you uncomfortable or anxious.",
      "A story that does not quite add up.",
    ],
    actions: [
      "If something feels off, stop before you act.",
      "Take time to check with someone you trust.",
      "Call 1799 to confirm if you are unsure.",
    ],
  },

  // ── B2: Urgency pressure ─────────────────────────────────────────────────────
  B2: {
    whatItIs:
      "The scammer manufactures panic: a short deadline, a frozen account, a fine, so you act before you have time to think or check.",
    example:
      "You were told your bank account would be frozen in ten minutes unless you 'reconfirmed' your details right away. The rush stopped you from pausing to call your bank. Only later did you learn a real bank would never give a ten-minute ultimatum.",
    redFlags: [
      "A countdown or deadline: 'act now', 'in 10 minutes', 'today only'.",
      "Threats that your account or number will be cut off.",
      "They keep you on the line so you cannot check with anyone.",
      "Any pause to verify is treated as a problem.",
    ],
    actions: [
      "Slow down. Pressure to rush is itself the warning sign.",
      "Real banks and agencies never demand instant action.",
      "Hang up, then call the bank using the number on your card.",
    ],
  },

  // ── B3: Sleep on it (a habit that prevents loss) ─────────────────────────────
  B3: {
    whatItIs:
      "Not a scam itself, but the habit of giving yourself time ('sleep on it') before acting, because a genuine offer survives a delay and a scam relies on you not pausing.",
    example:
      "You were urged to put money into a 'limited time' deal that closed at midnight. You decided to sleep on it, and by morning you had read up and found it was a known scam, while the 'deadline' had been pure pressure.",
    redFlags: [
      "A deal that is only good 'right now' or 'today only'.",
      "Pressure that you will 'miss out' if you wait.",
      "No room given for you to think or check.",
    ],
    actions: [
      "Take a night to think before acting on any offer or demand.",
      "A real opportunity will still be there tomorrow.",
      "Use the pause to verify and to ask someone you trust.",
    ],
  },

  // ── B4: Fake lottery win ─────────────────────────────────────────────────────
  B4: {
    whatItIs:
      "A message says you have won a prize, lottery or lucky draw, but you must pay a 'fee', 'tax' or 'delivery charge' first to release winnings that do not exist.",
    example:
      "You got an SMS saying you had won $5,000 in a lucky draw and just had to pay a small 'processing fee'. After you paid, the 'organiser' asked for more fees, and the prize never came.",
    redFlags: [
      "You 'won' a draw or lottery you never entered.",
      "You must pay a fee or tax before you can collect.",
      "Pressure to claim quickly before the prize 'expires'.",
    ],
    actions: [
      "Never pay to receive a prize, as real winnings never require a fee.",
      "Ignore and delete the message, because you cannot win a draw you did not enter.",
      "Check on ScamAlert.sg or call 1799 if you are tempted.",
    ],
  },

  // ── B5: You never entered any draw (a habit that prevents loss) ───────────────
  B5: {
    whatItIs:
      "Not a scam itself, but the simple check that you cannot win a lucky draw or lottery you never joined, which instantly exposes a fake 'you won' message.",
    example:
      "You received a 'congratulations, you've won' message. You paused and remembered you had not entered any draw, so you deleted it. A neighbour who believed a similar message paid a 'fee' and lost the money.",
    redFlags: [
      "A win notice for a draw, contest or lottery you never entered.",
      "Excitement designed to stop you thinking it through.",
      "A request for a fee or your details to 'claim'.",
    ],
    actions: [
      "Ask yourself if you ever entered, and if not, treat it as a scam.",
      "Do not pay or share details to claim a prize.",
      "Delete the message and warn others who might fall for it.",
    ],
  },

  // ── B6: Romance stranger ─────────────────────────────────────────────────────
  B6: {
    whatItIs:
      "Someone you met online builds a romantic relationship over weeks or months, never meets in person, then asks for money for an 'emergency', a trip to visit you, or an investment.",
    example:
      "You grew close to an online 'partner' who said all the right things but always had a reason not to meet. When he asked for money for a sudden 'medical emergency', you sent it, and he kept asking until you realised he was never real.",
    redFlags: [
      "An online partner who professes strong feelings very quickly.",
      "They always have an excuse not to meet or video call.",
      "A request for money for an emergency, travel or an investment.",
    ],
    actions: [
      "Never send money to someone you have not met in person.",
      "Insist on a video call or a real meeting before trusting them.",
      "Talk to family or call 1799 if you are being asked for money.",
    ],
  },

  // ── B7: Meet in person (a habit that prevents loss) ──────────────────────────
  B7: {
    whatItIs:
      "Not a scam itself, but the habit of insisting on a real, in-person meeting before trusting or sending money to someone you only know online, which most romance scammers can never do.",
    example:
      "Chatting with an online 'girlfriend', you kept suggesting you meet for kopi, but she always cancelled at the last minute. The pattern made you realise she was not who she claimed, before any money changed hands.",
    redFlags: [
      "Endless reasons why an in-person meeting cannot happen.",
      "A relationship that exists only through chat or messages.",
      "A money request arriving before you have ever met.",
    ],
    actions: [
      "Insist on meeting face to face before you trust or send money.",
      "Treat constant excuses to avoid meeting as a warning sign.",
      "Ask family for a second opinion about someone you met online.",
    ],
  },

  // ── B8: Secrecy signal ───────────────────────────────────────────────────────
  B8: {
    whatItIs:
      "The scammer tells you to keep it secret, so no one you trust can talk you out of it before you send money.",
    example:
      "You were told your case was 'confidential' and that telling your family would 'obstruct an investigation'. Cut off from advice, you made several transfers. When you finally told your daughter, she recognised the pattern at once.",
    redFlags: [
      "You are told not to tell family, friends or the bank.",
      "Secrecy is framed as protecting you or an 'investigation'.",
      "They want you to handle everything alone and quickly.",
      "You feel ashamed or afraid to ask anyone for a second opinion.",
    ],
    actions: [
      "Secrecy is a red flag. Tell someone you trust straight away.",
      "A real case is never harmed by you checking with family.",
      "Report it at police.gov.sg or call 1799.",
    ],
  },

  // ── B9: Tell someone you trust (a habit that prevents loss) ──────────────────
  B9: {
    whatItIs:
      "Not a scam itself, but the habit of telling a trusted family member or friend before you act, because a second person often spots the trap you are too close to see.",
    example:
      "You were about to transfer money for an 'urgent' family request when you mentioned it to your daughter first. She recognised the 'lost my phone' scam at once and stopped the transfer.",
    redFlags: [
      "A request that comes with 'don't tell anyone' or strong urgency.",
      "Feeling you must handle it alone and quickly.",
      "Embarrassment that stops you from asking for advice.",
    ],
    actions: [
      "Tell someone you trust before acting on anything unexpected.",
      "A second opinion costs nothing and can stop a scam.",
      "Report anything suspicious at police.gov.sg or call 1799.",
    ],
  },

  // ── A1: Guard your personal info (a habit that prevents loss) ────────────────
  A1: {
    whatItIs:
      "Not a scam itself, but the habit of guarding your personal details (NRIC, OTP, bank login, card numbers) so a scammer never has the pieces they need to reach your money.",
    example:
      "You got a call from someone claiming to be from your bank who asked you to 'confirm' your OTP. Because you had learned never to read out an OTP to anyone, you refused and hung up, and your account stayed safe.",
    redFlags: [
      "Anyone who asks for your NRIC, OTP, password or full card number.",
      "A caller who says they need your details to 'verify' or 'protect' you.",
      "Forms, links or calls that want more information than the task needs.",
    ],
    actions: [
      "Never share your OTP or password, as no real agency will ever ask for them.",
      "Give your NRIC only when you started the request and trust who you are dealing with.",
      "If in doubt, hang up and call the organisation back on its official number.",
    ],
  },

  // ── A2: They ask for your NRIC ───────────────────────────────────────────────
  A2: {
    whatItIs:
      "A caller or message pressures you to hand over your full NRIC number, which a scammer can then use to impersonate you, open accounts, or sound convincing on a later call.",
    example:
      "You got a call from a 'bank officer' who said your account needed 'verification' and asked you to read out your full NRIC. The number was later used to make a follow-up scam call feel genuine, because the caller already 'knew' your details.",
    redFlags: [
      "An unexpected caller asks you to read out your full NRIC.",
      "They say it is needed to 'verify your identity' or 'protect your account'.",
      "They already have some details, which makes the request feel safe.",
    ],
    actions: [
      "Do not read out your NRIC to anyone who called you first.",
      "Hang up and call the organisation back on its official number to check.",
      "Remember that knowing some of your details does not make a caller genuine.",
    ],
  },

  // ── A3: Ask why they need it (a habit that prevents loss) ────────────────────
  A3: {
    whatItIs:
      "Not a scam itself, but the simple habit of asking 'why do you need this?' before you give any information or money, because a genuine request can be explained and a scam cannot.",
    example:
      "You were asked to confirm your bank login to 'release a refund'. When you asked why a refund would need your login, the caller grew impatient and hung up, which told you all you needed to know.",
    redFlags: [
      "A request that cannot be clearly explained when you ask why.",
      "The caller gets annoyed, vague or rushed when questioned.",
      "The reason keeps changing each time you push back.",
    ],
    actions: [
      "Always ask why your information or money is needed.",
      "A genuine caller can explain calmly, while a scammer dodges or pressures you.",
      "If the answer does not make sense, stop and verify before acting.",
    ],
  },

  // ── A4: Fake police ──────────────────────────────────────────────────────────
  A4: {
    whatItIs:
      "A caller claims to be the police and says your account is linked to crime, then pressures you to 'safeguard' your money by transferring it to them.",
    example:
      "You were video-called by a 'police officer' in uniform who showed an official-looking warrant on screen. Frightened, you followed instructions and moved your savings to 'safeguard' them. Real officers never make such demands or ask for transfers.",
    redFlags: [
      "A caller in uniform or showing a 'warrant' over a call.",
      "You are accused of a crime you know nothing about.",
      "You are told to transfer or 'safeguard' your funds.",
      "You are warned not to hang up or tell anyone.",
    ],
    actions: [
      "Hang up. Police never ask you to transfer money to safeguard it.",
      "Call 999 to verify, or 1799 to check if it is a scam.",
      "Do not act alone. Tell a family member what happened.",
    ],
  },

  // ── A5: Hang up and call back (a habit that prevents loss) ───────────────────
  A5: {
    whatItIs:
      "Not a scam itself, but the habit of ending a suspicious call and dialling the organisation yourself on its official number, so you are sure who you are really speaking to.",
    example:
      "You got a call saying there was fraud on your card and you had to act now. Instead of following the caller, you hung up and dialled the number on the back of your card. The bank confirmed there was no problem and that the call was a scam.",
    redFlags: [
      "A caller who insists you stay on the line and not hang up.",
      "Pressure to act immediately, before you can check.",
      "A number that looks official on screen but called you out of the blue.",
    ],
    actions: [
      "Hang up and call back using the number on your card or the official website.",
      "Never use a number the caller gives you to 'verify' them.",
      "A real organisation is always happy for you to call back.",
    ],
  },

  // ── A6: Wrong-number 'friend' ────────────────────────────────────────────────
  A6: {
    whatItIs:
      "A stranger messages from an unknown number pretending to be a friend or acquaintance ('Hi, it's me, I changed my number!'), then slowly builds rapport before steering you toward a scam.",
    example:
      "You received a friendly text from an unknown number saying 'Hi, long time no see, I changed my number!'. After days of chatting, the 'old friend' introduced a 'cannot lose' investment, and you realised you had never known this person at all.",
    redFlags: [
      "A new number claims to be someone you know but stays vague about who.",
      "Friendly small talk that slowly turns to money or an 'opportunity'.",
      "They avoid a voice or video call that would reveal who they are.",
    ],
    actions: [
      "Ask a question only the real person would know the answer to.",
      "Do not assume a warm message from an unknown number is genuine.",
      "Block and delete if you cannot confirm who it really is.",
    ],
  },

  // ── A7: Ignore and block (a habit that prevents loss) ────────────────────────
  A7: {
    whatItIs:
      "Not a scam itself, but the habit of not engaging at all: ignore, block and delete a suspicious call or message instead of replying, because every reply invites the next step.",
    example:
      "You kept getting 'you have a parcel' and 'your account is suspended' texts. Once you started blocking and deleting them without replying, the messages had no hook in you and you lost nothing.",
    redFlags: [
      "Unsolicited messages with links, threats or urgent requests.",
      "A feeling that replying 'just to check' might sort it out.",
      "Repeated messages designed to wear you down.",
    ],
    actions: [
      "Do not reply, even to say 'stop', and just block the number and delete it.",
      "Use ScamShield to filter out known scam calls and messages.",
      "If it claims to be a real company, contact them on their official channel instead.",
    ],
  },

  // ── A8: 'Insider' investment tip ─────────────────────────────────────────────
  A8: {
    whatItIs:
      "An 'insider' or 'guaranteed' investment tip promises high returns with little or no risk, often through a chat group or app, to lure your savings into a platform that will not pay out.",
    example:
      "You joined a stock 'tips' group where members posted screenshots of big profits. You invested after seeing small early payouts, but when you tried to withdraw your savings, the platform demanded more 'fees' and then vanished.",
    redFlags: [
      "'Guaranteed', 'insider' or unusually high returns with little risk.",
      "Pressure that only a few slots are left, so you must act now.",
      "Small early payouts that build trust before a bigger deposit.",
    ],
    actions: [
      "Check the platform on the MAS Investor Alert List before putting in money.",
      "Remember that no real investment can guarantee profit.",
      "Verify on ScamAlert.sg or call 1799 if you are unsure.",
    ],
  },

  // ── A9: Guaranteed returns = fake (a habit that prevents loss) ───────────────
  A9: {
    whatItIs:
      "Not a scam itself, but the rule of thumb that any 'guaranteed' or unusually high return is not real, so naming it as fake protects you from investment scams.",
    example:
      "You were shown an app promising fixed daily returns 'with no risk'. Because you knew that guaranteed profit does not exist, you walked away, while others who joined later lost their deposits when the app shut down.",
    redFlags: [
      "Promises of 'guaranteed', 'risk-free' or fixed high returns.",
      "Returns that sound far better than any real bank or fund.",
      "Urgency and secrecy around a 'special' opportunity.",
    ],
    actions: [
      "Treat 'guaranteed returns' as a sign of a scam, not an opportunity.",
      "Check any investment on the MAS Investor Alert List first.",
      "Ask a trusted family member or call 1799 before you commit.",
    ],
  },

  // ── DR: ADD protections (a habit that prevents loss) ─────────────────────────
  DR: {
    whatItIs:
      "Not a scam itself, but the protective habit of adding layers (ScamShield, 2FA, Money Lock) so that even a convincing scammer cannot move your money.",
    example:
      "You had set up Money Lock on part of your savings. When you were later tricked into trying a transfer, the locked funds simply could not be moved on the spot, which bought you time to realise it was a scam and stop.",
    redFlags: [
      "Most loss happens when there is nothing slowing a transfer down.",
      "A scammer counts on instant, unprotected access to your money.",
      "Without 2FA, a stolen password is enough to drain an account.",
    ],
    actions: [
      "Set up Money Lock at your bank so a portion cannot be moved fast.",
      "Install ScamShield to block known scam calls and messages.",
      "Turn on 2FA for your bank and key accounts today.",
    ],
  },

  // ── DG: CHECK first (a habit that prevents loss) ─────────────────────────────
  DG: {
    whatItIs:
      "Not a scam itself, but the protective habit of checking with an official source before you act on any call, message or offer.",
    example:
      "You got a suspicious 'parcel held by customs' message. Instead of paying the 'fee', you called 1799 to check. The helpline confirmed it was a known scam, and you lost nothing.",
    redFlags: [
      "A request that feels urgent and wants money or details now.",
      "A story you cannot easily confirm on your own.",
      "Pressure not to check with anyone before acting.",
    ],
    actions: [
      "Call 1799, the ScamShield Helpline, open 24/7, to verify.",
      "Confirm with the real agency using its official website.",
      "Ask a family member before you act on anything unexpected.",
    ],
  },

  // ── DW: TELL someone (a habit that prevents loss) ────────────────────────────
  DW: {
    whatItIs:
      "Not a scam itself, but the protective habit of telling family, police or your community, which both protects you and warns others.",
    example:
      "After almost falling for a phone scam, you told your neighbours and reported it. Days later a neighbour got the same call, recognised it from your warning, and hung up safely.",
    redFlags: [
      "Staying silent lets a scam keep working on the next person.",
      "Embarrassment can stop people from reporting in time.",
      "Scammers reuse the same script across a whole neighbourhood.",
    ],
    actions: [
      "Tell family and friends what happened, with no shame.",
      "Report scams at police.gov.sg, or call 999 if money was lost.",
      "Warn your community so the same trick does not work twice.",
    ],
  },
};

/**
 * Pick which base's case study to show for a meld. Every tile now has a case
 * study, so for a Chi run (always ascending, e.g. A3-A4-A5) we make a deliberate
 * choice rather than "first one with content", so stage 2 teaches the same tile
 * the iPad's stage 1 already highlights:
 *   1. the cited scam/action tile (the one carrying the DNA stat), else
 *   2. the trap in the run (the red-flag tile the player must recognise), else
 *   3. the meld's own tile (e.g. a Pung of a shield tile teaches that habit).
 * Mirrors the dnaBase selection in lib/education.ts.
 */
function focusBase(bases: string[]): string | null {
  const present = bases.map((b) => b.split(":")[0]).filter((b) => CASE_STUDIES[b]);
  if (present.length === 0) return null;
  return (
    present.find((b) => DNA_CARDS[b]) ??
    present.find((b) => TILE_DATA[b]?.type === "redflag") ??
    present[0]
  );
}

/** Resolve the case study for a lesson's tiles (see focusBase for which tile wins). */
export function getScamCase(bases: string[]): ScamCase | null {
  const b = focusBase(bases);
  return b ? CASE_STUDIES[b] : null;
}

/** The base id behind a lesson's case study, so callers can also look up TILE_DATA. */
export function getScamCaseBase(bases: string[]): string | null {
  return focusBase(bases);
}

// Universally wrong "what to do" answers, reused as distractors in the in-pause
// check. None of these is ever a correct response to a scam, so they are safe to
// mix with any case study's real action.
export const GENERIC_WRONG_ACTIONS: string[] = [
  "Transfer your money to the 'safe account' they gave you",
  "Share the OTP or password so they can verify you",
  "Click the link in the message to sort it out quickly",
  "Keep it secret and settle it yourself before the deadline",
];

export interface FixOption {
  text: string;
  correct: boolean;
}

// A small stable hash so option order is deterministic (no Math.random, so no
// SSR/hydration mismatch and no reshuffle on re-render).
function seedFrom(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * Three options for the "what should you do?" check: the case study's real first
 * action plus two generic wrong actions, placed in a deterministic order.
 */
export function buildFixOptions(scamCase: ScamCase): FixOption[] {
  const correctAction = scamCase.actions[0];
  // Guard the invariant: ScamCase.actions is typed string[], so an empty list is
  // a valid input even though no current case study has one. With no real action
  // to offer, there is no correct answer to fabricate, so fall back to three
  // generic (all-wrong) options in a deterministic order. Never throw.
  if (correctAction === undefined) {
    const base = seedFrom("no-action") % GENERIC_WRONG_ACTIONS.length;
    return [0, 1, 2].map((k) => ({
      text: GENERIC_WRONG_ACTIONS[(base + k) % GENERIC_WRONG_ACTIONS.length],
      correct: false,
    }));
  }
  const seed = seedFrom(correctAction);
  const start = seed % GENERIC_WRONG_ACTIONS.length;
  const opts: FixOption[] = [
    { text: correctAction, correct: true },
    { text: GENERIC_WRONG_ACTIONS[start], correct: false },
    { text: GENERIC_WRONG_ACTIONS[(start + 1) % GENERIC_WRONG_ACTIONS.length], correct: false },
  ];
  // Move the correct option to a deterministic slot so it is not always first.
  const [correctOpt] = opts.splice(0, 1);
  opts.splice(seed % 3, 0, correctOpt);
  return opts;
}

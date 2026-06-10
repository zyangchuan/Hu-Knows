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

export interface ScamCase {
  /** A short plain-language description of what this kind of scam is. */
  whatItIs: string;
  /** One past Singapore example, summarised for a quick read-aloud. */
  example: string;
  /** A few red flags the example illustrates, so an elder can spot the pattern. */
  redFlags: string[];
  /** Concrete things to do, or avoid, to stay safe. */
  actions: string[];
  /** Optional news-article picture. Drop files into /public/case-studies/. */
  image?: { src: string; caption?: string };
  /** Optional link to the real advisory or article. */
  link?: string;
}

export const CASE_STUDIES: Record<string, ScamCase> = {
  // ── WE: Government / official impersonation ──────────────────────────────────
  WE: {
    whatItIs:
      "Someone pretends to be from a government agency (police, MOH, ICA, a ministry) and says you are in trouble or owe money, so you pay or hand over details fast.",
    example:
      "A retiree in Singapore got a call from a 'government officer' who said her identity was used in a money-laundering case. To 'clear her name' she was told to move her savings to a 'safe account'. She transferred tens of thousands before her son realised the agency does not work this way.",
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
      "A mother received a WhatsApp from a number she did not recognise: 'Mum, I dropped my phone, this is my new number.' Soon after, 'her son' said he could not pay a supplier and asked her to transfer the money for him. The real son was at work the whole time and knew nothing about it.",
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
      "A bank customer in Singapore got an SMS saying her account was locked and she must 'verify' through a link. The page looked exactly like her bank. After she keyed in her login and OTP, money was drawn from her account within minutes.",
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
      "A man in Singapore joined a chat group promising daily returns from an investment platform. Early small 'profits' let him withdraw a little, which built his trust. When he put in his savings, the platform asked for more 'tax' and 'fees' to release the money, then vanished.",
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

  // ── B2: Urgency pressure ─────────────────────────────────────────────────────
  B2: {
    whatItIs:
      "The scammer manufactures panic: a short deadline, a frozen account, a fine, so you act before you have time to think or check.",
    example:
      "An elderly man was told his bank account would be frozen in ten minutes unless he 'reconfirmed' his details right away. The rush stopped him from pausing to call his bank. Only later did he learn a real bank would never give a ten-minute ultimatum.",
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

  // ── B8: Secrecy signal ───────────────────────────────────────────────────────
  B8: {
    whatItIs:
      "The scammer tells you to keep it secret, so no one you trust can talk you out of it before you send money.",
    example:
      "A woman in Singapore was told her case was 'confidential' and that telling her family would 'obstruct an investigation'. Cut off from advice, she made several transfers. When she finally told her daughter, the daughter recognised the pattern at once.",
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

  // ── A4: Fake police ──────────────────────────────────────────────────────────
  A4: {
    whatItIs:
      "A caller claims to be the police and says your account is linked to crime, then pressures you to 'safeguard' your money by transferring it to them.",
    example:
      "A senior in Singapore was video-called by a 'police officer' in uniform who showed an official-looking warrant on screen. Frightened, she followed instructions and moved her savings to 'safeguard' them. Real officers never make such demands or ask for transfers.",
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

  // ── DR: ADD protections (a habit that prevents loss) ─────────────────────────
  DR: {
    whatItIs:
      "Not a scam itself, but the protective habit of adding layers (ScamShield, 2FA, Money Lock) so that even a convincing scammer cannot move your money.",
    example:
      "A customer in Singapore had set up Money Lock on part of her savings. When she was later tricked into trying a transfer, the locked funds simply could not be moved on the spot, which bought time to realise it was a scam and stop.",
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
      "An uncle in Singapore got a suspicious 'parcel held by customs' message. Instead of paying the 'fee', he called 1799 to check. The helpline confirmed it was a known scam, and he lost nothing.",
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
      "After almost falling for a phone scam, a resident in Singapore told her neighbours and reported it. Days later a neighbour got the same call, recognised it from her warning, and hung up safely.",
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
 * Resolve the case study for a lesson's tiles. A Pung is one base; a Chi run
 * brackets several, so pick the first base that has a case study, mirroring the
 * dnaBase selection in lib/education.ts.
 */
export function getScamCase(bases: string[]): ScamCase | null {
  const hit = bases.find((b) => CASE_STUDIES[b.split(":")[0]]);
  return hit ? CASE_STUDIES[hit.split(":")[0]] : null;
}

/** The base id behind a lesson's case study, so callers can also look up TILE_DATA. */
export function getScamCaseBase(bases: string[]): string | null {
  const hit = bases.find((b) => CASE_STUDIES[b.split(":")[0]]);
  return hit ? hit.split(":")[0] : null;
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

// Maps each tile base id to a Lucide icon that depicts its scam meaning.
// Rendered in the suit colour; the colour (not a hanzi label) signals the suit.
import {
  ShieldCheck, IdCard, MessageCircleQuestion, BadgeAlert, PhoneForwarded, UserRoundX, ShieldBan, CircleDollarSign, TriangleAlert,
  Lightbulb, AlarmClock, MoonStar, Ticket, Ban, HeartCrack, Handshake, EyeOff, Megaphone,
  Landmark, MailWarning, Gem, Ghost, ShieldPlus, BadgeCheck, RadioTower,
  type LucideIcon,
} from "lucide-react";

export const TILE_ICONS: Record<string, LucideIcon> = {
  // Circles 筒 — impersonation & investment
  A1: ShieldCheck,            // Guard Info
  A2: IdCard,                 // NRIC?
  A3: MessageCircleQuestion,  // Why?
  A4: BadgeAlert,             // Fake Cop
  A5: PhoneForwarded,         // Call Back
  A6: UserRoundX,             // Unknown
  A7: ShieldBan,              // Block
  A8: CircleDollarSign,       // Sure Win?
  A9: TriangleAlert,          // Not Real
  // Bamboo 條 — urgency, romance & isolation
  B1: Lightbulb,              // Gut
  B2: AlarmClock,             // Hurry!
  B3: MoonStar,               // Wait
  B4: Ticket,                 // "Win" (fake lottery)
  B5: Ban,                    // No Entry
  B6: HeartCrack,             // Fake Love
  B7: Handshake,              // Meet
  B8: EyeOff,                 // Secret?
  B9: Megaphone,              // Tell
  // Winds — scam archetypes
  WE: Landmark,               // Official
  WS: MailWarning,            // Phish
  WW: Gem,                    // Offer
  WN: Ghost,                  // Friend
  // Dragons — the ACT framework
  DR: ShieldPlus,             // ADD
  DG: BadgeCheck,             // CHECK
  DW: RadioTower,             // TELL
};

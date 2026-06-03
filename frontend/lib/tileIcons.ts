// Maps each tile base id to a Lucide icon that depicts its scam meaning.
// Rendered in the suit colour; the colour (not a hanzi label) signals the suit.
import {
  Lock, CreditCard, ShieldQuestion, Siren, PhoneCall, UserX, Ban, TrendingUp, Banknote,
  Lightbulb, AlarmClock, Moon, Trophy, CircleSlash, HeartCrack, Handshake, EyeOff, MessageSquareHeart,
  Landmark, Fish, Gift, Smartphone, ShieldPlus, SearchCheck, Megaphone,
  type LucideIcon,
} from "lucide-react";

export const TILE_ICONS: Record<string, LucideIcon> = {
  // Circles 筒 — impersonation & investment
  A1: Lock, A2: CreditCard, A3: ShieldQuestion, A4: Siren, A5: PhoneCall, A6: UserX, A7: Ban, A8: TrendingUp, A9: Banknote,
  // Bamboo 條 — urgency, romance & isolation
  B1: Lightbulb, B2: AlarmClock, B3: Moon, B4: Trophy, B5: CircleSlash, B6: HeartCrack, B7: Handshake, B8: EyeOff, B9: MessageSquareHeart,
  // Winds — scam archetypes
  WE: Landmark, WS: Fish, WW: Gift, WN: Smartphone,
  // Dragons — the ACT framework
  DR: ShieldPlus, DG: SearchCheck, DW: Megaphone,
};

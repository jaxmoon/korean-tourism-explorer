import type { LucideIcon } from 'lucide-react';
import {
  Bed,
  Building,
  Image as ImageIcon,
  MapPin,
  PartyPopper,
  ShoppingBag,
  UtensilsCrossed,
} from 'lucide-react';

export type PlaceholderConfig = {
  id: string;
  icon: LucideIcon;
  title: string;
  gradient: string;
};

const PLACEHOLDERS: Record<string, PlaceholderConfig> = {
  '12': {
    id: 'tourist-spot',
    icon: MapPin,
    title: 'Scenic Attraction',
    gradient: 'from-blue-600 via-sky-500 to-cyan-400',
  },
  '14': {
    id: 'culture',
    icon: Building,
    title: 'Cultural Space',
    gradient: 'from-purple-600 via-fuchsia-500 to-pink-400',
  },
  '15': {
    id: 'festival',
    icon: PartyPopper,
    title: 'Festival Highlight',
    gradient: 'from-orange-500 via-amber-400 to-yellow-300',
  },
  '25': {
    id: 'travel-course',
    icon: MapPin,
    title: 'Travel Course',
    gradient: 'from-emerald-600 via-green-500 to-lime-400',
  },
  '28': {
    id: 'leisure',
    icon: PartyPopper,
    title: 'Leisure Adventure',
    gradient: 'from-rose-500 via-red-500 to-orange-400',
  },
  '32': {
    id: 'accommodation',
    icon: Bed,
    title: 'Comfort Stay',
    gradient: 'from-indigo-600 via-blue-500 to-sky-400',
  },
  '38': {
    id: 'shopping',
    icon: ShoppingBag,
    title: 'Shopping District',
    gradient: 'from-pink-500 via-rose-500 to-red-400',
  },
  '39': {
    id: 'food',
    icon: UtensilsCrossed,
    title: 'Taste Experience',
    gradient: 'from-teal-600 via-cyan-500 to-blue-400',
  },
  default: {
    id: 'default',
    icon: ImageIcon,
    title: 'Tourism Explorer',
    gradient: 'from-slate-600 via-gray-600 to-zinc-500',
  },
};

export function getPlaceholderImage(contentTypeId?: number) {
  const key = contentTypeId?.toString() ?? 'default';
  return PLACEHOLDERS[key] ?? PLACEHOLDERS.default;
}

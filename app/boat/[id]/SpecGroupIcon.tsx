import { Package, Sofa, History, Ship, Compass, Zap, ShieldCheck, Sailboat, type LucideIcon } from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'Additional Features': Package,
  'Comfort and Interior': Sofa,
  'Condition and History': History,
  'Hull and Structure': Ship,
  'Navigation and Electronics': Compass,
  'Power and Propulsion': Zap,
  'Safety Equipment': ShieldCheck,
  'Sails and Rigging': Sailboat
};

export function SpecGroupIcon({ title }: { title: string }) {
  const Icon = ICONS[title];
  if (!Icon) return null;
  return <Icon size={14} strokeWidth={2} />;
}

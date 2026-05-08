import {
  Utensils,
  Sparkles,
  Wrench,
  Scissors,
  Heart,
  GraduationCap,
  Laptop,
  Truck,
  Camera,
  PaintRoller,
  Hammer,
  Dumbbell,
  Briefcase,
  Dog,
  CircleCheck,
} from 'lucide-angular';

export interface IconOption {
  name: string;
  icon: any;
}

export const SERVICE_ICON_MAP: Record<string, any> = {
  sparkles: Sparkles,
  utensils: Utensils,
  wrench: Wrench,
  paintRoller: PaintRoller,
  hammer: Hammer,
  scissors: Scissors,
  heart: Heart,
  graduationCap: GraduationCap,
  laptop: Laptop,
  truck: Truck,
  camera: Camera,
  dumbbell: Dumbbell,
  dog: Dog,
  briefcase: Briefcase,
  circleCheck: CircleCheck,
};

export const AVAILABLE_ICONS: IconOption[] = [
  { name: 'sparkles', icon: Sparkles },
  { name: 'utensils', icon: Utensils },
  { name: 'wrench', icon: Wrench },
  { name: 'paintRoller', icon: PaintRoller },
  { name: 'hammer', icon: Hammer },
  { name: 'scissors', icon: Scissors },
  { name: 'heart', icon: Heart },
  { name: 'graduationCap', icon: GraduationCap },
  { name: 'laptop', icon: Laptop },
  { name: 'truck', icon: Truck },
  { name: 'camera', icon: Camera },
  { name: 'dumbbell', icon: Dumbbell },
  { name: 'dog', icon: Dog },
  { name: 'briefcase', icon: Briefcase },
  { name: 'circleCheck', icon: CircleCheck },
];

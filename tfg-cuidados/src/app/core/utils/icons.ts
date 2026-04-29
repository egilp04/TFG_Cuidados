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
} from 'lucide-angular';

export interface IconOption {
  name: string;
  icon: any;
  label: string;
}

export const SERVICE_ICON_MAP: Record<string, any> = {
  sparkles: Sparkles,
  utensils: Utensils,
  wrench: Wrench,
  'paint-roller': PaintRoller,
  hammer: Hammer,
  scissors: Scissors,
  heart: Heart,
  'graduation-cap': GraduationCap,
  laptop: Laptop,
  truck: Truck,
  camera: Camera,
  dumbbell: Dumbbell,
  dog: Dog,
  briefcase: Briefcase,
};

export const AVAILABLE_ICONS: IconOption[] = [
  { name: 'sparkles', icon: Sparkles, label: 'Limpieza general' },
  { name: 'utensils', icon: Utensils, label: 'Comida y Restauración' },
  { name: 'wrench', icon: Wrench, label: 'Reparaciones y Fontanería' },
  { name: 'paint-roller', icon: PaintRoller, label: 'Pintura y Reformas' },
  { name: 'hammer', icon: Hammer, label: 'Carpintería y Bricolaje' },
  { name: 'scissors', icon: Scissors, label: 'Peluquería y Estética' },
  { name: 'heart', icon: Heart, label: 'Cuidados y Salud' },
  { name: 'graduation-cap', icon: GraduationCap, label: 'Educación y Clases' },
  { name: 'laptop', icon: Laptop, label: 'Informática y Tecnología' },
  { name: 'truck', icon: Truck, label: 'Transporte y Mudanzas' },
  { name: 'camera', icon: Camera, label: 'Fotografía y Eventos' },
  { name: 'dumbbell', icon: Dumbbell, label: 'Deporte y Entrenamiento' },
  { name: 'dog', icon: Dog, label: 'Cuidado de Mascotas' },
  { name: 'briefcase', icon: Briefcase, label: 'Negocios y Asesoría' },
];

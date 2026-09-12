import { Category } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'pet-health',
    slug: 'pet-health',
    name: 'Pet Health',
    description: 'Comprehensive everyday health, wellness checkups, symptoms, and lifestyle care for companion dogs, cats, and small animals.',
    iconName: 'HeartPulse',
    featuredOrder: 1,
  },
  {
    id: 'veterinary-medicine',
    slug: 'veterinary-medicine',
    name: 'Veterinary Medicine',
    description: 'Clinical insights, diagnostic pathways, clinical pathology, surgical perspectives, and veterinary pharmacology.',
    iconName: 'Stethoscope',
    featuredOrder: 2,
  },
  {
    id: 'animal-nutrition',
    slug: 'animal-nutrition',
    name: 'Animal Nutrition',
    description: 'Evidence-based pet feeding science, guaranteed analysis evaluation, therapeutic diets, and clinical nutritional management.',
    iconName: 'Apple',
    featuredOrder: 3,
  },
  {
    id: 'preventive-care',
    slug: 'preventive-care',
    name: 'Preventive Care',
    description: 'Immunization protocols, parasite prevention, dental hygiene, screening diagnostics, and proactive longevity protocols.',
    iconName: 'ShieldCheck',
    featuredOrder: 4,
  },
  {
    id: 'emergency-critical-care',
    slug: 'emergency-critical-care',
    name: 'Emergency & Critical Care',
    description: 'Acute triage, urgent symptoms, toxicity identification, first aid interventions, and critical hospitalization protocols.',
    iconName: 'AlertCircle',
    featuredOrder: 5,
  },
  {
    id: 'one-health',
    slug: 'one-health',
    name: 'One Health',
    description: 'Interconnected health dynamics linking animals, humans, zoonotic pathogens, environmental vectors, and shared ecosystems.',
    iconName: 'Globe',
    featuredOrder: 6,
  },
  {
    id: 'animal-welfare',
    slug: 'animal-welfare',
    name: 'Animal Welfare',
    description: 'Humane stewardship, behavioral medicine, low-stress veterinary handling, enrichment science, and companion animal ethics.',
    iconName: 'Smile',
    featuredOrder: 7,
  },
  {
    id: 'livestock-large-animals',
    slug: 'livestock-large-animals',
    name: 'Livestock & Large Animals',
    description: 'Herd health, equine medicine, ruminant pathology, biosecurity protocols, and production animal veterinary science.',
    iconName: 'Activity',
    featuredOrder: 8,
  },
];

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

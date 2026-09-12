import { Tag } from '../types';

export const TAGS: Tag[] = [
  { id: 'dogs', slug: 'dogs', name: 'Dogs' },
  { id: 'cats', slug: 'cats', name: 'Cats' },
  { id: 'nutrition', slug: 'nutrition', name: 'Nutrition' },
  { id: 'vaccination', slug: 'vaccination', name: 'Vaccination' },
  { id: 'vomiting', slug: 'vomiting', name: 'Vomiting' },
  { id: 'diarrhea', slug: 'diarrhea', name: 'Diarrhea' },
  { id: 'emergency', slug: 'emergency', name: 'Emergency' },
  { id: 'preventive-care', slug: 'preventive-care', name: 'Preventive Care' },
  { id: 'one-health', slug: 'one-health', name: 'One Health' },
  { id: 'bloodwork', slug: 'bloodwork', name: 'Bloodwork & Labs' },
  { id: 'parvovirus', slug: 'parvovirus', name: 'Parvovirus' },
  { id: 'geriatric', slug: 'geriatric', name: 'Senior Pets' },
  { id: 'surgery', slug: 'surgery', name: 'Surgery' },
  { id: 'toxicology', slug: 'toxicology', name: 'Toxicology' },
];

export function getTagBySlug(slug: string): Tag | undefined {
  return TAGS.find((t) => t.slug === slug);
}

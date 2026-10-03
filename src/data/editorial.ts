import type { Author } from "../lib/domain";
export const categories = [
  [
    "pet-health",
    "Pet Health",
    "Understand symptoms. Make informed care decisions.",
  ],
  [
    "veterinary-medicine",
    "Veterinary Medicine",
    "Diagnostics, pathology and clinical practice.",
  ],
  [
    "animal-nutrition",
    "Animal Nutrition",
    "Feeding decisions grounded in nutritional science.",
  ],
  [
    "preventive-care",
    "Preventive Care",
    "Small habits. A lifetime of better care.",
  ],
  [
    "emergency-critical-care",
    "Emergency & Critical Care",
    "Recognise urgency and get veterinary help.",
  ],
  [
    "one-health",
    "One Health",
    "The shared health of people, animals and ecosystems.",
  ],
  [
    "animal-welfare",
    "Animal Welfare",
    "Behaviour, comfort and compassionate handling.",
  ],
  [
    "livestock-large-animals",
    "Livestock & Large Animals",
    "Practical evidence for healthy herds.",
  ],
].map(([id, name, description]) => ({ id, name, description }));
export const authors: Author[] = [
  {
    id: "dr-chirag-patidar",
    name: "Dr. Chirag Patidar",
    role: "Digital Creator & Partnerships Lead",
    bio: "Focuses on preventive pet care, community outreach and clear digital veterinary education.",
    expertise: ["Preventive pet care", "Community education"],
  },
  {
    id: "dr-amaan-ahmed",
    name: "Dr. Amaan Ahmed",
    role: "Wildlife Veterinarian & Research Analyst",
    bio: "Focuses on wildlife conservation medicine, research methodology, zoonoses and One Health.",
    expertise: ["Wildlife medicine", "One Health"],
  },
  {
    id: "dr-shivam-singh-thakur",
    name: "Dr. Shivam Singh Thakur",
    role: "Veterinary Content Specialist",
    bio: "Translates companion animal clinical literature, nutrition science and preventive protocols for readers.",
    expertise: ["Companion animal health", "Nutrition"],
  },
  {
    id: "dr-ritesh-verma",
    name: "Dr. Ritesh Verma",
    role: "Lead Pathologist & Clinical Director",
    bio: "Focuses on clinical pathology, diagnostic interpretation, infectious diseases and editorial review standards.",
    expertise: ["Clinical pathology", "Diagnostics"],
  },
  {
    id: "dr-deepesh-mathur",
    name: "Dr. Deepesh Mathur",
    role: "Large Animal Field Veterinarian",
    bio: "Focuses on herd health, epidemiology, livestock medicine and rural veterinary practice.",
    expertise: ["Herd health", "Livestock medicine"],
  },
  {
    id: "dr-deepesh-chaware",
    name: "Dr. Deepesh Chaware",
    role: "Small Animal Surgeon & Consultant",
    bio: "Focuses on soft tissue surgery, orthopaedic consultation, surgical case management and postoperative care.",
    expertise: ["Small animal surgery", "Postoperative care"],
  },
].map((a) => ({
  ...a,
  qualifications: "BVSc & AH",
  affiliation: "ThatVetGuy Veterinary Collaborative",
  image: "",
  linkedin: "",
}));
export const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.name || "Veterinary Medicine";
export const disclaimer =
  "This publication supports education. It does not replace an examination, diagnosis or treatment plan from your veterinarian. For urgent symptoms, contact a veterinary hospital immediately.";

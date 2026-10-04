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
// Editorial summaries of the main-site profiles; see docs/RESEARCH.md.
export const authors: Author[] = [
  {
    id: "dr-chirag-patidar",
    name: "Dr. Chirag Patidar",
    qualifications: "BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Veterinarian & Digital Creator",
    bio: "Dr. Chirag Patidar combines veterinary practice, scientific writing and digital production. His work translates clinical topics into accessible education for pet parents and professional collaborators, with a focus on clear clinical communication and responsible veterinary storytelling.",
    expertise: [
      "Scientific writing",
      "Clinical communication",
      "Digital veterinary education",
    ],
    image: "https://www.thatvetguy.net/chirag.png",
    linkedin: "https://www.linkedin.com/in/drchiragpatidarconnect",
    portfolio: "https://www.thatvetguy.net/chirag",
  },
  {
    id: "dr-amaan-ahmed",
    name: "Dr. Amaan Ahmed",
    qualifications: "BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Wildlife Veterinarian & Researcher",
    bio: "Dr. Amaan Ahmed is a BVSc & AH graduate of the College of Veterinary Science & Animal Husbandry, Mhow. His published profile describes training in wildlife rehabilitation, equine care, avian biosecurity, diagnostic pathology and emergency practice. He brings a One Health perspective to animal welfare and veterinary education.",
    expertise: ["Wildlife rehabilitation", "One Health", "Clinical research"],
    image: "https://www.thatvetguy.net/amaan.png",
    linkedin: "https://www.linkedin.com/in/amaan-ahmed-a80696388",
    portfolio: "https://www.thatvetguy.net/amaan",
  },
  {
    id: "dr-shivam-singh-thakur",
    name: "Dr. Shivam Singh Thakur",
    qualifications: "BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Veterinary Writer & Livestock Specialist",
    bio: "Dr. Shivam Singh Thakur works in veterinary writing, livestock food safety and educational communication. His main-site biography describes postgraduate study in Livestock Products Technology and an interest in animal-origin foods, dairy management and sustainable agricultural systems.",
    expertise: [
      "Livestock products technology",
      "Food safety",
      "Veterinary writing",
    ],
    image: "https://www.thatvetguy.net/shivam.png",
    linkedin: "https://www.linkedin.com/in/dr-shivam-singh-thakur",
    portfolio: "https://www.thatvetguy.net/Shivam",
  },
  {
    id: "dr-ritesh-verma",
    name: "Dr. Ritesh Verma",
    qualifications: "MVSc (Veterinary Pathology), BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Veterinary Pathologist & Diagnostician",
    bio: "Dr. Ritesh Verma specialises in diagnostic reviews, avian pathology, protozoan diagnostics and feline pathobiology. His published portfolio includes pathological research and public-health writing. His educational work connects laboratory findings with clinical context and accessible disease awareness.",
    expertise: [
      "Clinical pathology",
      "Avian pathology",
      "Diagnostic interpretation",
    ],
    image: "https://www.thatvetguy.net/ritesh.png",
    linkedin: "https://www.linkedin.com/in/ritesh-verma-veterinarian613499176",
    portfolio: "https://www.thatvetguy.net/ritesh",
  },
  {
    id: "dr-deepesh-mathur",
    name: "Dr. Deepesh Mathur",
    qualifications: "BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Large Animal Veterinarian",
    bio: "Dr. Deepesh Mathur holds a BVSc & AH from NDVSU, Mhow. His published biography describes clinical work with the Mobile Veterinary Unit in Madhya Pradesh and training in poultry, goat and dairy management. He focuses on practical herd-health education and veterinary care in rural settings.",
    expertise: [
      "Herd health",
      "Mobile veterinary practice",
      "Dairy and small-ruminant care",
    ],
    image: "https://www.thatvetguy.net/deepesh-m.png",
    linkedin: "https://www.linkedin.com/in/dr-deepesh-mathur",
    portfolio: "https://www.thatvetguy.net/deepesh-m",
  },
  {
    id: "dr-deepesh-chaware",
    name: "Dr. Deepesh Chaware",
    qualifications: "BVSc & AH",
    affiliation: "ThatVetGuy Collective",
    role: "Small Animal Surgeon & Clinician",
    bio: "Dr. Deepesh Chaware works in small-animal clinical practice, soft-tissue surgery and diagnostic imaging. His published profile describes Animal Birth Control programmes, ultrasonography, echocardiography and preventive-care outreach. He focuses on clear surgical and postoperative guidance for animal carers.",
    expertise: [
      "Small animal surgery",
      "Diagnostic imaging",
      "Postoperative care",
    ],
    image: "https://www.thatvetguy.net/deepesh-c.png",
    linkedin: "https://www.linkedin.com/in/dr-deepesh-chaware-5710aa2b7",
    portfolio: "https://www.thatvetguy.net/deepesh-c",
  },
];
export const categoryName = (id: string) =>
  categories.find((c) => c.id === id)?.name || "Veterinary Medicine";
export const disclaimer =
  "This publication supports education. It does not replace an examination, diagnosis or treatment plan from your veterinarian. For urgent symptoms, contact a veterinary hospital immediately.";

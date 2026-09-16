import { Article } from '../types';

export const ARTICLES: Article[] = [
  {
    id: 'understanding-vomiting-in-dogs',
    slug: 'understanding-vomiting-in-dogs',
    title: 'One Symptom. Many Possibilities: Understanding Vomiting in Dogs',
    subtitle: 'From dietary indiscretion to gastrointestinal obstruction and pancreatitis: A clinical veterinary framework for pet parents.',
    excerpt: 'Vomiting is one of the most common presentations in veterinary emergency and general practice. Distinguishing self-limiting gastritis from surgical obstruction requires understanding clinical red flags, hydration status, and diagnostic pathways.',
    featuredImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Golden retriever looking calm during a veterinary consultation',
    imageCaption: 'Clinical examination of the canine abdomen is the cornerstone of differentiating acute from surgical vomiting.',
    category: 'pet-health',
    tags: ['dogs', 'vomiting', 'emergency', 'preventive-care'],
    authorId: 'dr-chirag-patidar',
    reviewerId: 'dr-deepesh-chaware',
    reviewedDate: '2026-08-14',
    publishedDate: '2026-08-10',
    updatedDate: '2026-08-15',
    readingTimeMinutes: 7,
    isDemo: true,
    isFeatured: true,
    isPopular: true,
    seoTitle: 'Understanding Vomiting in Dogs | Causes, Red Flags & Veterinary Guidance',
    seoDescription: 'Learn why dogs vomit, how vets differentiate regurgitation from vomiting, critical red flags, and when immediate emergency intervention is essential.',
    references: [
      {
        id: 'ref-1',
        citation: 'Washabau, R. J., & Day, M. J. (2013). Canine and Feline Gastroenterology. Elsevier Health Sciences.',
        source: 'Elsevier Clinical Reference',
        year: 2013,
      },
      {
        id: 'ref-2',
        citation: 'Simpson, K. W. (2020). Acute Abdomen and Vomiting in Companion Animals. Journal of Veterinary Emergency and Critical Care, 30(2), 145-158.',
        source: 'Journal of Veterinary Emergency and Critical Care',
        year: 2020,
        doi: '10.1111/vec.12948',
      },
      {
        id: 'ref-3',
        citation: 'Merck Veterinary Manual (11th ed.). Acute Gastritis and Enteritis in Small Animals. Merck Sharp & Dohme Corp.',
        source: 'Merck Veterinary Manual',
        year: 2022,
        url: 'https://www.merckvetmanual.com',
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• Vomiting involves active abdominal contractions and retching, whereas regurgitation is passive esophageal expulsion.\n• A single episode in an otherwise bright, energetic dog may simply require temporary gut rest and observation.\n• Red flags demanding immediate veterinary hospital visit: unproductive retching, distended abdomen, blood in vomitus (hematemesis), lethargy, or known foreign body ingestion.\n• Never administer human antiemetics, paracetamol, or ibuprofen to pets without direct prescription.',
      },
      {
        type: 'paragraph',
        content: 'In both daytime veterinary clinics and overnight emergency facilities, few symptoms arrive with greater frequency—or greater diagnostic diversity—than canine vomiting. For pet parents, cleaning up an unexpected puddle on the living room rug brings an immediate surge of anxiety: Is this simply the grass they grazed on during their morning walk, or an early warning of life-threatening gastric dilatation-volvulus (GDV)?',
      },
      {
        type: 'paragraph',
        content: 'To navigate this spectrum safely, we as veterinary clinicians employ a systematic triage hierarchy. Understanding how your veterinarian thinks about vomiting helps you communicate crucial historical clues that can streamline diagnosis and accelerate relief for your pet.',
      },
      {
        type: 'heading2',
        content: 'Step One: True Vomiting vs. Regurgitation',
      },
      {
        type: 'paragraph',
        content: 'Before exploring underlying etiologies, a fundamental anatomical distinction must be established: Is the patient truly vomiting, or are they regurgitating? While caregivers frequently use the terms interchangeably, their physiological pathways and clinical implications are entirely distinct.',
      },
      {
        type: 'table',
        tableData: {
          headers: ['Clinical Feature', 'True Vomiting', 'Regurgitation'],
          rows: [
            ['Mechanism', 'Active, coordinated reflex involving abdominal heave', 'Passive expulsion without abdominal effort'],
            ['Prodromal Signs', 'Nausea signs: lip licking, drooling, restlessness', 'None; occurs suddenly, often right after eating'],
            ['Material Characteristics', 'Partially digested food, yellow bile, acidic pH', 'Undigested tubular food bolus, alkaline/neutral mucus'],
            ['Primary Organ System', 'Stomach, duodenum, or systemic organs (kidneys, liver)', 'Esophagus (megaesophagus, foreign body, stricture)'],
          ],
        },
      },
      {
        type: 'heading2',
        content: 'The Spectrum of Etiologies: From Benign to Urgent',
      },
      {
        type: 'paragraph',
        content: 'Once true vomiting is confirmed, veterinary medicine categorizes causes into gastrointestinal (primary gut disorders) and extra-gastrointestinal (systemic diseases affecting the gut secondary to metabolic or toxic disturbances).',
      },
      {
        type: 'callout',
        calloutType: 'clinical-alert',
        content: 'CRITICAL TRIAGE ALERT: Unproductive retching (the dog attempts to vomit repeatedly but produces only white froth or nothing) paired with a tight, distended abdomen is a hallmark medical emergency for Gastric Dilatation-Volvulus (GDV / "Bloat"). Do not wait—proceed directly to the nearest emergency veterinary hospital.',
      },
      {
        type: 'heading3',
        content: 'Primary Gastrointestinal Causes',
      },
      {
        type: 'paragraph',
        content: '1. Dietary Indiscretion ("Garbage Gut"): Ingestion of spoiled food, fatty table scraps, compost, or foreign materials causing acute gastric irritation.\n2. Foreign Body Obstruction: Toys, socks, peach pits, corn cobs, or bone fragments lodged in the pylorus or small intestine.\n3. Infectious Agents: Viral (canine parvovirus, coronavirus), bacterial (Salmonella, Campylobacter), or parasitic infections (Giardia, roundworms).\n4. Inflammatory Bowel Disease (IBD): Chronic intestinal inflammation requiring structured ultrasound and biopsy diagnostics.',
      },
      {
        type: 'heading3',
        content: 'Systemic & Metabolic Causes',
      },
      {
        type: 'paragraph',
        content: 'The stomach does not exist in isolation. Many organs filter toxins or regulate hormones whose dysregulation immediately triggers the brain’s chemoreceptor trigger zone (CRTZ):\n• Acute Pancreatitis: High-fat meals triggering premature enzymatic autodigestion of pancreatic tissue.\n• Renal Failure (Uremia): Inability of kidneys to excrete nitrogenous waste products, irritating the stomach lining.\n• Hepatic Disease: Impaired toxin metabolism causing secondary gastrointestinal distress.\n• Hypoadrenocorticism (Addison’s Disease): The "great imitator", presenting with intermittent gastrointestinal upset and electrolyte collapse.',
      },
      {
        type: 'quote',
        content: 'Accurate veterinary diagnosis is never about stopping the vomit with a quick pill; it is about respecting the symptom as a physiological alarm bell until the underlying engine is identified.',
        quoteAuthor: 'Dr. Chirag Patidar & Dr. Amaan Ahmed',
      },
      {
        type: 'heading2',
        content: 'When to Seek Urgent Veterinary Care vs. Monitor',
      },
      {
        type: 'paragraph',
        content: 'If your adult dog has vomited once, appears bright and alert, is wagging their tail, and has no abdominal pain, a brief period of veterinary-approved gut rest (withholding food for 4 to 6 hours while offering small sips of water) may be reasonable. However, immediate clinical evaluation is non-negotiable under the following circumstances:',
      },
      {
        type: 'takeaways',
        content: 'Veterinary Red Flags:\n1. Puppies under 6 months of age (rapid dehydration risk and high parvovirus susceptibility).\n2. Vomiting persisting for more than 12-24 hours.\n3. Presence of blood: frank red blood (hematemesis) or dark "coffee ground" digested blood.\n4. Accompanying watery diarrhea, especially with a foul odor or black tarry stools (melena).\n5. Profound lethargy, weakness, pale or tacky gums, or inability to stand.',
      },
      {
        type: 'paragraph',
        content: 'When you arrive at the clinic, be prepared to describe the frequency, color, timing in relation to meals, and potential access to toxins or chew items. That accurate history remains one of the most potent diagnostic tools in veterinary medicine.',
      },
    ],
  },
  {
    id: 'understanding-pet-food-labels',
    slug: 'understanding-pet-food-labels',
    title: "Your Pet's Food Label Is Telling You a Story—But Are You Reading It?",
    subtitle: 'Cutting through marketing jargon, understanding AAFCO adequacy statements, and calculating Dry Matter basis for canine and feline nutrition.',
    excerpt: 'Commercial pet food bags are masterpieces of human-targeted advertising. Learn how veterinarians evaluate guaranteed analysis panels, ingredient split tactics, and the nutritional adequacy statement.',
    featuredImage: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Healthy dog food ingredients arranged neatly with natural whole foods',
    imageCaption: 'Marketing on the front panel appeals to human grocery preferences; scientific truth lives on the back panel guaranteed analysis.',
    category: 'animal-nutrition',
    tags: ['nutrition', 'dogs', 'cats', 'preventive-care'],
    authorId: 'dr-shivam-singh-thakur',
    reviewerId: 'dr-deepesh-mathur',
    reviewedDate: '2026-08-20',
    publishedDate: '2026-08-18',
    updatedDate: '2026-08-22',
    readingTimeMinutes: 8,
    isDemo: true,
    isPopular: true,
    seoTitle: 'How to Read Pet Food Labels | Veterinary Nutrition Guide',
    seoDescription: 'A clinical veterinary breakdown of pet food labels. Learn AAFCO standards, guaranteed analysis calculations, and how to spot marketing gimmicks.',
    references: [
      {
        id: 'ref-nutr-1',
        citation: 'World Small Animal Veterinary Association (WSAVA) Global Nutrition Committee. (2021). Guidelines on Selecting Pet Foods.',
        source: 'WSAVA Global Guidelines',
        year: 2021,
        url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/',
      },
      {
        id: 'ref-nutr-2',
        citation: 'Association of American Feed Control Officials (AAFCO). (2023). Official Publication: Model Pet Food and Specialty Pet Food Regulations.',
        source: 'AAFCO Official Standards',
        year: 2023,
      },
      {
        id: 'ref-nutr-3',
        citation: 'Freeman, L. M., et al. (2013). Current knowledge about the risks and benefits of raw meat–based diets for dogs and cats. JAVMA, 243(11), 1549-1558.',
        source: 'Journal of the American Veterinary Medical Association',
        year: 2013,
        doi: '10.2460/javma.243.11.1549',
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• The front of the bag is designed to persuade human shoppers; the back panel is strictly regulated by nutritional bodies.\n• The single most crucial line on any pet food bag is the Nutritional Adequacy Statement (AAFCO or FEDIAF equivalent).\n• "Crude protein" on the guaranteed analysis indicates nitrogen content, not the biological bioavailability of the amino acids.\n• Dry matter calculation is essential when comparing canned food (75-80% moisture) to dry kibble (10% moisture).',
      },
      {
        type: 'paragraph',
        content: 'Walk down the pet food aisle of any modern supermarket or pet retailer, and you will be surrounded by rustic imagery: wood-fired roasted venison, farm-fresh wild blueberries, organic heritage carrots, and bold claims of "ancestral biological purity." As veterinarians, we celebrate pet parents who invest thoughtful attention into what fills their companion’s bowl. However, there is a stark divide between human psychological marketing and veterinary clinical nutrition.',
      },
      {
        type: 'paragraph',
        content: 'In this guide, we will strip away the front-of-package marketing and teach you to evaluate pet food with the exact rigorous lens veterinary nutritionists apply.',
      },
      {
        type: 'heading2',
        content: 'Rule #1: The Nutritional Adequacy Statement',
      },
      {
        type: 'paragraph',
        content: 'Before glancing at ingredients or colorful photos, turn the package over and hunt for the small-print text known as the Nutritional Adequacy Statement. This sentence determines whether the product is a complete daily diet or merely an occasional treat.',
      },
      {
        type: 'callout',
        calloutType: 'note',
        content: 'Look for one of these two phrases: \n1. Formulated to meet the nutritional levels established by the AAFCO (or FEDIAF) Dog/Cat Food Nutrient Profiles for [growth / maintenance / all life stages].\n2. Animal feeding tests using AAFCO procedures substantiate that [Brand] provides complete and balanced nutrition. (Feeding trials represent the gold standard in nutritional confirmation).',
      },
      {
        type: 'paragraph',
        content: 'If the bag instead reads "For intermittent or supplemental feeding only," it is NOT nutritionally balanced for daily feeding and will lead to severe micronutrient deficiencies if fed as a sole diet.',
      },
      {
        type: 'heading2',
        content: 'The Dry Matter Conversion: Comparing Apples to Oranges',
      },
      {
        type: 'paragraph',
        content: 'A frequent point of confusion is comparing canned wet food to dry kibble. A wet food label might display "10% Crude Protein," while a kibble reads "28% Crude Protein." Does this mean the kibble offers nearly three times the protein? Not necessarily.',
      },
      {
        type: 'table',
        tableData: {
          headers: ['Metric', 'Canned Wet Food', 'Dry Kibble Food'],
          rows: [
            ['Moisture on Label', '78%', '10%'],
            ['Dry Matter Remaining', '22% (100 - 78)', '90% (100 - 10)'],
            ['As-Fed Protein on Label', '10%', '28%'],
            ['True Dry Matter Protein', '45.4% (10 / 0.22)', '31.1% (28 / 0.90)'],
          ],
        },
      },
      {
        type: 'paragraph',
        content: 'As demonstrated above, once moisture is mathematically accounted for, the canned food actually delivers 45.4% dry matter protein compared to 31.1% in the kibble. Whenever comparing distinct dietary formats, converting to Dry Matter Basis is clinically essential.',
      },
      {
        type: 'heading2',
        content: 'Ingredient Splitting: The Manufacturer’s Word Game',
      },
      {
        type: 'paragraph',
        content: 'Regulations dictate that ingredients must be listed by weight prior to processing. Because whole fresh deboned chicken contains approximately 70% water, it is very heavy. When that water evaporates during the high-temperature extrusion of kibble manufacturing, the true proportion of meat protein decreases dramatically.',
      },
      {
        type: 'paragraph',
        content: 'Furthermore, manufacturers may split a carbohydrate into multiple names—for example, listing "peas, pea flour, and pea starch" separately. Individually, each component weighs less than the chicken, keeping chicken at #1 on the list. Combined, however, peas may constitute the predominant ingredient in the bag.',
      },
      {
        type: 'quote',
        content: 'Pets require specific, bioavailable nutrients—amino acids, essential fatty acids, vitamins, and minerals—not specific romanticized buzzwords on an ingredient list.',
        quoteAuthor: 'Dr. Shivam Singh Thakur, Veterinary Content Specialist',
      },
      {
        type: 'heading2',
        content: 'Key Veterinary Questions to Ask Pet Food Brands (WSAVA Criteria)',
      },
      {
        type: 'paragraph',
        content: 'The World Small Animal Veterinary Association recommends evaluating the company behind the food rather than merely the label printing:\n• Does the company employ a full-time, qualified veterinary nutritionist (PhD in animal nutrition or DACVIM board certification)?\n• Are recipes tested via standardized feeding trials, or only formulated via computer spreadsheets?\n• Where is the food produced—in company-owned facilities with rigorous batch testing, or outsourced to third-party co-packers?\n• Can the brand provide complete nutrient profiles for specific parameters (sodium, phosphorus, calcium-to-phosphorus ratios)?',
      },
    ],
  },
  {
    id: 'understanding-cbc-values-dogs-cats',
    slug: 'understanding-cbc-values-dogs-cats',
    title: 'Understanding CBC Values in Dogs and Cats',
    subtitle: 'Demystifying the Complete Blood Count: What your veterinarian looks for in red cells, white cells, and platelets.',
    excerpt: 'When your vet runs bloodwork, the CBC is the foundational baseline. Learn how veterinarians interpret hematocrit, leukograms, band neutrophils, and platelet indices to detect hidden illness.',
    featuredImage: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Laboratory hematology analyzer with veterinary blood tubes and microscope',
    imageCaption: 'Automated blood analyzers coupled with manual peripheral blood smear evaluation provide deep insight into systemic health.',
    category: 'veterinary-medicine',
    tags: ['bloodwork', 'veterinary-medicine', 'dogs', 'cats'],
    authorId: 'dr-ritesh-verma',
    reviewerId: 'dr-amaan-ahmed',
    reviewedDate: '2026-08-25',
    publishedDate: '2026-08-24',
    updatedDate: '2026-08-26',
    readingTimeMinutes: 9,
    isDemo: true,
    isPopular: true,
    seoTitle: 'Complete Blood Count (CBC) in Pets Explained | Veterinary Medicine',
    seoDescription: 'A clinical veterinary breakdown of CBC blood tests in dogs and cats. Understand RBCs, WBCs, platelets, anemia, and what elevated values signify.',
    references: [
      {
        id: 'ref-cbc-1',
        citation: 'Stockham, S. L., & Scott, M. A. (2013). Fundamentals of Veterinary Clinical Pathology (2nd ed.). Wiley-Blackwell.',
        source: 'Veterinary Clinical Pathology',
        year: 2013,
      },
      {
        id: 'ref-cbc-2',
        citation: 'Weiser, G. (2012). Laboratory Technology for Veterinary Medicine. In Schalm’s Veterinary Hematology (6th ed.).',
        source: 'Schalm’s Veterinary Hematology',
        year: 2012,
      },
      {
        id: 'ref-cbc-3',
        citation: 'Thrall, M. A., et al. (2022). Veterinary Hematology, Clinical Chemistry, and Cytology (3rd ed.). Wiley.',
        source: 'Clinical Diagnostic Manual',
        year: 2022,
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• A Complete Blood Count (CBC) examines three cellular lines: Erythrocytes (RBCs), Leukocytes (WBCs), and Thrombocytes (Platelets).\n• Hematocrit (HCT) or Packed Cell Volume (PCV) measures the percentage of blood composed of oxygen-carrying red blood cells.\n• An elevated white count does not automatically indicate bacterial infection; inflammation, severe stress, or steroid surges can cause leukocytosis.\n• Always evaluate blood numbers in tandem with the physical patient—never treat the laboratory paper in isolation.',
      },
      {
        type: 'paragraph',
        content: 'Few diagnostic tools in modern veterinary medicine offer as much diagnostic yield from just two milliliters of blood as the Complete Blood Count (CBC). Whether your veterinarian recommends routine pre-anesthetic screening before a dental scaling, an annual geriatric profile, or an urgent workup for a febrile cat, the CBC is the clinical baseline.',
      },
      {
        type: 'paragraph',
        content: 'When the clinic hands you a two-page printout populated by cryptic abbreviations—HCT, MCV, MCHC, Segs, Bands, Plt—it can feel overwhelming. Let us walk step-by-step through how clinical veterinarians read these results.',
      },
      {
        type: 'heading2',
        content: '1. The Erythron: Red Blood Cells (RBCs) & Oxygen Delivery',
      },
      {
        type: 'paragraph',
        content: 'Erythrocytes transport oxygen from the lungs to peripheral tissues and return carbon dioxide. When reviewing the red blood cell line, veterinarians look for three core parameters:',
      },
      {
        type: 'table',
        tableData: {
          headers: ['Parameter', 'Canine Reference Range', 'Feline Reference Range', 'Clinical Significance'],
          rows: [
            ['Hematocrit (HCT / PCV)', '37% – 55%', '30% – 45%', 'Low indicates anemia (blood loss, hemolysis, bone marrow depression). High indicates dehydration or polycythemia.'],
            ['Hemoglobin (Hgb)', '12.0 – 18.0 g/dL', '9.8 – 15.4 g/dL', 'The iron-rich protein carrying oxygen; roughly mirrors 1/3 of the HCT.'],
            ['MCV (Mean Corpuscular Volume)', '60 – 77 fL', '39 – 55 fL', 'Average cell size. High MCV indicates young regenerative cells (macrocytosis); low MCV points to iron deficiency (microcytosis).'],
            ['Reticulocytes', '< 60,000 / µL', '< 40,000 / µL', 'Immature RBCs released by the bone marrow. High counts prove the marrow is actively responding to anemia.'],
          ],
        },
      },
      {
        type: 'heading2',
        content: '2. The Leukogram: White Blood Cells (WBCs) as Immune Defenders',
      },
      {
        type: 'paragraph',
        content: 'White blood cells represent the defense battalions of the bloodstream. Total leukocyte counts provide a summary, but the true diagnostic story lies within the differential breakdown:',
      },
      {
        type: 'paragraph',
        content: '• Neutrophils (Segmented): The first responders against bacterial infection and acute tissue damage. A surge is called neutrophilia.\n• Band Neutrophils ("Left Shift"): Immature neutrophils released from the bone marrow reserve before full maturation. A pronounced left shift indicates the body is consuming white blood cells faster than it can mature them—a sign of severe active infection or sepsis.\n• Lymphocytes: Key players in viral immunity and antibody production. Lymphopenia (low counts) is extremely common during systemic stress (the classic "stress leukogram" induced by endogenous cortisol).\n• Eosinophils: Associated with parasitic migrations (fleas, intestinal worms, heartworm) and allergic hypersensitivity reactions.\n• Monocytes: Scavenger macrophages that clear cellular debris in chronic inflammatory states.',
      },
      {
        type: 'callout',
        calloutType: 'clinical-alert',
        content: 'VETERINARY INSIGHT: An elevated white blood cell count does not automatically justify antibiotics. Inflammation, acute tissue trauma, pancreatitis, and profound emotional stress all elevate WBCs. Indiscriminate antibiotic usage without confirmed bacterial etiology drives global antimicrobial resistance.',
      },
      {
        type: 'heading2',
        content: '3. Thrombocytes: Platelets and Clotting Competence',
      },
      {
        type: 'paragraph',
        content: 'Platelets are tiny cell fragments indispensable for primary hemostasis. If a pet sustains an injury or has a bleeding vessel, platelets adhere to the damaged endothelium to form a temporary plug.',
      },
      {
        type: 'paragraph',
        content: 'A normal canine or feline platelet count ranges from 175,000 to 500,000 / µL. When counts drop below 30,000 to 50,000 / µL (severe thrombocytopenia), spontaneous bleeding can emerge: petechiae (pinpoint hemorrhages on the gums or belly), nosebleeds (epistaxis), or bloody urine.',
      },
      {
        type: 'quote',
        content: 'A laboratory machine counts particles; a veterinary clinician interprets biology. In cats especially, platelet clumping inside sample tubes can fool analyzers into showing false low counts—which is why reviewing a manual blood smear under the microscope remains indispensable.',
        quoteAuthor: 'Dr. Amaan Ahmed, Internal Medicine',
      },
    ],
  },
  {
    id: 'canine-parvovirus-clinical-presentation',
    slug: 'canine-parvovirus-clinical-presentation',
    title: 'Canine Parvovirus: Early Warning Signs, Hospital Protocol, and Home Disinfection',
    subtitle: 'Understanding the enteric pathogen that threatens unvaccinated puppies, and how aggressive early fluid therapy saves lives.',
    excerpt: 'Canine parvovirus is a resilient, devastating enteric virus targeting rapidly dividing intestinal crypt cells and bone marrow. Discover the crucial early warning signs and evidence-based clinical protocols.',
    featuredImage: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Young puppy being safely examined by a veterinary clinician',
    imageCaption: 'Vaccination starting between 6 to 8 weeks remains the single most effective defense against canine parvovirus.',
    category: 'preventive-care',
    tags: ['parvovirus', 'vaccination', 'dogs', 'emergency'],
    authorId: 'dr-deepesh-chaware',
    reviewerId: 'dr-shivam-singh-thakur',
    reviewedDate: '2026-08-28',
    publishedDate: '2026-08-27',
    updatedDate: '2026-08-29',
    readingTimeMinutes: 7,
    isDemo: true,
    isFeatured: false,
    isPopular: true,
    seoTitle: 'Canine Parvovirus Guide | Symptoms, Treatment & Disinfection',
    seoDescription: 'Comprehensive veterinary guide on canine parvovirus: recognizing early lethargy, hospital treatment protocols, and bleach-based disinfection.',
    references: [
      {
        id: 'ref-parvo-1',
        citation: 'Prittie, J. (2004). Canine parvoviral enteritis: a review of diagnosis, management, and prognosis. Journal of Veterinary Emergency and Critical Care, 14(3), 167-176.',
        source: 'JVECC Clinical Review',
        year: 2004,
      },
      {
        id: 'ref-parvo-2',
        citation: 'Day, M. J., et al. (2016). WSAVA Guidelines for the Vaccination of Dogs and Cats. Journal of Small Animal Practice, 57(1), E1-E45.',
        source: 'WSAVA Vaccination Guidelines',
        year: 2016,
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• Parvovirus is highly contagious and environmentally stable, surviving for over 6 to 12 months in organic matter.\n• The earliest sign is often subtle lethargy and refusal to eat, preceding vomiting and foul-smelling hemorrhagic diarrhea.\n• With intensive inpatient veterinary care (IV fluids, antiemetics, broad-spectrum antibiotics, nutritional support), survival rates exceed 85-90%.\n• Standard household cleaners do NOT kill parvovirus; diluted sodium hypochlorite (household bleach at 1:32 dilution) or accelerated hydrogen peroxide is required.',
      },
      {
        type: 'paragraph',
        content: 'Few words strike dread into the hearts of puppy guardians and veterinary staff like "Parvo." Canine Parvovirus Type 2 (CPV-2) is a non-enveloped DNA virus known for two ruthless characteristics: an intense predilection for rapidly dividing cells (intestinal crypt epithelium and bone marrow hematopoietic cells), and an extraordinary resistance to environmental degradation.',
      },
      {
        type: 'heading2',
        content: 'The Attack Mechanism: Why Parvovirus Is So Dangerous',
      },
      {
        type: 'paragraph',
        content: 'When an unvaccinated puppy ingests the virus via contaminated soil, footwear, or direct contact with infected feces, the virus first replicates in the lymphoid tissue of the pharynx before dispersing through the bloodstream to two target zones:',
      },
      {
        type: 'paragraph',
        content: '1. The Intestinal Crypts: Normal intestinal villi absorb water and nutrients while keeping gut bacteria inside the lumen. Parvo destroys the germinal crypt cells that regenerate these villi, causing massive mucosal sloughing, severe protein-losing enteropathy, and opening the bloodstream to bacterial translocation and sepsis.\n2. The Bone Marrow: Parvo suppresses leukopoiesis, obliterating white blood cell reserves (severe panleukopenia) just as gut bacteria flood the circulatory system.',
      },
      {
        type: 'callout',
        calloutType: 'clinical-alert',
        content: 'PREVENTION WARNING: Until a puppy has completed their full core vaccination series (typically concluding at 16 weeks of age with veterinary verification), avoid public dog parks, communal pet store floors, and interaction with unvaccinated canines.',
      },
    ],
  },
  {
    id: 'one-health-zoonotic-parasites',
    slug: 'one-health-zoonotic-parasites',
    title: 'One Health in Practice: How Zoonotic Vector-Borne Pathogens Connect Us',
    subtitle: 'From ticks and sandflies to household safety: Why safeguarding animal health directly protects human family members.',
    excerpt: 'The World Health Organization and WSAVA champion the One Health framework. Discover how canine vector-borne infections like Lyme disease, Leishmaniasis, and Anaplasmosis act as sentinel indicators for shared ecosystem health.',
    featuredImage: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Veterinarian outdoors with a happy companion dog in nature',
    imageCaption: 'Preventive parasitology in companion pets is one of the strongest defensive barriers against zoonotic diseases in human households.',
    category: 'one-health',
    tags: ['one-health', 'preventive-care', 'dogs', 'cats'],
    authorId: 'dr-deepesh-mathur',
    reviewerId: 'dr-chirag-patidar',
    reviewedDate: '2026-08-30',
    publishedDate: '2026-08-29',
    updatedDate: '2026-08-31',
    readingTimeMinutes: 6,
    isDemo: true,
    isPopular: false,
    seoTitle: 'One Health & Zoonotic Diseases in Pets | ThatVetGuy',
    seoDescription: 'Explore the One Health approach linking veterinary science to human medicine, zoonotic parasite prevention, and community health.',
    references: [
      {
        id: 'ref-one-1',
        citation: 'Dantas-Torres, F., et al. (2012). Ticks on dogs and cats in the United States and the risk of zoonotic transmission. Parasites & Vectors, 5, 275.',
        source: 'Parasites & Vectors',
        year: 2012,
      },
      {
        id: 'ref-one-2',
        citation: 'World Health Organization (WHO). (2022). One Health: A holistic approach to addressing global health threats.',
        source: 'WHO Global Health Papers',
        year: 2022,
        url: 'https://www.who.int/news-room/questions-and-answers/item/one-health',
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• Over 60% of emerging human infectious diseases are zoonotic—originating in domestic or wild animals.\n• Dogs and cats act as ecological sentinels; their exposure to ticks and fleas reflects environmental pathogen pressure for the entire human household.\n• Continuous, year-round ectoparasite prevention is not merely pet wellness—it is public health stewardship.',
      },
      {
        type: 'paragraph',
        content: 'Human health, animal health, and ecosystem integrity are inextricably bound. In clinical veterinary practice, this reality is demonstrated daily through the lens of vector-borne diseases and shared zoonoses.',
      },
      {
        type: 'paragraph',
        content: 'When we prescribe isoxazoline tick chewables or topical fipronil formulations to a family dog, we are not solely protecting that canine from Lyme disease (Borrelia burgdorferi) or Canine Ehrlichiosis. We are interrupting the pathogen cycle in the domestic environment, preventing infected engorged ticks from detaching on living room carpets and biting human infants or immunocompromised family members.',
      },
    ],
  },
  {
    id: 'feline-lower-urinary-tract-disease',
    slug: 'feline-lower-urinary-tract-disease',
    title: 'Feline Lower Urinary Tract Disease (FLUTD): Stress, Hydration, and Nutrition',
    subtitle: 'Decoding cystitis, struvite crystalluria, and urethral obstruction in companion cats.',
    excerpt: 'Straining in the litter box is often mistakenly assumed to be constipation. In male cats, urethral obstruction is a life-threatening veterinary emergency requiring immediate unblocking.',
    featuredImage: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=1200',
    imageAlt: 'Calm domestic shorthair cat resting near a sunny window',
    imageCaption: 'Environmental enrichment and low-stress hydration protocols are foundational in preventing feline idiopathic cystitis recurrence.',
    category: 'veterinary-medicine',
    tags: ['cats', 'emergency', 'nutrition', 'preventive-care'],
    authorId: 'dr-amaan-ahmed',
    reviewerId: 'dr-shivam-singh-thakur',
    reviewedDate: '2026-09-01',
    publishedDate: '2026-08-31',
    updatedDate: '2026-09-02',
    readingTimeMinutes: 7,
    isDemo: true,
    isPopular: false,
    seoTitle: 'FLUTD in Cats Explained | Veterinary Medicine',
    seoDescription: 'Veterinary guide to Feline Lower Urinary Tract Disease (FLUTD), distinguishing idiopathic cystitis from life-threatening urethral obstruction in male cats.',
    references: [
      {
        id: 'ref-flutd-1',
        citation: 'Buffington, C. A. T. (2011). Idiopathic cystitis in domestic cats: syndrome of chronic pelvic pain? Journal of Veterinary Internal Medicine, 25(4), 844-849.',
        source: 'JVIM Consensus',
        year: 2011,
      },
      {
        id: 'ref-flutd-2',
        citation: 'Forrester, S. D., & Roudebush, P. (2007). Evidence-based management of feline lower urinary tract disease. Veterinary Clinics: Small Animal Practice, 37(3), 533-558.',
        source: 'Veterinary Clinics of North America',
        year: 2007,
      },
    ],
    contentBlocks: [
      {
        type: 'takeaways',
        content: '• Straining repeatedly in the litter box, crying while posturing, or passing drops of blood is a medical emergency in male cats.\n• Complete urethral obstruction can cause fatal hyperkalemia (cardiac arrest) within 24 to 48 hours.\n• Approximately 60-70% of feline lower urinary tract cases are Feline Idiopathic Cystitis (FIC)—a sterile neuro-hormonal response to environmental stress.\n• Transitioning to high-moisture canned diets and increasing water fountains dramatically dilutes urinary solute concentration.',
      },
      {
        type: 'paragraph',
        content: 'Few feline behaviors cause more frustration and misunderstanding than inappropriate urination outside the litter box. Yet in veterinary medicine, we know that cats rarely act out of spite. Changes in urinary habits almost invariably signal physical discomfort or environmental distress.',
      },
      {
        type: 'callout',
        calloutType: 'clinical-alert',
        content: 'EMERGENCY RED FLAG: If a male cat visits the litter box repeatedly, strains with intense vocalization, and produces zero urine, treat this as an immediate life-threatening emergency. Urethral blockage from a crystalline or mucoid plug requires immediate catheterization under veterinary supervision.',
      },
    ],
  },
];

function getCombinedArticles(): Article[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('tvg_articles_store') : null;
    const deletedRaw = typeof window !== 'undefined' ? localStorage.getItem('tvg_deleted_articles') : null;
    const deletedIds = new Set<string>(deletedRaw ? JSON.parse(deletedRaw) : []);
    const localList: Article[] = raw ? JSON.parse(raw) : [];

    const map = new Map<string, Article>();
    for (const a of ARTICLES) {
      if (!deletedIds.has(a.id)) {
        map.set(a.id, a);
      }
    }
    for (const a of localList) {
      if (!deletedIds.has(a.id)) {
        map.set(a.id, a);
      }
    }
    return Array.from(map.values());
  } catch (e) {
    return ARTICLES;
  }
}

export function getArticleBySlug(slug: string): Article | undefined {
  const all = getCombinedArticles();
  return all.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  const all = getCombinedArticles();
  return all.filter((a) => a.category === categorySlug && a.status !== 'DRAFT');
}

export function getArticlesByAuthor(authorIdOrSlug: string): Article[] {
  const all = getCombinedArticles();
  const normalized = authorIdOrSlug === 'dr-shivam' ? 'dr-shivam-singh-thakur' : authorIdOrSlug;
  return all.filter(
    (a) =>
      (a.authorId === normalized || (normalized === 'dr-shivam-singh-thakur' && a.authorId === 'dr-shivam')) &&
      a.status !== 'DRAFT'
  );
}

export function getArticlesByTag(tagSlug: string): Article[] {
  const all = getCombinedArticles();
  return all.filter((a) => a.tags.includes(tagSlug) && a.status !== 'DRAFT');
}

export function getFeaturedArticle(): Article {
  const all = getCombinedArticles().filter((a) => a.status === 'PUBLISHED' || !a.status);
  return all.find((a) => a.isFeatured) || all[0] || ARTICLES[0];
}

export function getPopularArticles(): Article[] {
  const all = getCombinedArticles().filter((a) => a.status === 'PUBLISHED' || !a.status);
  return all.filter((a) => a.isPopular);
}

export function getLatestArticles(limit?: number): Article[] {
  const all = getCombinedArticles().filter((a) => a.status === 'PUBLISHED' || !a.status);
  const sorted = [...all].sort(
    (a, b) => new Date(b.publishedDate || 0).getTime() - new Date(a.publishedDate || 0).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}


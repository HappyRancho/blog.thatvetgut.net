import { emptyArticle, type Article } from "../lib/domain";
// Editorial proposals only. Founders must verify sources, accept attribution and record independent review.
const drafts = [
  {
    id: "prepare-for-veterinary-visit",
    image:
      "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "A golden puppy running across grass",
    title: "Make your next vet visit more useful",
    subtitle:
      "A simple preparation guide: what to record, what to bring and which questions to ask.",
    category: "pet-health",
    authorId: "dr-chirag-patidar",
    tags: ["dogs", "cats", "vet visits"],
    content:
      '<h2>Start with the change you noticed</h2><p>A veterinary appointment is more useful when the team can understand what has changed and when. Describe observations rather than deciding on a diagnosis: eating less, drinking more, struggling on the stairs or hiding are useful starting points. A symptom can have several causes, and an examination puts it in context.</p><h2>Build a short timeline</h2><p>Write down when the change began, whether it is continuous or intermittent, and any changes in food, medication, routine or environment. Record appetite, drinking, toileting and activity. A brief video of an intermittent behaviour can help, provided recording it does not delay care or distress the animal.</p><h2>Bring the information that changes decisions</h2><p>Bring vaccination and previous clinical records when available. Make a list of every medicine and supplement, including its packaging and the amount actually given. Include recent diet changes and possible access to plants, human medicines, rubbish or damaged toys. Ask the clinic whether a sample is needed and how it should be collected.</p><h2>Ask for a plan you can follow</h2><p>Useful questions include: What are we checking for? What will this test tell us? What should I watch for at home? When should I call again? Ask the team to explain instructions you do not understand. Confirm how to give prescribed treatment, the next review date and what to do if your animal will not take it.</p><h2>Make the journey safer</h2><p>Tell the clinic about fear, handling difficulties or a previous stressful visit before you arrive. Use appropriate transport: a secure carrier for a cat and safe restraint for a dog. The clinic can help plan arrival and handling. Do not give sedatives or other medication unless prescribed for this animal.</p><h2>When preparation should wait</h2><p>If your animal has difficulty breathing, collapses, has a suspected poisoning or is rapidly deteriorating, contact a veterinary service promptly. A checklist should support care, never delay an emergency examination.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "AVMA \u2014 Resources for pet owners",
        url: "https://www.avma.org/resources-tools/pet-owners",
        year: "",
      },
    ],
  },
  {
    id: "understanding-veterinary-blood-tests",
    title: "A blood-test result is the start of a conversation",
    subtitle:
      "Why an out-of-range number needs clinical context, and how to discuss results with your veterinarian.",
    category: "veterinary-medicine",
    authorId: "dr-ritesh-verma",
    tags: ["diagnostics", "blood tests", "clinical context"],
    content:
      '<h2>A number is not a diagnosis</h2><p>Laboratory tests help a veterinarian investigate health, monitor disease or check treatment. A result is interpreted alongside the animal\u2019s history, examination and other findings. Reading one highlighted number without that context can lead to unnecessary worry or false reassurance.</p><h2>Understand the reference interval</h2><p>The interval printed beside a result describes the laboratory\u2019s comparison range. Intervals can differ between laboratories and methods. The significance of a change also depends on species, age, clinical condition, sample quality and the pattern of other results. A value inside the interval does not by itself exclude illness.</p><h2>Ask what the test was designed to answer</h2><p>Some tests assess cell counts; others investigate organ function, metabolic changes or a specific infection. Ask which clinical question the test addresses and whether the finding is specific to one disease. Your veterinarian may need additional tests or a repeat sample to clarify the result.</p><h2>Keep the whole report</h2><p>Save the report with the date, laboratory, medicines being taken and the reason for testing. Previous results can make changes over time easier to interpret. Screenshots that crop out units, intervals or the animal\u2019s details can remove information needed for a useful comparison.</p><h2>Discuss the next step</h2><p>Ask which results affect decisions today, which will be monitored and when reassessment is recommended. If a repeat test is planned, clarify food, water and medicine instructions with the clinic. Do not stop a prescription or add a supplement solely because an online chart labels a result abnormal.</p><h2>Know when to call sooner</h2><p>A worsening animal needs advice even if an earlier result looked reassuring. Follow the clinic\u2019s instructions about symptoms requiring an earlier review. Testing supports clinical reasoning; it does not replace an examination.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title:
          "Merck Veterinary Manual \u2014 Clinical pathology and procedures",
        url: "https://www.merckvetmanual.com/clinical-pathology-and-procedures",
        year: "",
      },
    ],
  },
  {
    id: "reading-pet-food-labels",
    title: "What a pet-food label can\u2014and cannot\u2014tell you",
    subtitle:
      "Look beyond ingredient marketing to life stage, nutritional suitability and the questions a manufacturer should answer.",
    category: "animal-nutrition",
    authorId: "dr-shivam-singh-thakur",
    tags: ["nutrition", "dogs", "cats", "food labels"],
    content:
      '<h2>Start with suitability</h2><p>Before judging a bag by its ingredient list, ask whether the food is intended for your animal\u2019s species and life stage, and whether it is designed to provide complete nutrition or to complement another diet. Labelling terms differ between markets. Ask your veterinarian to interpret unfamiliar statements in the local context.</p><h2>Ingredients are only one part of the picture</h2><p>An ingredient list does not by itself show how well a food is formulated, manufactured, digested or suited to an individual animal. Attractive marketing language is not a substitute for nutritional expertise or quality control. \u201cNatural\u201d or \u201cpremium\u201d does not tell you whether a diet meets this animal\u2019s needs.</p><h2>Ask about the people and process behind the food</h2><p>Useful manufacturer questions include who formulates the diets, what qualifications they have, what quality-control measures are used, and whether detailed nutritional and calorie information is available. A company should be able to answer these questions clearly rather than relying only on advertising.</p><h2>Use the feeding guide as a starting point</h2><p>The amount printed on a package cannot account for every animal\u2019s activity, body condition and household treats. Ask the clinic to assess body condition and help plan a suitable daily amount. Record the food, quantity, treats and supplements so adjustments are based on what is actually fed.</p><h2>Medical diets need individual advice</h2><p>An animal with a health condition may have nutritional needs that a general comparison chart cannot address. Changes to a prescribed diet, homemade recipe or supplement plan should be discussed with the treating veterinarian. Adding nutrients without knowing the existing diet can unbalance it.</p><h2>Take a photograph to the appointment</h2><p>Photograph the front, nutritional statement, feeding guide and manufacturer contact details. Bring the current diet history. These are more useful for a clinical discussion than a single ingredient ranking or a social-media score.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "WSAVA \u2014 Global nutrition guidelines",
        url: "https://wsava.org/global-guidelines/global-nutrition-guidelines/",
        year: "",
      },
    ],
  },
  {
    id: "plan-your-pets-preventive-care",
    title: "Build a prevention plan around your animal\u2019s life",
    subtitle:
      "Vaccination records, parasite risk and dental care belong in one practical conversation.",
    category: "preventive-care",
    authorId: "dr-chirag-patidar",
    tags: ["prevention", "vaccination", "parasites"],
    content:
      '<h2>Start with the animal, not a universal calendar</h2><p>Preventive care depends on species, age, previous records, health, exposure and local disease risks. A useful plan is made with the veterinarian who knows the animal. Internet schedules can help you prepare questions, but they cannot establish the right programme for every household.</p><h2>Bring previous vaccination records</h2><p>Take dated records rather than relying on memory. Your veterinarian can explain which vaccinations are recommended, what follow-up is required and how uncertainty in the history affects the plan. Travel, boarding and local legal requirements may also influence decisions.</p><h2>Discuss parasite exposure</h2><p>Tell the clinic about outdoor access, hunting, fleas or ticks, contact with other animals, travel and children in the household. Parasite control involves the animal and its environment. Do not transfer a product or dose between species: a product suitable for a dog may be unsafe for a cat.</p><h2>Include teeth, weight and behaviour</h2><p>A prevention visit is also an opportunity to discuss dental care, body condition, feeding, handling and changes in behaviour. Ask the clinic to demonstrate techniques rather than guessing at home. Explain what you can realistically maintain so the plan is workable.</p><h2>Leave with a clear record</h2><p>Ask for written next steps: what was given, what to monitor, when follow-up is due and how to contact the clinic with concerns. Keep documents accessible for a new clinic or travel. Set reminders based on the agreed plan rather than an unverified online timetable.</p><h2>Review when life changes</h2><p>A move, new animal, pregnancy, illness or change in outdoor access can alter risk. Prevention is an ongoing discussion. If your animal is unwell, arrange clinical advice rather than waiting for the next routine appointment.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "WSAVA \u2014 Vaccination guidelines",
        url: "https://wsava.org/global-guidelines/vaccination-guidelines/",
        year: "",
      },
    ],
  },
  {
    id: "suspected-pet-poisoning-first-actions",
    title: "Suspected poisoning: the first call matters",
    subtitle:
      "Collect the right information, prevent further exposure and avoid treatment by guesswork.",
    category: "emergency-critical-care",
    authorId: "dr-amaan-ahmed",
    tags: ["emergency", "poisoning", "dogs", "cats"],
    content:
      '<h2>Contact a veterinary service promptly</h2><p>If you suspect your animal has swallowed, inhaled or contacted a harmful substance, call a veterinarian promptly. Some exposures require action before signs appear. The absence of symptoms is not a reliable reason to wait.</p><h2>Make the situation safe</h2><p>Prevent further access to the substance if you can do so safely. Protect yourself and other animals from exposure. Do not enter an unsafe area or handle an aggressive, distressed animal without help. Ask the veterinary team how to transport the animal and whether any immediate decontamination is appropriate.</p><h2>Gather the details the team needs</h2><p>Have the animal\u2019s species, approximate weight and medical history ready. Describe the product or substance, estimated amount, time of exposure and current signs. Photograph the label and bring packaging when safe. Explain anything you have already given or done.</p><h2>Do not induce vomiting by yourself</h2><p>Whether vomiting is appropriate depends on the substance, the animal and the circumstances. Home methods can cause additional harm. Do not give salt, oils, human medicines or other improvised treatments. Follow case-specific veterinary instructions.</p><h2>Use a handover checklist</h2><p>Write down the time of the call, the clinic you are travelling to and the instructions given. Ask whether the service can manage the case or whether another facility is needed. Keep product information with the animal\u2019s records so it reaches the treating team.</p><h2>Review prevention afterward</h2><p>Once the immediate situation is managed, review how exposure happened. Secure medicines, chemicals, food waste and relevant plants; keep packaging and emergency clinic contacts accessible. Prevention reduces future risk, but it does not replace urgent advice during an exposure.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "AVMA \u2014 Household hazards",
        url: "https://www.avma.org/resources-tools/pet-owners/petcare/household-hazards",
        year: "",
      },
    ],
  },
  {
    id: "rabies-prevention-and-bite-response",
    title: "Rabies prevention starts before a bite",
    subtitle:
      "Responsible vaccination, safe animal handling and prompt medical assessment after a possible exposure.",
    category: "one-health",
    authorId: "dr-amaan-ahmed",
    tags: ["rabies", "India", "One Health"],
    content:
      '<h2>A shared health responsibility</h2><p>Rabies prevention connects animal vaccination, human healthcare, community education and safer interactions with animals. Public-health guidance is particularly relevant where canine rabies remains a risk. Local health authorities can explain current services and exposure protocols.</p><h2>Keep animal vaccination records</h2><p>Ask your veterinarian about the appropriate vaccination programme and documentation for your animal. Maintain dated records and discuss requirements after moving or travelling. A missing record should be addressed with the clinic rather than assumed to prove protection.</p><h2>Avoid unsafe handling</h2><p>Do not approach an unfamiliar animal behaving unusually or try to catch a potentially rabid animal. Keep children away and contact local veterinary or animal-control services. A frightened or injured animal also needs safe, trained handling.</p><h2>After a possible exposure, seek medical assessment</h2><p>WHO advises prompt washing of a bite wound with soap and running water for at least 15 minutes and urgent assessment for post-exposure care. Bites, scratches and saliva contact with broken skin or mucous membranes need assessment in context. Do not wait for symptoms or rely on a home remedy.</p><h2>Let clinicians decide the exposure plan</h2><p>A healthcare professional determines whether vaccination and other post-exposure measures are needed. Animal vaccination status, exposure circumstances and local guidance are part of the assessment. Follow the prescribed course and review dates; an internet article cannot decide an individual\u2019s treatment.</p><h2>Support prevention without misinformation</h2><p>Share verified public-health guidance and encourage humane, organised vaccination and animal-management programmes. Avoid claims that appearance alone proves an animal is safe or infected. One Health works best when communities, clinicians and veterinary services coordinate.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "WHO \u2014 Rabies fact sheet",
        url: "https://www.who.int/news-room/fact-sheets/detail/rabies",
        year: "",
      },
    ],
  },
  {
    id: "less-stressful-cat-carrier-travel",
    title: "Make the cat carrier part of everyday life",
    subtitle:
      "Prepare for calmer transport and tell the clinic what helps your cat feel safer.",
    category: "animal-welfare",
    authorId: "dr-deepesh-chaware",
    tags: ["cats", "behaviour", "handling", "vet visits"],
    content:
      '<h2>Begin before appointment day</h2><p>For many cats, a carrier predicts an unfamiliar journey and handling. Leaving an appropriate carrier accessible at home can allow it to become part of a familiar environment. Preparation works best when it is gradual and adapted to the individual cat.</p><h2>Choose a practical carrier</h2><p>Ask the clinic about a secure, easy-to-open carrier that allows safe examination and handling. Check the door, clips and base before travel. A damaged or unsecured carrier can create an escape risk. Avoid forcing a distressed cat through a small opening.</p><h2>Create familiarity without pressure</h2><p>A familiar blanket and voluntary exploration can help. Keep sessions short, reward approaches the cat is comfortable making and allow retreat. Do not chase the cat repeatedly into the carrier. If transport remains difficult, ask the clinic for a plan ahead of time.</p><h2>Plan the journey</h2><p>Keep the carrier stable and safely restrained during travel. Avoid opening it in an unsecured area. Ask the clinic about arrival arrangements and a quieter waiting space when available. Tell the team about previous fear, motion sickness or handling difficulties.</p><h2>Recognise when support is needed</h2><p>Preparation is not always enough for a highly fearful cat. A veterinarian can assess whether medication or a modified appointment plan is appropriate. Use only medication prescribed for that cat and follow the instructions; another animal\u2019s prescription is not a suitable shortcut.</p><h2>Keep the goal realistic</h2><p>The aim is safer transport and less distress, not perfect behaviour. After the visit, let the cat settle in a familiar space and review which steps helped. For urgent illness, contact the clinic promptly rather than postponing care while trying to complete training.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "Feline Veterinary Medical Association \u2014 Cat carrier tips",
        url: "https://catfriendly.com/cat-care-at-home/cat-carrier-tips/",
        year: "",
      },
    ],
  },
  {
    id: "useful-herd-health-records",
    title: "Keep herd records that help a veterinarian act",
    subtitle:
      "Individual identification, event timelines and practical handover information for field visits.",
    category: "livestock-large-animals",
    authorId: "dr-deepesh-mathur",
    tags: ["livestock", "herd health", "records", "India"],
    content:
      '<h2>A useful record supports a decision</h2><p>Farm records do not need to be elaborate to improve a veterinary visit. Consistent identification, a clear event timeline and accurate treatment details can help the team understand individual cases and patterns across a herd. Choose a system the people doing daily care can maintain.</p><h2>Identify the animal consistently</h2><p>Use the agreed identification method and record species, age or date of birth, reproductive status and relevant production information. Avoid changing an animal\u2019s identifier between notebooks or shifts. Group-level observations should be labelled clearly rather than attributed to one individual.</p><h2>Record what changed and when</h2><p>Note changes in feeding, water access, housing, movement and contact with other animals. Describe observed signs and their timing. Record how many animals are affected and any deaths. A dated observation is more useful than an undated description such as \u201coften unwell\u201d.</p><h2>Keep treatment and withdrawal instructions together</h2><p>Record the product, prescribing veterinarian, animal or group treated, date and instructions. Follow the product label and veterinarian\u2019s advice for milk, meat or egg withdrawal periods. Do not use a general internet table as a substitute for the specific product and local requirements.</p><h2>Prepare a handover for the field visit</h2><p>Have previous records, product packaging and contact details available. Ask the service about safe handling facilities, sample collection and biosecurity precautions before arrival. Explain constraints such as water, electricity, transport and staffing so the plan can be adapted to the farm.</p><h2>Review patterns with the veterinary team</h2><p>Routine review can identify questions about nutrition, housing, vaccination and disease prevention. Changes in multiple animals or rapid deterioration require timely veterinary advice. Records support investigation; they do not establish a diagnosis on their own.</p><aside class="key-takeaways"><p><strong>Put this into practice</strong></p><p>Keep useful records, ask clear questions and let the veterinary examination guide decisions for your animal.</p></aside>',
    references: [
      {
        title: "WOAH \u2014 Codes and manuals",
        url: "https://www.woah.org/en/what-we-do/standards/codes-and-manuals/",
        year: "",
      },
    ],
  },
];
export const launchDrafts: Article[] = drafts.map((d) => ({
  ...emptyArticle(d.authorId),
  ...d,
}));

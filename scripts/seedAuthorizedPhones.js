import fs from 'fs';
import crypto from 'crypto';

// Load Firebase configuration
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const accessToken = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;

if (!accessToken) {
  throw new Error(
    'GOOGLE_OAUTH_ACCESS_TOKEN is required to seed authorized phones. Use a trusted Google IAM access token; API-key requests are blocked by Firestore security rules.'
  );
}

// Authorized phone numbers for the 6 Co-Founders. Keep these in normalized
// E.164 format because the Firestore rules use the phone number as the
// allowlist document ID.
const INITIAL_CO_FOUNDER_PHONES = [
  {
    phone: '+919826337391',
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
  },
  {
    phone: '+919893087892',
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
  },
  {
    phone: '+918305969001',
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
  },
  {
    phone: '+918823058797',
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
  },
  {
    phone: '+918239487081',
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
  },
  {
    phone: '+916263275093',
    authorId: 'dr-deepesh-chaware',
    name: 'Dr. Deepesh Chaware',
  },
];

function hashPhone(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

function maskPhone(phone) {
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

async function seed() {
  console.log('Seeding authorized phone numbers to Firestore...');
  for (const item of INITIAL_CO_FOUNDER_PHONES) {
    const phoneHash = hashPhone(item.phone);
    const masked = maskPhone(item.phone);

    // Save under the canonical E.164 document ID required by Firestore rules,
    // with legacy aliases retained for existing client lookups.
    const targets = [
      item.phone,
      phoneHash,
      `p_${item.phone.replace('+', '')}`,
    ];

    for (const docId of targets) {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/authorized_phones/${encodeURIComponent(docId)}`;
      const body = {
        fields: {
          authorId: { stringValue: item.authorId },
          name: { stringValue: item.name },
          role: { stringValue: 'CO_FOUNDER' },
          status: { stringValue: 'ACTIVE' },
          maskedPhone: { stringValue: masked },
          phoneHash: { stringValue: phoneHash },
        },
      };

      try {
        const res = await fetch(url, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          console.log(`✓ Seeded ${item.name} (${docId})`);
        } else {
          console.warn(`! Notice for ${docId}:`, res.status, await res.text());
        }
      } catch (err) {
        console.error(`✗ Error seeding ${docId}:`, err);
      }
    }
  }
  console.log('Finished seeding authorized phone numbers.');
}

seed();

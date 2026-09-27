import fs from 'fs';
import crypto from 'crypto';

// Load Firebase configuration
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// Initial test numbers for the 6 Co-Founders (can also be configured via environment variables or Firebase Console)
const INITIAL_CO_FOUNDER_PHONES = [
  {
    phone: '+919876543210',
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
  },
  {
    phone: '+919876543211',
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
  },
  {
    phone: '+919876543212',
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
  },
  {
    phone: '+919876543213',
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
  },
  {
    phone: '+919876543214',
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
  },
  {
    phone: '+919876543215',
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

    // Save with normalized phone as ID (URL-encoded) and by hash
    const targets = [
      encodeURIComponent(item.phone),
      phoneHash,
      `p_${item.phone.replace('+', '')}`,
    ];

    for (const docId of targets) {
      const url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/authorized_phones/${docId}?key=${config.apiKey}`;
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
          headers: { 'Content-Type': 'application/json' },
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

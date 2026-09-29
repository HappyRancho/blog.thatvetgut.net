import fs from 'fs';
import crypto from 'crypto';

// Load Firebase configuration
const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

// The official 6 Co-Founders of ThatVetGuy with their authorized mobile numbers
const CO_FOUNDER_PHONES = [
  {
    phone: process.env.CHIRAG_PHONE || '+919826337391',
    authorId: 'dr-chirag-patidar',
    name: 'Dr. Chirag Patidar',
  },
  {
    phone: process.env.AMAAN_PHONE || '+919893087892',
    authorId: 'dr-amaan-ahmed',
    name: 'Dr. Amaan Ahmed',
  },
  {
    phone: process.env.SHIVAM_PHONE || '+918305969001',
    authorId: 'dr-shivam-singh-thakur',
    name: 'Dr. Shivam Singh Thakur',
  },
  {
    phone: process.env.RITESH_PHONE || '+918823058797',
    authorId: 'dr-ritesh-verma',
    name: 'Dr. Ritesh Verma',
  },
  {
    phone: process.env.MATHUR_PHONE || '+918239487081',
    authorId: 'dr-deepesh-mathur',
    name: 'Dr. Deepesh Mathur',
  },
  {
    phone: process.env.CHAWARE_PHONE || '+916263275093',
    authorId: 'dr-deepesh-chaware',
    name: 'Dr. Deepesh Chaware',
  },
];

function normalize(raw) {
  let cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

function hashPhone(phone) {
  return crypto.createHash('sha256').update(phone).digest('hex');
}

function maskPhone(phone) {
  const prefix = phone.slice(0, 3);
  const suffix = phone.slice(-3);
  return `${prefix} ••••• ••${suffix}`;
}

async function seed() {
  console.log('Updating authorized phone numbers in Firestore...');

  const token = process.env.GOOGLE_OAUTH_ACCESS_TOKEN;
  if (token) {
    console.log('Using GOOGLE_OAUTH_ACCESS_TOKEN for Firestore authentication.');
  }

  for (const item of CO_FOUNDER_PHONES) {
    const normalizedPhone = normalize(item.phone);
    const phoneHash = hashPhone(normalizedPhone);
    const masked = maskPhone(normalizedPhone);

    // Save with normalized phone as ID (URL-encoded), by clean key, and by SHA-256 hash
    const targets = [
      encodeURIComponent(normalizedPhone),
      phoneHash,
      `p_${normalizedPhone.replace('+', '')}`,
    ];

    for (const docId of targets) {
      let url = `https://firestore.googleapis.com/v1/projects/${config.projectId}/databases/${config.firestoreDatabaseId}/documents/authorized_phones/${docId}`;
      if (!token && config.apiKey) {
        url += `?key=${config.apiKey}`;
      }

      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

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
          headers,
          body: JSON.stringify(body),
        });
        if (res.ok) {
          console.log(`✓ Updated ${item.name} (${docId})`);
        } else {
          console.warn(`! Notice for ${docId}:`, res.status, await res.text());
        }
      } catch (err) {
        console.error(`✗ Error updating ${docId}:`, err);
      }
    }
  }
  console.log('Finished updating authorized phone numbers.');
}

seed();

/**
 * Migration script to convert existing providers to the new structured services format
 * 
 * Usage:
 *   npx tsx scripts/migrateServices.ts
 * 
 * This script:
 * 1. Loads default services from data/defaultServices.json
 * 2. Finds all providers without the new 'services' field
 * 3. Initializes them with default services (using avgPriceRange.min as default price)
 * 4. Preserves legacy servicesOffered for backward compatibility
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Firebase Admin (you'll need to set up service account)
// For now, this assumes you have GOOGLE_APPLICATION_CREDENTIALS env var set
// Or you can uncomment and configure the service account path below

let db: ReturnType<typeof getFirestore>;

try {
  // Option 1: Use service account file
  // const serviceAccount = require('../path/to/serviceAccountKey.json');
  // initializeApp({ credential: cert(serviceAccount) });
  
  // Option 2: Use default credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
  initializeApp();
  db = getFirestore();
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  console.error('Make sure you have GOOGLE_APPLICATION_CREDENTIALS set or service account configured');
  process.exit(1);
}

interface Service {
  category: string;
  name: string;
  slug: string;
  description: string;
  estimatedDuration: string;
  avgPriceRange: { min: number; max: number };
  price?: number;
}

async function migrateServices() {
  try {
    // Load default services template
    const servicesPath = path.join(__dirname, '../data/defaultServices.json');
    const defaultServices: Service[] = JSON.parse(fs.readFileSync(servicesPath, 'utf-8'));

    console.log(`Loaded ${defaultServices.length} default services from template`);

    // Get all providers
    const providersSnapshot = await db.collection('providers').get();
    console.log(`Found ${providersSnapshot.size} providers`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of providersSnapshot.docs) {
      const data = doc.data();
      const providerId = doc.id;

      // Skip if already has new services structure
      if (Array.isArray(data.services) && data.services.length > 0) {
        console.log(`✓ Provider ${providerId} already has structured services, skipping`);
        skipped++;
        continue;
      }

      try {
        // Initialize services with default template
        const initializedServices: Service[] = defaultServices.map((service) => ({
          ...service,
          price: service.avgPriceRange.min, // Default to minimum price
        }));

        // Update provider document
        await db.collection('providers').doc(providerId).update({
          services: initializedServices,
          // Preserve legacy servicesOffered if it exists
          // If not, create it from service names for backward compatibility
          servicesOffered: data.servicesOffered || initializedServices.map(s => s.name),
        });

        console.log(`✓ Migrated provider ${providerId} (${data.businessName || 'Unnamed'})`);
        migrated++;
      } catch (error) {
        console.error(`✗ Error migrating provider ${providerId}:`, error);
        errors++;
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total providers: ${providersSnapshot.size}`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Skipped (already migrated): ${skipped}`);
    console.log(`Errors: ${errors}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateServices()
  .then(() => {
    console.log('\nMigration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });


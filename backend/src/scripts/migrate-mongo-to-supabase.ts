import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { SupabaseClient, mapObjectToSnake } from '../config/supabase';

interface MigrationStats {
  collection: string;
  sourceCount: number;
  migratedCount: number;
  errors: number;
}

const stats: MigrationStats[] = [];

async function migrateCollection(
  collectionName: string,
  supabaseTable: string,
  transform?: (doc: any) => any
) {
  console.log(`\n--------------------------------------------------`);
  console.log(`🔄 Migrating [${collectionName}] -> [${supabaseTable}]...`);

  const stat: MigrationStats = {
    collection: collectionName,
    sourceCount: 0,
    migratedCount: 0,
    errors: 0
  };

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error('MongoDB database instance not connected');
    const collection = db.collection(collectionName);
    const docs = await collection.find({}).toArray();

    stat.sourceCount = docs.length;
    console.log(`Found ${docs.length} records in MongoDB collection '${collectionName}'.`);

    if (docs.length === 0) {
      console.log(`No records to migrate for ${collectionName}. Skipping.`);
      stats.push(stat);
      return;
    }

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = docs.slice(i, i + batchSize);
      const transformedBatch = batch.map((doc: any) => {
        const id = doc._id ? doc._id.toString() : undefined;
        let item = { ...doc };
        delete item.__v;

        if (transform) {
          item = transform(item);
        }

        const snake = mapObjectToSnake(item);
        if (id) {
          snake.id = id;
        }

        // Format foreign keys if they were ObjectIds
        if (snake.clinic_id) snake.clinic_id = snake.clinic_id.toString();
        if (snake.user_id) snake.user_id = snake.user_id.toString();
        if (snake.role_id) snake.role_id = snake.role_id.toString();
        if (snake.patient_id && typeof snake.patient_id === 'object') snake.patient_id = snake.patient_id.toString();
        if (snake.doctor_id && typeof snake.doctor_id === 'object') snake.doctor_id = snake.doctor_id.toString();
        if (snake.department_id && typeof snake.department_id === 'object') snake.department_id = snake.department_id.toString();

        return snake;
      });

      try {
        await SupabaseClient.request(`/${supabaseTable}`, {
          method: 'POST',
          headers: {
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify(transformedBatch)
        });
        stat.migratedCount += batch.length;
        console.log(`  ✓ Migrated batch ${Math.floor(i / batchSize) + 1} (${stat.migratedCount}/${docs.length})`);
      } catch (err: any) {
        console.error(`  ✗ Error migrating batch: ${err.message}`);
        stat.errors += batch.length;
      }
    }
  } catch (error: any) {
    console.error(`Failed to migrate ${collectionName}:`, error.message);
    stat.errors += stat.sourceCount;
  }

  stats.push(stat);
}

export async function runDataMigration() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ MONGO_URI environment variable is missing.');
    process.exit(1);
  }

  const supabaseConfig = SupabaseClient.getConfig();
  if (!supabaseConfig.url || !supabaseConfig.serviceRoleKey) {
    console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for data migration.');
    process.exit(1);
  }

  console.log('==================================================');
  console.log(' 🚀 Starting ClinicFlow MongoDB -> Supabase Migration');
  console.log(` 🍃 Source MongoDB: ${mongoUri.split('@')[1] || 'Connected'}`);
  console.log(` ⚡ Target Supabase: ${supabaseConfig.url}`);
  console.log('==================================================');

  try {
    await mongoose.connect(mongoUri, { dbName: 'clinicflow' });
    console.log('Connected to source MongoDB.');

    // 1. Clinics
    await migrateCollection('clinics', 'clinics');

    // 2. Roles
    await migrateCollection('roles', 'roles');

    // 3. Users
    await migrateCollection('users', 'users');

    // 4. Departments
    await migrateCollection('departments', 'departments');

    // 5. Doctors
    await migrateCollection('doctors', 'doctors');

    // 6. Patients
    await migrateCollection('patients', 'patients');

    // 7. Appointments
    await migrateCollection('appointments', 'appointments');

    // 8. Prescriptions
    await migrateCollection('prescriptions', 'prescriptions');

    // 9. Bills
    await migrateCollection('bills', 'bills');

    // 10. Lab Orders
    await migrateCollection('laborders', 'lab_orders');

    // 11. Pharmacy Items
    await migrateCollection('pharmacyitems', 'pharmacy_items');

    // 12. Staff
    await migrateCollection('staffs', 'staff');

    // 13. Notifications
    await migrateCollection('notifications', 'notifications');

    // 14. Audit Logs
    await migrateCollection('auditlogs', 'audit_logs');

    console.log('\n==================================================');
    console.log(' 📊 Migration Summary Report');
    console.log('==================================================');
    console.table(stats);

    const totalSource = stats.reduce((acc, s) => acc + s.sourceCount, 0);
    const totalMigrated = stats.reduce((acc, s) => acc + s.migratedCount, 0);
    const totalErrors = stats.reduce((acc, s) => acc + s.errors, 0);

    console.log(`Total Source Records:   ${totalSource}`);
    console.log(`Successfully Migrated: ${totalMigrated}`);
    console.log(`Failed / Errors:       ${totalErrors}`);
    console.log('==================================================');
  } catch (error: any) {
    console.error('Migration aborted due to fatal error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Closed MongoDB connection.');
  }
}

if (require.main === module) {
  runDataMigration();
}

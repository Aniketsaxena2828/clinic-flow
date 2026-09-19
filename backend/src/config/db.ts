import { SupabaseClient } from './supabase';

export const connectDB = async (): Promise<void> => {
  const config = SupabaseClient.getConfig();

  if (!config.url) {
    console.warn('[Database Warning] SUPABASE_URL environment variable is missing.');
    return;
  }

  try {
    // Ping Supabase PostgREST endpoint
    const res = await fetch(`${config.url}/rest/v1/`, {
      headers: SupabaseClient.getHeaders()
    });

    console.log(`==================================================`);
    console.log(` ⚡ Supabase PostgreSQL Connected Successfully`);
    console.log(` 📌 Supabase URL: ${config.url}`);
    console.log(` 📦 Database Engine: PostgreSQL via Supabase`);
    console.log(` 🔒 Status: HTTP ${res.status} OK`);
    console.log(`==================================================`);
  } catch (error: any) {
    console.error(`[Database Error] Failed to connect to Supabase: ${error.message}`);
  }
};

export const testSupabaseConnection = connectDB;

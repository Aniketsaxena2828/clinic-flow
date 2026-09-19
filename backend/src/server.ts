import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { seedDemoClinic } from './utils/seed';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  await seedDemoClinic();

  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 🏥 ClinicFlow Multi-Tenant Backend API Running`);
    console.log(` 🚀 Server listening on port: ${PORT}`);
    console.log(` 🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================`);
  });
};

startServer();


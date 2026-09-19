import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import clinicRoutes from './routes/clinic.routes';
import userRoutes from './routes/user.routes';
import roleRoutes from './routes/role.routes';
import auditRoutes from './routes/audit.routes';
import patientRoutes from './routes/patient.routes';
import departmentRoutes from './routes/department.routes';
import doctorRoutes from './routes/doctor.routes';
import appointmentRoutes from './routes/appointment.routes';
import billingRoutes from './routes/billing.routes';
import prescriptionRoutes from './routes/prescription.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import labRoutes from './routes/lab.routes';
import staffRoutes from './routes/staff.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// CORS Configuration
const allowedOrigins: (string | RegExp)[] = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  'https://clinic-flow-bice.vercel.app',
  /^https:\/\/clinic-flow.*\.vercel\.app$/
];

if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/+$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin, callback) => {
    // Allow server-to-server or tools with no origin (curl, mobile, Postman)
    if (!requestOrigin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return allowed.toLowerCase() === requestOrigin.toLowerCase();
      }
      return allowed.test(requestOrigin);
    });

    if (isAllowed) {
      return callback(null, true);
    }

    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Clinic-ID', 'Accept', 'X-Requested-With'],
  optionsSuccessStatus: 204
};

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Health Check Endpoint
app.get(['/api/v1/health', '/api/health', '/health'], (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'ClinicFlow Backend API',
    database: 'Supabase PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Mounted Routes (Supports /api and /api/v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/v1/clinic', clinicRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/clinics', clinicRoutes);

app.use('/api/v1/users', userRoutes);
app.use('/api/users', userRoutes);

app.use('/api/v1/roles', roleRoutes);
app.use('/api/roles', roleRoutes);

app.use('/api/v1/audit-logs', auditRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/saas/audit-logs', auditRoutes);

app.use('/api/v1/patients', patientRoutes);
app.use('/api/patients', patientRoutes);

app.use('/api/v1/departments', departmentRoutes);
app.use('/api/departments', departmentRoutes);

app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/doctors', doctorRoutes);

app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/appointments', appointmentRoutes);

app.use('/api/v1/billing', billingRoutes);
app.use('/api/billing', billingRoutes);

app.use('/api/v1/prescriptions', prescriptionRoutes);
app.use('/api/prescriptions', prescriptionRoutes);

app.use('/api/v1/pharmacy', pharmacyRoutes);
app.use('/api/pharmacy', pharmacyRoutes);

app.use('/api/v1/lab', labRoutes);
app.use('/api/lab', labRoutes);

app.use('/api/v1/staff', staffRoutes);
app.use('/api/staff', staffRoutes);

app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 Fallback Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found.`
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;

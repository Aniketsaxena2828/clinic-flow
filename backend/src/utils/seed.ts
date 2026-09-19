import bcrypt from 'bcryptjs';
import { Clinic } from '../models/Clinic';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { Doctor } from '../models/Doctor';
import { Appointment } from '../models/Appointment';
import { AuthService } from '../services/auth.service';

export const seedDemoClinic = async () => {
  try {
    // Use find() instead of findOne() — the SupabaseRepository.findOne() special-case for
    // code==='demo-clinic' injects a clinic_id filter which is invalid on the clinics table
    // (clinics IS the tenant root, it has no clinic_id column), causing it to always return
    // null even when the record exists. find() has no such special-case.
    const existingDemos = await Clinic.find({ code: 'demo-clinic' });
    if (existingDemos && existingDemos.length > 0) {
      console.log('[Seed] Demo clinic already exists in Supabase — skipping seed.');
      return;
    }

    console.log('[Seed] Seeding default demo clinic (demo-clinic) in Supabase...');
    const clinic = await Clinic.create({
      name: 'LifeCare Multi-Specialty Clinic',
      code: 'demo-clinic',
      email: 'contact@democlinic.com',
      phone: '+1-800-555-0100',
      subscriptionTier: 'professional',
      address: {
        street: '100 Healthcare Boulevard',
        city: 'Metropolis',
        state: 'NY',
        country: 'USA'
      }
    });

    const roleMap = await AuthService.seedClinicRoles(clinic._id || clinic.id);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Password123', salt);

    // Create Owner
    await User.create({
      clinicId: clinic._id || clinic.id,
      name: 'Dr. Robert Ford (Owner)',
      email: 'owner@democlinic.com',
      passwordHash,
      roleId: roleMap['Owner'],
      roleName: 'Owner',
      phone: '+1-800-555-0101'
    });

    // Create Doctor
    await User.create({
      clinicId: clinic._id || clinic.id,
      name: 'Dr. Sarah Connor (Cardiology)',
      email: 'doctor@democlinic.com',
      passwordHash,
      roleId: roleMap['Doctor'],
      roleName: 'Doctor',
      phone: '+1-800-555-0102'
    });

    // Create Receptionist
    await User.create({
      clinicId: clinic._id || clinic.id,
      name: 'Elena Rostova (Reception)',
      email: 'reception@democlinic.com',
      passwordHash,
      roleId: roleMap['Receptionist'],
      roleName: 'Receptionist',
      phone: '+1-800-555-0103'
    });

    // Seed Demo Patients
    const createdPatients = await Patient.create([
      {
        clinicId: clinic._id || clinic.id,
        patientId: 'PAT-1001',
        name: 'Rahul Sharma',
        email: 'rahul.s@example.com',
        phone: '+1-555-0191',
        gender: 'Male',
        age: 34,
        bloodGroup: 'A+',
        address: { city: 'Metropolis', state: 'NY' },
        emergencyContact: { name: 'Priya Sharma', relationship: 'Spouse', phone: '+1-555-0192' },
        medicalHistory: ['Hypertension', 'Mild Asthma'],
        allergies: ['Penicillin']
      },
      {
        clinicId: clinic._id || clinic.id,
        patientId: 'PAT-1002',
        name: 'Anita Patel',
        email: 'anita.p@example.com',
        phone: '+1-555-0193',
        gender: 'Female',
        age: 28,
        bloodGroup: 'O+',
        address: { city: 'Metropolis', state: 'NY' },
        emergencyContact: { name: 'Vikram Patel', relationship: 'Father', phone: '+1-555-0194' },
        medicalHistory: ['Dental Cavities'],
        allergies: ['Sulfa drugs']
      },
      {
        clinicId: clinic._id || clinic.id,
        patientId: 'PAT-1003',
        name: 'David Miller',
        email: 'david.m@example.com',
        phone: '+1-555-0195',
        gender: 'Male',
        age: 52,
        bloodGroup: 'B+',
        address: { city: 'Metropolis', state: 'NY' },
        medicalHistory: ['Type 2 Diabetes'],
        allergies: []
      }
    ]);

    const patient1 = createdPatients[0];
    const patient2 = createdPatients[1];

    // Seed Demo Doctors
    const doctor1 = await Doctor.create({
      clinicId: clinic._id || clinic.id,
      name: 'Dr. Sarah Connor',
      email: 'doctor@democlinic.com',
      phone: '+1-800-555-0102',
      specialization: 'Cardiology & Internal Medicine',
      experienceYears: 12,
      consultationFee: 75,
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      slotDurationMinutes: 20,
      status: 'active'
    });

    const doctor2 = await Doctor.create({
      clinicId: clinic._id || clinic.id,
      name: 'Dr. Michael Chen',
      email: 'dr.chen@democlinic.com',
      phone: '+1-800-555-0104',
      specialization: 'Dental Surgery & Orthodontics',
      experienceYears: 8,
      consultationFee: 60,
      availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
      slotDurationMinutes: 30,
      status: 'active'
    });

    // Seed Demo Appointments
    const todayStr = new Date().toISOString().split('T')[0];

    await Appointment.create([
      {
        clinicId: clinic._id || clinic.id,
        appointmentId: 'APT-1001',
        patientId: patient1._id || patient1.id,
        patientName: patient1.name,
        patientPhone: patient1.phone,
        doctorId: doctor1._id || doctor1.id,
        doctorName: doctor1.name,
        tokenNumber: 1,
        date: todayStr,
        timeSlot: '09:30 AM',
        type: 'In-person',
        status: 'In Consultation',
        reasonForVisit: 'Routine Blood Pressure & Cardio Checkup',
        paymentStatus: 'Paid'
      },
      {
        clinicId: clinic._id || clinic.id,
        appointmentId: 'APT-1002',
        patientId: patient2._id || patient2.id,
        patientName: patient2.name,
        patientPhone: patient2.phone,
        doctorId: doctor2._id || doctor2.id,
        doctorName: doctor2.name,
        tokenNumber: 1,
        date: todayStr,
        timeSlot: '10:15 AM',
        type: 'In-person',
        status: 'Scheduled',
        reasonForVisit: 'Tooth Sensitivity & Dental Scaling',
        paymentStatus: 'Pending'
      }
    ]);

    console.log('[Seed] Demo clinic, staff, 3 patients, 2 doctors & appointments seeded successfully in Supabase!');
  } catch (error: any) {
    console.error('[Seed] Error seeding demo data in Supabase:', error.message);
  }
};

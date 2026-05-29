const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@haqms.com' },
    update: {},
    create: {
      email: 'admin@haqms.com',
      password,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  // 2. Create Receptionist
  const receptionist = await prisma.user.upsert({
    where: { email: 'reception1@haqms.com' },
    update: {},
    create: {
      email: 'reception1@haqms.com',
      password,
      name: 'Receptionist One',
      role: 'RECEPTIONIST',
    },
  });

  // 3. Create Doctor Users
  const docUser1 = await prisma.user.upsert({
    where: { email: 'doctor1@haqms.com' },
    update: {},
    create: {
      email: 'doctor1@haqms.com',
      password,
      name: 'Dr. Gregory House',
      role: 'DOCTOR',
    },
  });

  const docUser2 = await prisma.user.upsert({
    where: { email: 'doctor2@haqms.com' },
    update: {},
    create: {
      email: 'doctor2@haqms.com',
      password,
      name: 'Dr. John Watson',
      role: 'DOCTOR',
    },
  });

  const docUser3 = await prisma.user.upsert({
    where: { email: 'doctor3@haqms.com' },
    update: {},
    create: {
      email: 'doctor3@haqms.com',
      password,
      name: 'Dr. Stephen Strange',
      role: 'DOCTOR',
    },
  });

  // 4. Create linked Doctor profiles
  await prisma.doctor.upsert({
    where: { userId: docUser1.id },
    update: {},
    create: {
      userId: docUser1.id,
      name: 'Dr. Gregory House',
      specialization: 'Diagnostic Medicine',
      department: 'Diagnostics',
      experience: 15,
      consultationFee: 150,
    },
  });

  await prisma.doctor.upsert({
    where: { userId: docUser2.id },
    update: {},
    create: {
      userId: docUser2.id,
      name: 'Dr. John Watson',
      specialization: 'General Medicine',
      department: 'General Medicine',
      experience: 10,
      consultationFee: 80,
    },
  });

  await prisma.doctor.upsert({
    where: { userId: docUser3.id },
    update: {},
    create: {
      userId: docUser3.id,
      name: 'Dr. Stephen Strange',
      specialization: 'Neurosurgery',
      department: 'Surgery',
      experience: 12,
      consultationFee: 300,
    },
  });

  // 5. Create Patients
  const patient1 = await prisma.patient.upsert({
    where: { email: 'bruce@wayne.com' },
    update: {},
    create: {
      name: 'Bruce Wayne',
      email: 'bruce@wayne.com',
      phoneNumber: '555-0199',
      age: 35,
      gender: 'Male',
      medicalHistory: 'Cardiovascular risk, childhood trauma',
    },
  });

  const patient2 = await prisma.patient.upsert({
    where: { email: 'clark@dailyplanet.com' },
    update: {},
    create: {
      name: 'Clark Kent',
      email: 'clark@dailyplanet.com',
      phoneNumber: '555-0144',
      age: 32,
      gender: 'Male',
      medicalHistory: null,
    },
  });

  const patient3 = await prisma.patient.upsert({
    where: { email: 'diana@themyscira.gov' },
    update: {},
    create: {
      name: 'Diana Prince',
      email: 'diana@themyscira.gov',
      phoneNumber: '555-0188',
      age: 30,
      gender: 'Female',
      medicalHistory: 'No known chronic conditions. High physical resilience.',
    },
  });

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

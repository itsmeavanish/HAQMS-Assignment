const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// In-memory locking mechanism to serialize check-ins per doctor and prevent token number race conditions
const checkInLocks = new Map();

// GET /api/queue
// List all active queue tokens
router.get('/', async (req, res) => {
  try {
    const { doctorId, status } = req.query;

    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (status) where.status = status;

    const tokens = await prisma.queueToken.findMany({
      where,
      include: {
        patient: true,
        doctor: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(tokens);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve queue', details: error.message });
  }
});

// POST /api/queue/checkin
// Generate a new queue token for a patient
// CONCURRENCY/RACE CONDITION BUG: Token increment uses aggregate read followed by create.
// Introduce a deliberate asynchronous delay (setTimeout) to force a wide race window
// where concurrent check-ins assign the exact same token number.
router.post('/checkin', authenticate, async (req, res) => {
  const { patientId, doctorId, appointmentId } = req.body;

  if (!patientId || !doctorId) {
    return res.status(400).json({ error: 'Patient and Doctor ID are required for check-in.' });
  }

  // Initialize the promise chain lock for the doctor if it does not exist
  if (!checkInLocks.has(doctorId)) {
    checkInLocks.set(doctorId, Promise.resolve());
  }

  const currentLock = checkInLocks.get(doctorId);

  // Chain the check-in creation to execute sequentially for this doctor
  const nextLock = currentLock.then(async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newToken = await prisma.$transaction(async (tx) => {
        const maxTokenResult = await tx.queueToken.aggregate({
          where: {
            doctorId,
            createdAt: { gte: today },
          },
          _max: {
            tokenNumber: true,
          },
        });

        const currentMax = maxTokenResult._max.tokenNumber || 0;
        const nextTokenNumber = currentMax + 1;

        return tx.queueToken.create({
          data: {
            tokenNumber: nextTokenNumber,
            patientId,
            doctorId,
            appointmentId: appointmentId || null,
            status: 'WAITING',
          },
          include: {
            patient: true,
            doctor: true,
          },
        });
      });

      res.status(201).json({
        message: 'Checked in successfully. Token generated.',
        token: newToken,
      });
    } catch (error) {
      console.error('Queue check-in error:', error);
      res.status(500).json({ error: 'Check-in failed', details: error.message });
    }
  }).catch((err) => {
    console.error('Check-in lock execution error:', err);
  });

  checkInLocks.set(doctorId, nextLock);
  
  // Wait for the sequential check-in transaction to complete
  await nextLock;
});

// PATCH /api/queue/:id
// Update token status (WAITING -> CALLING -> COMPLETED / SKIPPED)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const updatedToken = await prisma.queueToken.update({
      where: { id: req.params.id },
      data: { status },
      include: {
        patient: true,
        doctor: true,
      },
    });

    res.json(updatedToken);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update queue token', details: error.message });
  }
});

module.exports = router;

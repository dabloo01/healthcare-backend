const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'medicare_pro_super_secret_key_123';

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access denied, token missing!' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token is invalid!' });
    req.user = user; // attach user info to request
    next();
  });
};
// Middleware
app.use(cors());
app.use(express.json());

// =======================
// DASHBOARD API
// =======================
app.get('/api/dashboard', async (req, res) => {
  try {
    const patientsCount = await prisma.patient.count();
    const doctorsCount = await prisma.doctor.count();
    const appointmentsCount = await prisma.appointment.count();
    const pendingBills = await prisma.bill.count({ where: { status: 'Unpaid' } });
    
    // Revenue logic (sum of paid bills)
    const paidBills = await prisma.bill.aggregate({
      _sum: { amount: true },
      where: { status: 'Paid' }
    });

    res.json({
      totalPatients: patientsCount,
      totalDoctors: doctorsCount,
      totalAppointments: appointmentsCount,
      pendingBillsCount: pendingBills,
      totalRevenue: paidBills._sum.amount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// AUTH API
// =======================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, role, email, phone, password } = req.body;
    
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) {
      return res.status(400).json({ error: 'Phone number already registered.' });
    }

    // Hash the password securely with 10 salt rounds
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { name, role, email, phone, password: hashedPassword }
    });
    
    // We do not return the hashed password in the response
    res.json({
      id: newUser.id,
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
      phone: newUser.phone
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      return res.status(401).json({ error: 'User with this phone number not found.' });
    }

    // Compare original password with the hashed password from DB
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password.' });
    }

    // Generate a secure JWT Token valid for 1 day
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return the token completely and the user info
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// PATIENTS API
// =======================
app.get('/api/patients', async (req, res) => {
  const patients = await prisma.patient.findMany({ 
    include: {
      appointments: {
        include: { doctor: true },
        orderBy: { appointmentDate: 'desc' }
      },
      bills: {
        orderBy: { date: 'desc' }
      }
    },
    orderBy: { id: 'desc' } 
  });
  res.json(patients);
});

app.post('/api/patients', async (req, res) => {
  try {
    const newPatient = await prisma.patient.create({
      data: req.body
    });
    res.json(newPatient);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create patient', details: error.message });
  }
});

// =======================
// DOCTORS API
// =======================
app.get('/api/doctors', async (req, res) => {
  const doctors = await prisma.doctor.findMany({ orderBy: { name: 'asc' } });
  res.json(doctors);
});

app.post('/api/doctors', async (req, res) => {
  try {
    const newDoctor = await prisma.doctor.create({ data: req.body });
    res.json(newDoctor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// APPOINTMENTS API
// =======================
app.get('/api/appointments', async (req, res) => {
  const appointments = await prisma.appointment.findMany({
    include: { patient: true, doctor: true },
    orderBy: { appointmentDate: 'asc' }
  });
  res.json(appointments);
});

app.post('/api/appointments', async (req, res) => {
  try {
    const data = req.body;
    // ensure date is parsed correctly
    if(data.appointmentDate) data.appointmentDate = new Date(data.appointmentDate);
    const newAppointment = await prisma.appointment.create({ data });
    res.json(newAppointment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// BILLS API
// =======================
app.get('/api/bills', async (req, res) => {
  const bills = await prisma.bill.findMany({
    include: { patient: true },
    orderBy: { date: 'desc' }
  });
  res.json(bills);
});

app.post('/api/bills', async (req, res) => {
  try {
    const data = req.body;
    const newBill = await prisma.bill.create({ data });
    res.json(newBill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// =======================
// PRESCRIPTIONS API
// =======================
app.get('/api/prescriptions', async (req, res) => {
  const prescriptions = await prisma.prescription.findMany({
    include: { patient: true, doctor: true, appointment: true },
    orderBy: { date: 'desc' }
  });
  res.json(prescriptions);
});

app.post('/api/prescriptions', async (req, res) => {
  try {
    const data = req.body;
    const newPrescription = await prisma.prescription.create({ data });
    res.json(newPrescription);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// LAB REPORTS API
// =======================
app.get('/api/lab-reports', async (req, res) => {
  const reports = await prisma.labReport.findMany({
    include: { patient: true },
    orderBy: { date: 'desc' }
  });
  res.json(reports);
});

app.post('/api/lab-reports', async (req, res) => {
  try {
    const data = req.body;
    const newReport = await prisma.labReport.create({ data });
    res.json(newReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// INVENTORY API
// =======================
app.get('/api/inventory', async (req, res) => {
  const inventory = await prisma.inventory.findMany({
    orderBy: { itemName: 'asc' }
  });
  res.json(inventory);
});

app.post('/api/inventory', async (req, res) => {
  try {
    const data = req.body;
    if(data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    const newItem = await prisma.inventory.create({ data });
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    if(data.expiryDate) data.expiryDate = new Date(data.expiryDate);
    const updated = await prisma.inventory.update({
      where: { id: parseInt(id) },
      data
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve
app.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
module.exports = app;

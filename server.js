require('dotenv').config();

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'stem_iot';

if (!mongoUri) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and add your MongoDB Atlas URI.');
  process.exit(1);
}

const mongoClient = new MongoClient(mongoUri);
let customers;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function publicCustomer(customer) {
  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    role: customer.role,
    status: customer.status
  };
}

app.get('/api/health', async (req, res) => {
  try {
    await mongoClient.db(databaseName).command({ ping: 1 });
    res.json({ ok: true, database: databaseName });
  } catch (error) {
    res.status(503).json({ ok: false, message: 'Không kết nối được MongoDB.' });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !phone || !email || password.length < 6) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin và mật khẩu tối thiểu 6 ký tự.' });
    }

    const existingCustomer = await customers.findOne({ email });
    if (existingCustomer) {
      return res.status(409).json({ message: 'Email này đã được đăng ký.' });
    }

    const now = new Date();
    const customer = {
      name,
      phone,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'customer',
      status: 'active',
      orderCount: 0,
      spent: 0,
      createdAt: now,
      updatedAt: now
    };

    const result = await customers.insertOne(customer);
    customer._id = result.insertedId;
    res.status(201).json({ customer: publicCustomer(customer) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Không thể tạo tài khoản lúc này.' });
  }
});

app.post('/api/customers/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const customer = await customers.findOne({ email });

    if (!customer || customer.status !== 'active' || !(await bcrypt.compare(password, customer.passwordHash))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
    }

    res.json({ customer: publicCustomer(customer) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Không thể đăng nhập lúc này.' });
  }
});

async function start() {
  await mongoClient.connect();
  const database = mongoClient.db(databaseName);
  customers = database.collection('customers');
  await customers.createIndex({ email: 1 }, { unique: true });
  app.listen(port, () => console.log(`STEM IoT Shop: http://localhost:${port}`));
}

start().catch((error) => {
  console.error('MongoDB startup error:', error.message);
  process.exit(1);
});

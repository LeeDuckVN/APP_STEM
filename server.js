require('dotenv').config();

const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'stem_iot';
let mongoClient;
let customers;
let storeData;
let databaseReady;

app.use(express.json({ limit: '25mb' }));
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

async function connectDatabase() {
  if (databaseReady) return databaseReady;
  databaseReady = (async () => {
    if (!mongoUri) throw new Error('MONGODB_URI is missing.');
    mongoClient = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 10000 });
    await mongoClient.connect();
    const database = mongoClient.db(databaseName);
    customers = database.collection('customers');
    storeData = database.collection('store_data');
    await customers.createIndex({ email: 1 }, { unique: true });
    await storeData.createIndex({ key: 1 }, { unique: true });
  })().catch((error) => {
    databaseReady = null;
    throw error;
  });
  return databaseReady;
}

const STORE_COLLECTIONS = ['products', 'orders', 'users', 'cart'];

async function readStoreData() {
  await connectDatabase();
  const records = await storeData.find({ key: { $in: STORE_COLLECTIONS } }).toArray();
  const result = Object.fromEntries(STORE_COLLECTIONS.map((key) => [key, []]));
  records.forEach((record) => { result[record.key] = record.value || []; });
  return result;
}

async function writeStoreData(data) {
  await connectDatabase();
  const operations = STORE_COLLECTIONS.map((key) => ({
    updateOne: { filter: { key }, update: { $set: { key, value: Array.isArray(data[key]) ? data[key] : [] } }, upsert: true }
  }));
  await storeData.bulkWrite(operations);
  return readStoreData();
}

app.get('/api/store', async (req, res) => {
  try {
    res.json({ ok: true, data: await readStoreData() });
  } catch (error) {
    console.error('Store read error:', error.message);
    res.status(503).json({ ok: false, message: 'Không đọc được dữ liệu MongoDB.' });
  }
});

app.put('/api/store', async (req, res) => {
  try {
    res.json({ ok: true, data: await writeStoreData(req.body || {}) });
  } catch (error) {
    console.error('Store write error:', error.message);
    res.status(503).json({ ok: false, message: 'Không lưu được dữ liệu vào MongoDB.' });
  }
});

app.get('/api/store/audit', async (req, res) => {
  try {
    const data = await readStoreData();
    const images = data.products.filter((product) => product.imageData || product.image).length;
    res.json({
      ok: true,
      collections: {
        ...Object.fromEntries(STORE_COLLECTIONS.map((key) => [key, data[key].length])),
        customers: await customers.countDocuments()
      },
      productsWithImages: images
    });
  } catch (error) {
    res.status(503).json({ ok: false, message: 'Không kiểm tra được dữ liệu MongoDB.' });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await connectDatabase();
    await mongoClient.db(databaseName).command({ ping: 1 });
    res.json({ ok: true, database: databaseName });
  } catch (error) {
    res.status(503).json({ ok: false, message: 'Không kết nối được MongoDB.' });
  }
});

app.post('/api/customers/register', async (req, res) => {
  try {
    await connectDatabase();
    const name = String(req.body.name || '').trim();
    const phone = String(req.body.phone || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    if (!name || !phone || !email || password.length < 6) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ thông tin và mật khẩu tối thiểu 6 ký tự.' });
    }
    if (await customers.findOne({ email })) {
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
    await connectDatabase();
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
  app.listen(port, () => {
    console.log(`STEM IoT Shop: http://localhost:${port}`);
    connectDatabase().catch((error) => {
      console.error('MongoDB connection warning:', error.message);
    });
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('MongoDB startup error:', error.message);
    process.exit(1);
  });
}

module.exports = app;

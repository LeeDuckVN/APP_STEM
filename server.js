require('dotenv').config();

const path = require('path');
const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');

const app = express();
const port = Number(process.env.PORT) || 3000;
const mongoUri = process.env.MONGODB_URI;
const databaseName = process.env.MONGODB_DB || 'stem_iot';
let mongoClient;
let customers;
let storeData;
let warrantyClaims;
let databaseReady;
const verificationCodeLifetimeMs = 10 * 60 * 1000;
let mailTransport;

function getMailTransport() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP_HOST, SMTP_USER và SMTP_PASS chưa được cấu hình.');
  }
  if (!mailTransport) {
    mailTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return mailTransport;
}

function createVerificationCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashVerificationCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
}

async function sendVerificationEmail({ email, name, code, type }) {
  const isReset = type === 'reset';
  const subject = isReset ? 'Mã đổi mật khẩu STEM IoT Shop' : 'Xác thực email đăng ký STEM IoT Shop';
  const intro = isReset
    ? 'Bạn vừa yêu cầu đổi mật khẩu. Nhập mã dưới đây để tiếp tục:'
    : 'Cảm ơn bạn đã đăng ký. Nhập mã dưới đây để xác nhận email của bạn:';
  await getMailTransport().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject,
    text: `Xin chào ${name || 'bạn'},\n\n${intro}\n\nMã xác thực: ${code}\nMã có hiệu lực trong 10 phút và chỉ sử dụng một lần.\n\nSTEM IoT Shop`,
    html: `<p>Xin chào ${name || 'bạn'},</p><p>${intro}</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Mã có hiệu lực trong 10 phút và chỉ sử dụng một lần.</p><p>STEM IoT Shop</p>`
  });
}

// CORS middleware hỗ trợ mở từ Live Server (:5500, :5501) hoặc công cụ phát triển khác
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '25mb' }));
app.use(express.static(path.join(__dirname)));

function publicCustomer(customer) {
  return {
    id: customer._id.toString(),
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    role: customer.role,
    status: customer.status,
    emailVerified: customer.emailVerified !== false
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
    warrantyClaims = database.collection('warranty_claims');
    await customers.createIndex({ email: 1 }, { unique: true });
    await storeData.createIndex({ key: 1 }, { unique: true });
    await warrantyClaims.createIndex({ createdAt: -1 });
    // Clean up legacy shared cart from MongoDB
    await storeData.deleteOne({ key: 'cart' }).catch(() => { });
  })().catch((error) => {
    databaseReady = null;
    throw error;
  });
  return databaseReady;
}

const STORE_COLLECTIONS = ['products', 'orders', 'users', 'quotes'];

async function readStoreData() {
  await connectDatabase();
  const records = await storeData.find({ key: { $in: STORE_COLLECTIONS } }).toArray();
  const result = Object.fromEntries(STORE_COLLECTIONS.map((key) => [key, []]));
  records.forEach((record) => { result[record.key] = record.value || []; });

  // Tự động hợp nhất tài khoản khách hàng đã đăng ký vào danh sách users
  try {
    const registeredCustomers = await customers.find().sort({ createdAt: -1 }).toArray();
    const existingEmails = new Set(result.users.map((u) => String(u.email || '').toLowerCase()).filter(Boolean));
    const existingPhones = new Set(result.users.map((u) => String(u.phone || '').trim()).filter(Boolean));

    registeredCustomers.forEach((c) => {
      const email = String(c.email || '').toLowerCase();
      const phone = String(c.phone || '').trim();
      if (!existingEmails.has(email) && (!phone || !existingPhones.has(phone))) {
        result.users.push({
          id: c._id.toString(),
          name: c.name,
          email: c.email,
          phone: c.phone,
          role: c.role || 'customer',
          status: c.status || 'active',
          orderCount: c.orderCount || 0,
          spent: c.spent || 0,
          createdAt: c.createdAt ? new Date(c.createdAt).getTime() : Date.now(),
          isRegistered: true
        });
      }
    });
  } catch (err) {
    console.warn('Merge customers warning:', err.message);
  }

  return result;
}

async function writeStoreData(data) {
  await connectDatabase();
  const targetKeys = STORE_COLLECTIONS.filter((key) => Array.isArray(data[key]));
  if (targetKeys.length > 0) {
    const operations = targetKeys.map((key) => ({
      updateOne: { filter: { key }, update: { $set: { key, value: data[key] } }, upsert: true }
    }));
    await storeData.bulkWrite(operations);
  }
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

async function googleTranslateText(text, targetLang = 'en', sourceLang = 'vi') {
  if (!text || !String(text).trim()) return '';
  const query = encodeURIComponent(String(text).trim());
  const url = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=${sourceLang}&tl=${targetLang}&q=${query}`;
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  if (!response.ok) throw new Error(`Google Translate error: ${response.status}`);
  const data = await response.json();
  if (Array.isArray(data) && typeof data[0] === 'string') return data[0];
  if (Array.isArray(data) && Array.isArray(data[0])) return data[0].map((x) => x[0]).join('');
  return String(data);
}

app.post('/api/translate', async (req, res) => {
  try {
    const { text, fields, sourceLang = 'vi', targetLangs = ['en', 'ja'] } = req.body || {};

    // Dịch đồng loạt các trường sản phẩm (name, badge, description)
    if (fields && typeof fields === 'object') {
      const result = {};
      for (const [key, val] of Object.entries(fields)) {
        const str = typeof val === 'string' ? val : (val?.vi || val?.en || '');
        if (!str || !str.trim()) {
          result[key] = { vi: '', en: '', ja: '' };
          continue;
        }
        result[key] = { vi: str };
        await Promise.all(
          targetLangs.map(async (tl) => {
            try {
              result[key][tl] = await googleTranslateText(str, tl, sourceLang);
            } catch (e) {
              console.warn(`Translation error for ${key} [${tl}]:`, e.message);
              result[key][tl] = str;
            }
          })
        );
      }
      return res.json({ ok: true, data: result });
    }

    // Dịch một đoạn text đơn lẻ
    if (text && String(text).trim()) {
      const translations = { [sourceLang]: text };
      await Promise.all(
        targetLangs.map(async (tl) => {
          try {
            translations[tl] = await googleTranslateText(text, tl, sourceLang);
          } catch (e) {
            console.warn(`Translation error [${tl}]:`, e.message);
            translations[tl] = text;
          }
        })
      );
      return res.json({ ok: true, data: translations });
    }

    res.status(400).json({ ok: false, message: 'Thiếu nội dung text hoặc fields cần dịch.' });
  } catch (err) {
    console.error('Translation route error:', err.message);
    res.status(500).json({ ok: false, message: 'Lỗi dịch thuật: ' + err.message });
  }
});

// Endpoint dịch toàn bộ catalog sản phẩm và lưu trực tiếp vào MongoDB Atlas
app.post('/api/products/translate-all', async (req, res) => {
  try {
    await connectDatabase();
    const data = await readStoreData();
    const products = Array.isArray(data.products) ? data.products : [];
    const force = !!req.body?.force;
    let translatedCount = 0;

    await Promise.all(products.map(async (p) => {
      const viName = typeof p.name === 'string' ? p.name : (p.name?.vi || '');
      const viBadge = typeof p.badge === 'string' ? p.badge : (p.badge?.vi || '');
      const viDesc = typeof p.description === 'string' ? p.description : (p.description?.vi || '');

      const currentEnName = typeof p.name === 'object' && p.name?.en ? p.name.en : '';
      const currentJaName = typeof p.name === 'object' && p.name?.ja ? p.name.ja : '';
      const currentEnDesc = typeof p.description === 'object' && p.description?.en ? p.description.en : '';
      const currentJaDesc = typeof p.description === 'object' && p.description?.ja ? p.description.ja : '';

      const needEn = force || !currentEnName || !currentEnDesc;
      const needJa = force || !currentJaName || !currentJaDesc;

      if (needEn || needJa) {
        try {
          const [enName, jaName, enBadge, jaBadge, enDesc, jaDesc] = await Promise.all([
            needEn && viName ? googleTranslateText(viName, 'en') : currentEnName,
            needJa && viName ? googleTranslateText(viName, 'ja') : currentJaName,
            needEn && viBadge ? googleTranslateText(viBadge, 'en') : (p.badge?.en || viBadge),
            needJa && viBadge ? googleTranslateText(viBadge, 'ja') : (p.badge?.ja || viBadge),
            needEn && viDesc ? googleTranslateText(viDesc, 'en') : (p.description?.en || viDesc),
            needJa && viDesc ? googleTranslateText(viDesc, 'ja') : (p.description?.ja || viDesc)
          ]);

          p.name = { vi: viName, en: enName || viName, ja: jaName || viName };
          p.badge = { vi: viBadge, en: enBadge || viBadge, ja: jaBadge || viBadge };
          p.description = { vi: viDesc, en: enDesc || viDesc, ja: jaDesc || viDesc };
          translatedCount++;
        } catch (e) {
          console.warn(`Error translating product ${p.id}:`, e.message);
        }
      }
    }));

    // Lưu trực tiếp vào MongoDB Atlas collection store_data
    await storeData.updateOne(
      { key: 'products' },
      { $set: { key: 'products', value: products } },
      { upsert: true }
    );

    console.log(`[MongoDB Atlas] Translated and saved ${translatedCount} products successfully.`);
    res.json({ ok: true, count: translatedCount, products });
  } catch (err) {
    console.error('Translate all products error:', err.message);
    res.status(500).json({ ok: false, message: 'Lỗi dịch catalog: ' + err.message });
  }
});

// ============== WARRANTY CLAIMS ==============
app.post('/api/warranty-claims', async (req, res) => {
  try {
    await connectDatabase();
    const { orderCode, phone, product, reason, notes } = req.body || {};
    if (!orderCode || !phone || !product || !notes) {
      return res.status(400).json({ ok: false, message: 'Vui lòng điền đầy đủ thông tin bắt buộc.' });
    }
    const claim = {
      id: 'WC-' + Date.now().toString(36).toUpperCase(),
      orderCode: String(orderCode).trim(),
      phone: String(phone).trim(),
      product: String(product).trim(),
      reason: String(reason || 'other').trim(),
      notes: String(notes).trim(),
      status: 'pending',
      adminNotes: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await warrantyClaims.insertOne(claim);
    console.log(`[Warranty] New claim ${claim.id} from ${claim.phone}`);
    res.status(201).json({ ok: true, claim });
  } catch (error) {
    console.error('Warranty claim error:', error.message);
    res.status(500).json({ ok: false, message: 'Không lưu được phiếu bảo hành.' });
  }
});

app.get('/api/warranty-claims', async (req, res) => {
  try {
    await connectDatabase();
    const list = await warrantyClaims.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray();
    res.json({ ok: true, data: list });
  } catch (error) {
    console.error('Warranty claims list error:', error.message);
    res.status(500).json({ ok: false, message: 'Không tải được danh sách phiếu bảo hành.' });
  }
});

app.put('/api/warranty-claims/:id', async (req, res) => {
  try {
    await connectDatabase();
    const { id } = req.params;
    const { status, adminNotes } = req.body || {};
    const update = { updatedAt: Date.now() };
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    const result = await warrantyClaims.updateOne({ id }, { $set: update });
    if (result.matchedCount === 0) return res.status(404).json({ ok: false, message: 'Không tìm thấy phiếu bảo hành.' });
    res.json({ ok: true });
  } catch (error) {
    console.error('Warranty claim update error:', error.message);
    res.status(500).json({ ok: false, message: 'Không cập nhật được phiếu bảo hành.' });
  }
});

app.delete('/api/warranty-claims/:id', async (req, res) => {
  try {
    await connectDatabase();
    const { id } = req.params;
    await warrantyClaims.deleteOne({ id });
    res.json({ ok: true });
  } catch (error) {
    console.error('Warranty claim delete error:', error.message);
    res.status(500).json({ ok: false, message: 'Không xóa được phiếu bảo hành.' });
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
    const verificationCode = createVerificationCode();
    const customer = {
      name,
      phone,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      role: 'customer',
      status: 'active',
      emailVerified: false,
      verificationCodeHash: hashVerificationCode(verificationCode),
      verificationCodeExpiresAt: new Date(Date.now() + verificationCodeLifetimeMs),
      orderCount: 0,
      spent: 0,
      createdAt: now,
      updatedAt: now
    };
    const result = await customers.insertOne(customer);
    customer._id = result.insertedId;
    try {
      await sendVerificationEmail({ email, name, code: verificationCode, type: 'verify' });
    } catch (mailError) {
      await customers.deleteOne({ _id: result.insertedId });
      throw mailError;
    }
    res.status(201).json({ message: 'Mã xác thực đã được gửi tới email của bạn.', customer: publicCustomer(customer) });
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
    if (customer.emailVerified === false) {
      return res.status(403).json({ message: 'Vui lòng xác thực email trước khi đăng nhập.', needsVerification: true });
    }
    res.json({ customer: publicCustomer(customer) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Không thể đăng nhập lúc này.' });
  }
});

app.post('/api/customers/verify-email', async (req, res) => {
  try {
    await connectDatabase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const customer = await customers.findOne({ email });
    if (!customer || customer.emailVerified !== false || !customer.verificationCodeHash ||
      !customer.verificationCodeExpiresAt || new Date(customer.verificationCodeExpiresAt) < new Date() ||
      hashVerificationCode(code) !== customer.verificationCodeHash) {
      return res.status(400).json({ message: 'Mã xác thực không đúng hoặc đã hết hạn.' });
    }
    await customers.updateOne({ _id: customer._id }, {
      $set: { emailVerified: true, updatedAt: new Date() },
      $unset: { verificationCodeHash: '', verificationCodeExpiresAt: '' }
    });
    customer.emailVerified = true;
    res.json({ message: 'Email đã được xác thực.', customer: publicCustomer(customer) });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Không thể xác thực email lúc này.' });
  }
});

app.post('/api/customers/resend-verification', async (req, res) => {
  try {
    await connectDatabase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const customer = await customers.findOne({ email });
    if (!customer || customer.emailVerified !== false) {
      return res.json({ message: 'Nếu email chưa xác thực, mã mới đã được gửi.' });
    }
    const code = createVerificationCode();
    await sendVerificationEmail({ email, name: customer.name, code, type: 'verify' });
    await customers.updateOne({ _id: customer._id }, {
      $set: { verificationCodeHash: hashVerificationCode(code), verificationCodeExpiresAt: new Date(Date.now() + verificationCodeLifetimeMs) }
    });
    res.json({ message: 'Mã xác thực mới đã được gửi.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Không thể gửi lại mã xác thực lúc này.' });
  }
});

app.post('/api/customers/forgot-password', async (req, res) => {
  try {
    await connectDatabase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const customer = await customers.findOne({ email });
    if (customer) {
      const code = createVerificationCode();
      await sendVerificationEmail({ email, name: customer.name, code, type: 'reset' });
      await customers.updateOne({ _id: customer._id }, {
        $set: { resetCodeHash: hashVerificationCode(code), resetCodeExpiresAt: new Date(Date.now() + verificationCodeLifetimeMs) }
      });
    }
    res.json({ message: 'Nếu email tồn tại, mã đổi mật khẩu đã được gửi.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Không thể gửi mã đổi mật khẩu lúc này.' });
  }
});

app.post('/api/customers/reset-password', async (req, res) => {
  try {
    await connectDatabase();
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = String(req.body.password || '');
    const customer = await customers.findOne({ email });
    if (!customer || password.length < 6 || !customer.resetCodeHash ||
      !customer.resetCodeExpiresAt || new Date(customer.resetCodeExpiresAt) < new Date() ||
      hashVerificationCode(code) !== customer.resetCodeHash) {
      return res.status(400).json({ message: 'Mã không đúng, đã hết hạn hoặc mật khẩu chưa đủ 6 ký tự.' });
    }
    await customers.updateOne({ _id: customer._id }, {
      $set: { passwordHash: await bcrypt.hash(password, 12), updatedAt: new Date() },
      $unset: { resetCodeHash: '', resetCodeExpiresAt: '' }
    });
    res.json({ message: 'Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Không thể đổi mật khẩu lúc này.' });
  }
});

app.get('/api/customers', async (req, res) => {
  try {
    await connectDatabase();
    const list = await customers.find().sort({ createdAt: -1 }).toArray();
    res.json({ ok: true, data: list.map(publicCustomer) });
  } catch (error) {
    console.error('Customers list error:', error);
    res.status(500).json({ ok: false, message: 'Không thể tải danh sách khách hàng.' });
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

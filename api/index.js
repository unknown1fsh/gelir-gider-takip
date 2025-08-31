const express = require('express');
const { neon } = require('@neondatabase/serverless');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();

// CORS ayarları
app.use(cors({
  origin: [
    'https://gelir-gider-takip-weld.vercel.app',
    'https://gelir-gider-takip-3flk6d5ja-unknown1fshs-projects.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Neon veritabanı bağlantısı
const sql = neon(process.env.DATABASE_URL);

// Neon serverless driver için query wrapper
const query = async (sqlQuery, params = []) => {
  try {
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await sql.query(convertedSql, params);
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token',
        code: 'TOKEN_INVALID'
      });
    }
    req.user = user;
    next();
  });
};

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API çalışıyor!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Kullanıcı kaydı
app.post('/auth/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;

    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar zorunludur' 
      });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO users (username, email, password_hash, full_name) 
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `;

    const result = await query(insertQuery, [
      username, email, passwordHash, full_name
    ]);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla kaydedildi',
      user_id: result.rows[0].id
    });

  } catch (error) {
    if (error.code === '23505') {
      if (error.message.includes('username')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bu kullanıcı adı zaten kullanılıyor' 
        });
      } else if (error.message.includes('email')) {
        return res.status(400).json({ 
          success: false, 
          message: 'Bu e-posta adresi zaten kullanılıyor' 
        });
      }
    }
    
    console.error('Kullanıcı kayıt hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Kullanıcı kaydedilirken hata oluştu' 
    });
  }
});

// Kullanıcı girişi
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kullanıcı adı ve şifre zorunludur' 
      });
    }

    const selectQuery = 'SELECT * FROM users WHERE username = $1 AND is_active = TRUE';
    const result = await query(selectQuery, [username]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Geçersiz kullanıcı adı veya şifre' 
      });
    }

    const token = jwt.sign(
      { 
        user_id: user.id, 
        username: user.username, 
        email: user.email,
        full_name: user.full_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name
      }
    });

  } catch (error) {
    console.error('Kullanıcı giriş hatası:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Giriş yapılırken hata oluştu',
      error: error.message
    });
  }
});

// Kullanıcı profilini getir
app.get('/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Ana sayfa
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gelir Gider Takip API',
    version: '1.0.0',
    endpoints: {
      test: '/test',
      auth: '/auth/*'
    }
  });
});

// Vercel serverless function export
module.exports = (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Express app'i çağır
  app(req, res);
};

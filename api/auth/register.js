const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Neon veritabanı bağlantısı
const sql = neon(process.env.DATABASE_URL);

// Neon serverless driver için query wrapper
const query = async (sqlQuery, params = []) => {
  try {
    // MySQL ? placeholder'larını PostgreSQL $1, $2 formatına çevir
    let paramIndex = 1;
    const convertedSql = sqlQuery.replace(/\?/g, () => `$${paramIndex++}`);
    const result = await sql.query(convertedSql, params);
    return { rows: result, rowCount: result.length };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

module.exports = async (req, res) => {
  // CORS headers
  const allowedOrigins = [
    'https://gelir-gider-takip-weld.vercel.app',
    'https://gelir-gider-takip-3flk6d5ja-unknown1fshs-projects.vercel.app',
    'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { username, email, password, full_name } = req.body;

    // Gerekli alanları kontrol et
    if (!username || !email || !password || !full_name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tüm alanlar zorunludur' 
      });
    }

    // Şifreyi hash'le
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına ekle
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
    if (error.code === '23505') { // PostgreSQL unique constraint violation
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
};

require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  host: process.env.DB_HOST || 'aws-1-sa-east-1.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'postgres',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database successfully via pooler!');

    const createTablesQuery = `
      CREATE TABLE IF NOT EXISTS bookings (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        servico TEXT,
        data DATE,
        horario TEXT,
        mensagem TEXT,
        status TEXT DEFAULT 'pending'
      );

      CREATE TABLE IF NOT EXISTS analytics (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        event TEXT NOT NULL,
        path TEXT,
        referrer TEXT,
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS leads (
        id BIGSERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        mensagem TEXT
      );
    `;

    await client.query(createTablesQuery);
    console.log('Tables "bookings", "analytics", "leads" successfully verified/created!');

  } catch (err) {
    console.error('Error executing query:', err);
  } finally {
    await client.end();
  }
}

main();

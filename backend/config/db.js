const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

console.log('Attempting DB connection with user:', process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

const initializeSchema = async () => {
  await pool.query('CREATE EXTENSION IF NOT EXISTS pgcrypto;');
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      raw_bio TEXT,
      profile_summary TEXT,
      goals JSONB NOT NULL DEFAULT '[]'::jsonb,
      skills JSONB NOT NULL DEFAULT '[]'::jsonb,
      interests JSONB NOT NULL DEFAULT '[]'::jsonb,
      faculty TEXT,
      course TEXT,
      academic_year TEXT,
      profile_visibility TEXT NOT NULL DEFAULT 'public',
      profile_photo_url TEXT,
      app_language TEXT NOT NULL DEFAULT 'en',
      preferred_chat_language TEXT NOT NULL DEFAULT 'auto',
      intensity_level TEXT,
      traits vector(3),
      embedding vector(12),
      is_onboarded BOOLEAN DEFAULT false
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS crews (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      purpose TEXT,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS crew_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      crew_id UUID REFERENCES crews(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, crew_id)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS connections (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      responded_at TIMESTAMP,
      CHECK (requester_id <> receiver_id)
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS connections_unique_pair_idx
    ON connections (
      LEAST(requester_id::text, receiver_id::text),
      GREATEST(requester_id::text, receiver_id::text)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CHECK (sender_id <> receiver_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS messages_participants_created_at_idx
    ON messages (sender_id, receiver_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
      due_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      location TEXT,
      event_date TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_achieved BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS crew_activity (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      crew_id UUID NOT NULL REFERENCES crews(id) ON DELETE CASCADE,
      actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action_type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id UUID,
      summary TEXT NOT NULL,
      meta JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS crew_activity_crew_created_at_idx
    ON crew_activity (crew_id, created_at DESC);
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT,
      entity_type TEXT,
      entity_id UUID,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS notifications_user_created_at_idx
    ON notifications (user_id, created_at DESC);
  `);

  await pool.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS raw_bio TEXT,
    ADD COLUMN IF NOT EXISTS profile_summary TEXT,
    ADD COLUMN IF NOT EXISTS goals JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS interests JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS embedding vector(12),
    ADD COLUMN IF NOT EXISTS faculty TEXT,
    ADD COLUMN IF NOT EXISTS course TEXT,
    ADD COLUMN IF NOT EXISTS academic_year TEXT,
    ADD COLUMN IF NOT EXISTS profile_visibility TEXT NOT NULL DEFAULT 'public',
    ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
    ADD COLUMN IF NOT EXISTS app_language TEXT NOT NULL DEFAULT 'en',
    ADD COLUMN IF NOT EXISTS preferred_chat_language TEXT NOT NULL DEFAULT 'auto';
  `);

  await pool.query(`
    ALTER TABLE crew_members
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
  `);
};

module.exports = {
  initializeSchema,
  query: (text, params) => pool.query(text, params),
};

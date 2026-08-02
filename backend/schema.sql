CREATE TABLE IF NOT EXISTS carteles (
  id SERIAL PRIMARY KEY,
  categoria VARCHAR(60) NOT NULL,
  nombre VARCHAR(200) DEFAULT '',
  mime_type VARCHAR(50) DEFAULT 'image/png',
  imagen BYTEA NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carteles_categoria ON carteles(categoria);

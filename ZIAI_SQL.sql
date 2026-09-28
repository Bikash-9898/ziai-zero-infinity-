CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    username TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL,
    status TEXT NOT NULL, -- active, canceled, expired
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

CREATE TABLE usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tokens_used BIGINT DEFAULT 0,
    request_count INT DEFAULT 0,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usage_user_id ON usage(user_id);
CREATE INDEX idx_usage_period ON usage(period_start, period_end);

CREATE TABLE ai_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    model TEXT NOT NULL,
    tokens_input INT,
    tokens_output INT,
    cost NUMERIC(10,6),
    latency_ms INT,
    status TEXT DEFAULT 'success', -- success, error
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_requests_user_id ON ai_requests(user_id);
CREATE INDEX idx_ai_requests_created_at ON ai_requests(created_at);
CREATE INDEX idx_ai_requests_model ON ai_requests(model);

CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT,
    size_bytes BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_files_user_id ON files(user_id);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL, -- openai, anthropic
    api_key_encrypted TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);

CREATE INDEX idx_ai_requests_user_time 
ON ai_requests(user_id, created_at DESC);

CREATE INDEX idx_messages_chat_time 
ON messages(chat_id, created_at ASC);

CREATE INDEX idx_active_subscription 
ON subscriptions(user_id) 
WHERE status = 'active';

CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Match the type in the 'users' table
    title VARCHAR(255) DEFAULT 'New Chat',
    model VARCHAR(255) DEFAULT 'llama3-8b-8192',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL, -- e.g., 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

CREATE TABLE image_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  model VARCHAR(100) DEFAULT 'flux',
  width INTEGER DEFAULT 1024,
  height INTEGER DEFAULT 1024,
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  credits_used DECIMAL(10,2) DEFAULT 0,
  generation_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE image_models (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  provider VARCHAR(50),
  credits_per_image DECIMAL,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO image_models VALUES
  ('flux',  'FLUX.1',               'pollinations', 1.0, true),
  ('turbo', 'SDXL Turbo',           'pollinations', 0.5, true),
  ('sdxl',  'Stable Diffusion XL',  'huggingface',  1.0, true);



ALTER TABLE image_generations 
  ALTER COLUMN user_id TYPE VARCHAR(255);

-- Drop the foreign key constraint if it exists
ALTER TABLE image_generations 
  DROP CONSTRAINT IF EXISTS image_generations_user_id_fkey;


CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,           -- 'esewa' | 'khalti'
    plan TEXT NOT NULL,               -- 'basic' | 'pro' | 'enterprise'
    amount NUMERIC(10,2) NOT NULL,    -- in NPR
    currency TEXT DEFAULT 'NPR',
    status TEXT DEFAULT 'pending',    -- pending | success | failed | refunded
    transaction_id TEXT,              -- from provider
    ref_id TEXT,                      -- internal ref
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ADD plan limits table
CREATE TABLE plan_limits (
    plan TEXT PRIMARY KEY,
    tokens_per_month BIGINT NOT NULL,
    requests_per_month INT NOT NULL,
    image_generations_per_month INT NOT NULL,
    price_npr NUMERIC(10,2) NOT NULL
);

INSERT INTO plan_limits VALUES
  ('free',       100000,  500,  10,  0),
  ('basic',      1000000, 5000, 100, 499),
  ('pro',        5000000, 25000,500, 1499),
  ('enterprise', -1,      -1,   -1,  4999);

/*
  # Initialize CLINIC-AI 24H Database Schema

  This migration sets up the complete database structure for the CLINIC-AI 24H application,
  a clinical support assistant for massage therapists, chiropractors, and acupuncturists.

  1. New Tables
    - `profiles`: User profile data with professional information
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text)
      - `profession` (text: 'massoterapist', 'chiropractor', 'acupuncturist', 'other')
      - `avatar_url` (text)
      - `plan` (text: 'free', 'premium', 'professional')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `conversations`: Chat conversation sessions
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `summary` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `messages`: Individual chat messages within conversations
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations)
      - `user_id` (uuid, references profiles)
      - `content` (text)
      - `is_bot` (boolean)
      - `metadata` (jsonb - stores additional info like detected topics, confidence)
      - `created_at` (timestamp)

    - `clinical_topics`: Predefined clinical topics for quick reference
      - `id` (uuid, primary key)
      - `category` (text: 'massotherapy', 'chiropractic', 'acupuncture', 'anatomy')
      - `title` (text)
      - `description` (text)
      - `content` (text)
      - `keywords` (array of text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
    - Clinical topics are readable by all authenticated users
    - Proper ownership checks on all operations

  3. Performance
    - Indexes on foreign keys (user_id, conversation_id)
    - Indexes on timestamps for efficient sorting
    - Index on category for clinical topics filtering
*/

-- ==================== Profiles Table ====================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text DEFAULT '',
  profession text DEFAULT 'other' CHECK (profession IN ('massoterapist', 'chiropractor', 'acupuncturist', 'other')),
  avatar_url text DEFAULT '',
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'premium', 'professional')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ==================== Conversations Table ====================

CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text DEFAULT 'Nova Conversa',
  summary text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==================== Messages Table ====================

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_bot boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages in own conversations"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==================== Clinical Topics Table ====================

CREATE TABLE IF NOT EXISTS clinical_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('massotherapy', 'chiropractic', 'acupuncture', 'anatomy')),
  title text NOT NULL,
  description text DEFAULT '',
  content text NOT NULL,
  keywords text[] DEFAULT '{}'::text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clinical_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clinical topics"
  ON clinical_topics FOR SELECT
  TO authenticated
  USING (true);

-- ==================== Performance Indexes ====================

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clinical_topics_category ON clinical_topics(category);

-- ==================== Trigger for updated_at ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== Seed Clinical Topics Data ====================

INSERT INTO clinical_topics (category, title, description, content, keywords) VALUES
('massotherapy', 'Massagem Sueca', 
 'Técnica clássica de massagem para relaxamento', 
 'A massagem sueca é ideal para relaxamento muscular geral. Consiste em movimentos longos e deslizantes (effleurage), amassamento (petrissage), fricção, tapotamento e vibração. Duração recomendada: 50-60 minutos. Indicada para estresse, tensão muscular leve e melhora da circulação.',
 ARRAY['relaxamento', 'classica', ' sueca', ' circulação']),

('massotherapy', 'Trigger Points', 
 'Tratamento de pontos-gatilho miofasciais', 
 'Pontos-gatilho são áreas hiperirritáveis em bandas de músculo esquelético. Aplicação de pressão sustentada (10-30 segundos) no ponto-gatilho. Repetir 3-4 vezes. Pode causar dor referida característica. Contraindicado em processos inflamatórios agudos.',
 ARRAY['pontos-gatilho', 'miofascial', ' dor referida']),

('chiropractic', 'Ajuste Cervical', 
 'Técnicas de ajuste para coluna cervical', 
 'Ajustes cervicais são indicados para cervicalgia, tensão muscular e limitação de movimento. Técnicas: diversified, drop table, activator. Avaliar contraindicações: instabilidade vertebral, processo inflamatório agudo, osteoporose avançada. Aplicar com precisão e controle.',
 ARRAY['cervical', 'pescoco', ' diversified', ' cervicalgia']),

('chiropractic', 'Ajuste Lombar', 
 'Técnicas de ajuste para coluna lombar', 
 'Ajustes lombares para lombalgia e disfunção vertebro-pélvica. Avaliar grau de mobilidade e presença de hérnias. Técnicas: diversified, drop table (pelve), flexion-distraction para discopatias. Dicas: rotação e lateralidade adequadas.',
 ARRAY['lombar', 'coluna', ' lombalgia', ' quadril']),

('acupuncture', 'Ponto LI4 (Hegu)', 
 'Ponto de acupuntura principal para dor no rosto e cabeça', 
 'Localização: entre 1o e 2o metacarpianos, no ponto mais alto do músculo. Indicações: dor de cabeça, dor facial, problemas sinusais, dores dentárias. Contraindicado na gestação (pode induzir parto). Agulha perpenticular ou oblíqua 0.5-1 cun.',
 ARRAY['hegu', ' cabeca', ' dor facial', ' gestacao']),

('acupuncture', 'Ponto ST36 (Zusanli)', 
 'Ponto para fortalecimento geral e digestão', 
 'Localização: 3 cun abaixo do polo da patela, 1 dedo lateral à crista tibial. Indicações: fortalecimento geral, fraqueza, distúrbios digestivos, recuperação pós-operatória. Moxabustão frequentemente usada. Agulha perpendicular 1-1.5 cun.',
 ARRAY['zusanli', ' digestao', ' energia', ' fortalecimento']),

('anatomy', 'Trapézio Superior', 
 'Anatomia funcional do trapézio superior', 
 'Origem: occipital externo, ligamento nucal. Inserção: terço lateral da clavícula. Ação: elevação escapular, extensão e rotação cervical. Inervação: nervo acessório (XI). Palpação: em elevação escapular ativa. Comum ponto de tensão em estresse.',
 ARRAY['trapezio', ' ombro', ' cervical', ' estresse']),

('anatomy', 'Paravertebrais', 
 'Anatomia muscular da coluna vertebral', 
 'Músculos profundos ao longo da coluna. Camadas: rotatórios, multifídios, semiespinhais. Função: estabilização segmentar, extensão e rotação. Importantes na avaliação de disfunções vertebrais. Palpação lateral aos processos espinhosos.',
 ARRAY['coluna', ' paravertebral', ' extensao', ' rotacao']);
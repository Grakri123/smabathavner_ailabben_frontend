-- Supabase Database Schema for AI Agent Frontend

-- Leads Table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Lead Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  
  -- Lead Details
  source TEXT, -- 'chat', 'form', 'manual', etc.
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- AI Generated Content
  ai_summary TEXT,
  ai_recommendations JSONB,
  
  -- Assignment
  assigned_to TEXT,
  
  -- Metadata
  tags TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Approvals Table
CREATE TABLE approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Approval Details
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'content', 'campaign', 'budget', 'strategy'
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'revision')),
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Content
  content JSONB, -- Flexible content storage
  original_request JSONB,
  
  -- Priority & Assignment
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to TEXT,
  
  -- AI Context
  ai_agent TEXT, -- Which agent created this
  ai_confidence DECIMAL(3,2),
  
  -- Metadata
  tags TEXT[],
  comments TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tasks Table (for complex workflows)
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Task Information
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'seo_audit', 'content_creation', 'campaign_setup'
  
  -- Status & Progress
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'in_progress', 'review', 'completed', 'cancelled')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- Assignment & Timing
  assigned_to TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  estimated_hours DECIMAL(5,2),
  actual_hours DECIMAL(5,2),
  
  -- Dependencies
  depends_on UUID[], -- Array of task IDs
  blocks UUID[], -- Array of task IDs this blocks
  
  -- AI Context
  ai_agent TEXT,
  ai_generated_steps JSONB,
  ai_recommendations JSONB,
  
  -- Results
  results JSONB,
  deliverables TEXT[],
  
  -- Metadata
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags TEXT[],
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat Sessions (for context)
CREATE TABLE chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Session Info
  agent_id TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'escalated', 'completed')),
  escalated_to_crm BOOLEAN DEFAULT FALSE,
  
  -- Context
  messages JSONB DEFAULT '[]'::jsonb,
  summary TEXT,
  
  -- CRM Connections
  lead_id UUID REFERENCES leads(id),
  task_id UUID REFERENCES tasks(id),
  approval_id UUID REFERENCES approvals(id),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_type ON approvals(type);
CREATE INDEX idx_approvals_assigned_to ON approvals(assigned_to);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

CREATE INDEX idx_chat_sessions_agent_id ON chat_sessions(agent_id);
CREATE INDEX idx_chat_sessions_status ON chat_sessions(status);

-- Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (adjust based on your auth setup)
CREATE POLICY "Users can view all leads" ON leads FOR SELECT USING (true);
CREATE POLICY "Users can update leads" ON leads FOR UPDATE USING (true);
CREATE POLICY "Users can insert leads" ON leads FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all approvals" ON approvals FOR SELECT USING (true);
CREATE POLICY "Users can update approvals" ON approvals FOR UPDATE USING (true);
CREATE POLICY "Users can insert approvals" ON approvals FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT USING (true);
CREATE POLICY "Users can update tasks" ON tasks FOR UPDATE USING (true);
CREATE POLICY "Users can insert tasks" ON tasks FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view all chat sessions" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "Users can update chat sessions" ON chat_sessions FOR UPDATE USING (true);
CREATE POLICY "Users can insert chat sessions" ON chat_sessions FOR INSERT WITH CHECK (true);
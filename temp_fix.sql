-- Add payment tracking to cases table
ALTER TABLE cases 
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'overdue')),
ADD COLUMN IF NOT EXISTS payment_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_alert_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_payment_reminder TIMESTAMPTZ;

-- Create payment alerts table
CREATE TABLE IF NOT EXISTS payment_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
    parlor_id UUID REFERENCES parlors(id) ON DELETE CASCADE,
    alert_level TEXT NOT NULL CHECK (alert_level IN ('critical', 'warning', 'info')),
    message TEXT NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE payment_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Parlor payment alerts" ON payment_alerts;

-- Create RLS policy - Fixed JSONB operator syntax and UUID casting
CREATE POLICY "Parlor payment alerts" ON payment_alerts
    FOR ALL USING (parlor_id = (auth.jwt() ->> 'parlor_id')::uuid);

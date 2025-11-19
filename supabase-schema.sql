-- Create email_subscribers table for the email capture funnel
CREATE TABLE IF NOT EXISTS email_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    opted_in_marketing BOOLEAN DEFAULT TRUE NOT NULL,
    source TEXT,
    guide_downloaded BOOLEAN DEFAULT FALSE NOT NULL,
    clicked_launch_page BOOLEAN DEFAULT FALSE NOT NULL,
    purchased_course BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_created_at ON email_subscribers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);

-- Enable Row Level Security (RLS)
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to do everything
CREATE POLICY "Service role can do everything"
ON email_subscribers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create policy to allow authenticated users to read their own data
CREATE POLICY "Users can view their own subscription"
ON email_subscribers
FOR SELECT
TO authenticated
USING (auth.uid()::text = id::text);

-- Add comment to table for documentation
COMMENT ON TABLE email_subscribers IS 'Stores email subscribers from the free guide lead magnet and tracks their journey through the funnel';

-- Add comments to columns
COMMENT ON COLUMN email_subscribers.id IS 'Unique identifier for the subscriber';
COMMENT ON COLUMN email_subscribers.created_at IS 'Timestamp when the subscriber signed up';
COMMENT ON COLUMN email_subscribers.name IS 'Subscriber''s name';
COMMENT ON COLUMN email_subscribers.email IS 'Subscriber''s email address (unique)';
COMMENT ON COLUMN email_subscribers.opted_in_marketing IS 'Whether subscriber opted in to marketing emails';
COMMENT ON COLUMN email_subscribers.source IS 'Source of subscription (e.g., free_guide, homepage, etc.)';
COMMENT ON COLUMN email_subscribers.guide_downloaded IS 'Whether the subscriber downloaded the free guide';
COMMENT ON COLUMN email_subscribers.clicked_launch_page IS 'Whether the subscriber visited the launch/sales page';
COMMENT ON COLUMN email_subscribers.purchased_course IS 'Whether the subscriber purchased the course';

-- Add remarks column to orders table
ALTER TABLE mvp_orders
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Ensure order_items has quantity column with default
ALTER TABLE mvp_order_items
ADD COLUMN IF NOT EXISTS quantity DECIMAL(10,2) NOT NULL DEFAULT 1;

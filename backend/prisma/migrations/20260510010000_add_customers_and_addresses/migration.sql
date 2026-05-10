CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    phone TEXT NOT NULL,
    phone_raw TEXT,
    name TEXT,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS customers_phone_key ON customers(phone);

CREATE TABLE IF NOT EXISTS customer_addresses (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    label TEXT,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS customer_addresses_customer_address_key
ON customer_addresses(customer_id, address);

CREATE INDEX IF NOT EXISTS customer_addresses_customer_id_idx
ON customer_addresses(customer_id);

ALTER TABLE customer_addresses
ADD CONSTRAINT customer_addresses_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE mvp_orders
ADD COLUMN IF NOT EXISTS customer_id INTEGER,
ADD COLUMN IF NOT EXISTS customer_address_id INTEGER;

WITH normalized_orders AS (
    SELECT
        id,
        customer_name,
        customer_mobile,
        customer_address,
        created_at,
        CASE
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '20%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) >= 12
                THEN '+' || regexp_replace(customer_mobile, '\D', '', 'g')
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '01%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) = 11
                THEN '+20' || substring(regexp_replace(customer_mobile, '\D', '', 'g') from 2)
            ELSE regexp_replace(customer_mobile, '[^0-9+]', '', 'g')
        END AS normalized_phone
    FROM mvp_orders
), latest_customers AS (
    SELECT DISTINCT ON (normalized_phone)
        normalized_phone,
        customer_mobile,
        customer_name
    FROM normalized_orders
    WHERE normalized_phone <> ''
    ORDER BY normalized_phone, id DESC
)
INSERT INTO customers (phone, phone_raw, name, created_at, updated_at)
SELECT normalized_phone, customer_mobile, customer_name, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM latest_customers
ON CONFLICT (phone) DO UPDATE SET
    phone_raw = EXCLUDED.phone_raw,
    name = COALESCE(NULLIF(EXCLUDED.name, ''), customers.name),
    updated_at = CURRENT_TIMESTAMP;

WITH normalized_orders AS (
    SELECT
        id,
        customer_address,
        created_at,
        CASE
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '20%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) >= 12
                THEN '+' || regexp_replace(customer_mobile, '\D', '', 'g')
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '01%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) = 11
                THEN '+20' || substring(regexp_replace(customer_mobile, '\D', '', 'g') from 2)
            ELSE regexp_replace(customer_mobile, '[^0-9+]', '', 'g')
        END AS normalized_phone
    FROM mvp_orders
), address_usage AS (
    SELECT
        c.id AS customer_id,
        no.customer_address,
        COUNT(*)::INTEGER AS usage_count,
        MAX(no.created_at) AS last_used_at
    FROM normalized_orders no
    JOIN customers c ON c.phone = no.normalized_phone
    WHERE no.customer_address <> ''
    GROUP BY c.id, no.customer_address
)
INSERT INTO customer_addresses (
    customer_id,
    address,
    usage_count,
    last_used_at,
    created_at,
    updated_at
)
SELECT
    customer_id,
    customer_address,
    usage_count,
    last_used_at,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM address_usage
ON CONFLICT (customer_id, address) DO UPDATE SET
    usage_count = customer_addresses.usage_count + EXCLUDED.usage_count,
    last_used_at = GREATEST(customer_addresses.last_used_at, EXCLUDED.last_used_at),
    updated_at = CURRENT_TIMESTAMP;

WITH normalized_orders AS (
    SELECT
        id,
        customer_address,
        CASE
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '20%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) >= 12
                THEN '+' || regexp_replace(customer_mobile, '\D', '', 'g')
            WHEN regexp_replace(customer_mobile, '\D', '', 'g') LIKE '01%'
                AND length(regexp_replace(customer_mobile, '\D', '', 'g')) = 11
                THEN '+20' || substring(regexp_replace(customer_mobile, '\D', '', 'g') from 2)
            ELSE regexp_replace(customer_mobile, '[^0-9+]', '', 'g')
        END AS normalized_phone
    FROM mvp_orders
)
UPDATE mvp_orders mo
SET
    customer_id = c.id,
    customer_address_id = ca.id
FROM normalized_orders no
JOIN customers c ON c.phone = no.normalized_phone
JOIN customer_addresses ca
    ON ca.customer_id = c.id
    AND ca.address = no.customer_address
WHERE mo.id = no.id;

ALTER TABLE mvp_orders
ALTER COLUMN customer_id SET NOT NULL,
ALTER COLUMN customer_address_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS mvp_orders_customer_id_idx
ON mvp_orders(customer_id);

CREATE INDEX IF NOT EXISTS mvp_orders_customer_address_id_idx
ON mvp_orders(customer_address_id);

ALTER TABLE mvp_orders
ADD CONSTRAINT mvp_orders_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(id)
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE mvp_orders
ADD CONSTRAINT mvp_orders_customer_address_id_fkey
FOREIGN KEY (customer_address_id) REFERENCES customer_addresses(id)
ON DELETE RESTRICT ON UPDATE CASCADE;

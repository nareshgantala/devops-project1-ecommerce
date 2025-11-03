-- Database initialization script for E-commerce application

-- Create database (run this separately if needed)
-- CREATE DATABASE ecommerce;

-- Connect to the database
\c ecommerce;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    category VARCHAR(100) NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Insert sample products
INSERT INTO products (name, description, price, category, stock, image_url) VALUES
('Laptop Pro 15"', 'High-performance laptop with 16GB RAM and 512GB SSD', 1299.99, 'Electronics', 50, 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853'),
('Wireless Mouse', 'Ergonomic wireless mouse with precision tracking', 29.99, 'Electronics', 200, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard with blue switches', 89.99, 'Electronics', 100, 'https://images.unsplash.com/photo-1595225476474-87563907a212'),
('USB-C Hub', '7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader', 49.99, 'Accessories', 150, 'https://images.unsplash.com/photo-1625948515291-69613efd103f'),
('Laptop Stand', 'Adjustable aluminum laptop stand for better ergonomics', 39.99, 'Accessories', 75, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46'),
('Webcam HD', '1080p HD webcam with built-in microphone', 79.99, 'Electronics', 80, 'https://images.unsplash.com/photo-1587826080692-f439cd0b70da'),
('Headphones Noise-Cancelling', 'Premium noise-cancelling over-ear headphones', 249.99, 'Electronics', 60, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e'),
('External SSD 1TB', 'Portable external SSD with USB 3.1 Gen 2', 129.99, 'Storage', 120, 'https://images.unsplash.com/photo-1531492746076-161ca9bcad58'),
('Monitor 27" 4K', '27-inch 4K UHD monitor with HDR support', 449.99, 'Electronics', 40, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf'),
('Desk Lamp LED', 'Adjustable LED desk lamp with touch control', 34.99, 'Accessories', 90, 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15'),
('Smartphone Pro', 'Latest flagship smartphone with 5G', 999.99, 'Electronics', 35, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9'),
('Tablet 10"', '10-inch tablet with stylus support', 399.99, 'Electronics', 45, 'https://images.unsplash.com/photo-1561154464-82e9adf32764'),
('Smartwatch', 'Fitness tracking smartwatch with heart rate monitor', 199.99, 'Wearables', 70, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30'),
('Wireless Earbuds', 'True wireless earbuds with active noise cancellation', 149.99, 'Electronics', 110, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df'),
('Portable Charger', '20,000mAh portable battery pack with fast charging', 44.99, 'Accessories', 180, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5');

-- Insert sample orders
INSERT INTO orders (customer_name, customer_email, total_amount, status) VALUES
('John Doe', 'john.doe@example.com', 1329.98, 'delivered'),
('Jane Smith', 'jane.smith@example.com', 529.97, 'shipped'),
('Bob Johnson', 'bob.johnson@example.com', 89.99, 'processing'),
('Alice Williams', 'alice.williams@example.com', 449.99, 'pending');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, price) VALUES
(1, 1, 1, 1299.99),
(1, 2, 1, 29.99),
(2, 7, 1, 249.99),
(2, 4, 1, 49.99),
(2, 5, 1, 39.99),
(2, 8, 1, 129.99),
(2, 10, 1, 34.99),
(3, 3, 1, 89.99),
(4, 9, 1, 449.99);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_user;

-- Display summary
SELECT 'Database initialized successfully!' as status;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_orders FROM orders;
SELECT COUNT(*) as total_order_items FROM order_items;
import React, { useState, useEffect } from 'react';
import './App.css';
import ProductList from './components/ProductList';
import OrderList from './components/OrderList';
import CreateOrder from './components/CreateOrder';
import Dashboard from './components/Dashboard';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      setProducts(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data.data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update order status');
      
      await fetchOrders();
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error updating order:', err);
      alert('Failed to update order status');
      return false;
    }
  };

  // Create new order
  const createOrder = async (orderData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      await fetchOrders();
      await fetchProducts();
      await fetchStats();
      return true;
    } catch (err) {
      console.error('Error creating order:', err);
      alert(err.message);
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchStats();
  }, []);

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <h1>🛍️ E-Commerce Platform</h1>
          <p className="subtitle">Product Catalog & Order Management System</p>
        </div>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-button ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
        <button
          className={`tab-button ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📋 Orders
        </button>
        <button
          className={`tab-button ${activeTab === 'create-order' ? 'active' : ''}`}
          onClick={() => setActiveTab('create-order')}
        >
          ➕ Create Order
        </button>
      </nav>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            ⚠️ Error: {error}
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard stats={stats} loading={loading} />
        )}

        {activeTab === 'products' && (
          <ProductList
            products={products}
            loading={loading}
            onRefresh={fetchProducts}
          />
        )}

        {activeTab === 'orders' && (
          <OrderList
            orders={orders}
            loading={loading}
            onRefresh={fetchOrders}
            onUpdateStatus={updateOrderStatus}
          />
        )}

        {activeTab === 'create-order' && (
          <CreateOrder
            products={products}
            onSubmit={createOrder}
            onSuccess={() => setActiveTab('orders')}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>E-Commerce Platform v1.0.0 | Built for DevOps Practice</p>
        <p className="health-check">
          API Status: <span className="status-indicator">●</span> Connected
        </p>
      </footer>
    </div>
  );
}

export default App;
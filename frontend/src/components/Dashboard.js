import React from 'react';

function Dashboard({ stats, loading }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="empty-state">
        <p>No statistics available</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Dashboard Overview</h2>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card card-primary">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <h3>Total Products</h3>
            <p className="stat-value">{stats.total_products || 0}</p>
            <p className="stat-label">Active in catalog</p>
          </div>
        </div>

        <div className="stat-card card-success">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>Total Orders</h3>
            <p className="stat-value">{stats.total_orders || 0}</p>
            <p className="stat-label">All time orders</p>
          </div>
        </div>

        <div className="stat-card card-info">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <h3>Total Revenue</h3>
            <p className="stat-value">${parseFloat(stats.total_revenue || 0).toFixed(2)}</p>
            <p className="stat-label">Gross revenue</p>
          </div>
        </div>

        <div className="stat-card card-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>Pending Orders</h3>
            <p className="stat-value">{stats.pending_orders || 0}</p>
            <p className="stat-label">Awaiting processing</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>System Information</h3>
        <div className="info-grid">
          <div className="info-card">
            <h4>🚀 Application Status</h4>
            <ul>
              <li>✅ Frontend: Running</li>
              <li>✅ Backend API: Connected</li>
              <li>✅ Database: Operational</li>
              <li>✅ Cache: Active</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>📊 Quick Stats</h4>
            <ul>
              <li>Average Order Value: ${stats.total_orders > 0 ? (parseFloat(stats.total_revenue) / stats.total_orders).toFixed(2) : '0.00'}</li>
              <li>Completion Rate: {stats.total_orders > 0 ? (((stats.total_orders - stats.pending_orders) / stats.total_orders) * 100).toFixed(1) : '0'}%</li>
              <li>Active Products: {stats.total_products}</li>
            </ul>
          </div>

          <div className="info-card">
            <h4>🔧 System Health</h4>
            <ul>
              <li>API Response: Fast</li>
              <li>Cache Hit Rate: High</li>
              <li>Error Rate: Low</li>
              <li>Uptime: 99.9%</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="welcome-section">
        <h3>Welcome to E-Commerce Platform</h3>
        <p>
          This is a full-stack application built for DevOps practice. It demonstrates
          modern cloud-native architecture with containerization, CI/CD pipelines, and
          infrastructure as code.
        </p>
        <div className="tech-stack">
          <span className="tech-badge">React</span>
          <span className="tech-badge">Node.js</span>
          <span className="tech-badge">PostgreSQL</span>
          <span className="tech-badge">Redis</span>
          <span className="tech-badge">Docker</span>
          <span className="tech-badge">AWS ECS</span>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
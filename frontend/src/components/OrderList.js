import React, { useState } from 'react';

function OrderList({ orders, loading, onRefresh, onUpdateStatus }) {
  const [expandedOrder, setExpandedOrder] = useState(null);

  const getStatusBadgeClass = (status) => {
    const statusClasses = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-primary',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
    };
    return statusClasses[status] || 'badge-secondary';
  };

  const getStatusEmoji = (status) => {
    const statusEmojis = {
      pending: '⏳',
      processing: '⚙️',
      shipped: '🚚',
      delivered: '✅',
      cancelled: '❌',
    };
    return statusEmojis[status] || '📦';
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (window.confirm(`Change order status to "${newStatus}"?`)) {
      await onUpdateStatus(orderId, newStatus);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Order Management</h2>
        <button className="btn btn-primary" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="empty-state">
          <p>No orders found</p>
        </div>
      ) : (
        <div className="orders-container">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div className="order-id-section">
                  <h3>Order #{order.id}</h3>
                  <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                    {getStatusEmoji(order.status)} {order.status.toUpperCase()}
                  </span>
                </div>
                <button
                  className="btn-expand"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  {expandedOrder === order.id ? '▼' : '▶'}
                </button>
              </div>

              <div className="order-summary">
                <div className="order-info-grid">
                  <div className="info-item">
                    <span className="info-label">Customer:</span>
                    <span className="info-value">{order.customer_name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{order.customer_email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total:</span>
                    <span className="info-value price">${parseFloat(order.total_amount).toFixed(2)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Date:</span>
                    <span className="info-value">{new Date(order.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {expandedOrder === order.id && (
                <div className="order-details">
                  <h4>Order Items</h4>
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.product_name || `Product #${item.product_id}`}</td>
                          <td>{item.quantity}</td>
                          <td>${parseFloat(item.price).toFixed(2)}</td>
                          <td>${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan="3"><strong>Total</strong></td>
                        <td><strong>${parseFloat(order.total_amount).toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="order-actions">
                    <h4>Update Status</h4>
                    <div className="status-buttons">
                      {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          className={`btn-status ${order.status === status ? 'active' : ''}`}
                          onClick={() => handleStatusChange(order.id, status)}
                          disabled={order.status === status}
                        >
                          {getStatusEmoji(status)} {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="section-footer">
        <p>Total Orders: <strong>{orders.length}</strong></p>
      </div>
    </div>
  );
}

export default OrderList;
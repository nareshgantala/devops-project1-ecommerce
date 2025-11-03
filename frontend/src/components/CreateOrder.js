import React, { useState } from 'react';

function CreateOrder({ products, onSubmit, onSuccess }) {
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const availableProducts = products.filter(p => p.stock > 0);

  const addItem = () => {
    setSelectedItems([...selectedItems, { product_id: '', quantity: 1 }]);
  };

  const removeItem = (index) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    const updated = [...selectedItems];
    updated[index][field] = field === 'quantity' ? parseInt(value) || 1 : value;
    setSelectedItems(updated);
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product) {
        return total + (parseFloat(product.price) * item.quantity);
      }
      return total;
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!customerName.trim() || !customerEmail.trim()) {
      alert('Please enter customer name and email');
      return;
    }

    if (selectedItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    const invalidItems = selectedItems.filter(item => !item.product_id);
    if (invalidItems.length > 0) {
      alert('Please select a product for all items');
      return;
    }

    // Check stock availability
    for (const item of selectedItems) {
      const product = products.find(p => p.id === parseInt(item.product_id));
      if (product && product.stock < item.quantity) {
        alert(`Insufficient stock for ${product.name}. Available: ${product.stock}`);
        return;
      }
    }

    setSubmitting(true);

    const orderData = {
      customer_name: customerName,
      customer_email: customerEmail,
      items: selectedItems.map(item => ({
        product_id: parseInt(item.product_id),
        quantity: item.quantity
      }))
    };

    const success = await onSubmit(orderData);
    
    setSubmitting(false);

    if (success) {
      // Reset form
      setCustomerName('');
      setCustomerEmail('');
      setSelectedItems([]);
      alert('Order created successfully!');
      onSuccess();
    }
  };

  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Create New Order</h2>
      </div>

      <form className="order-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Customer Information</h3>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="customerName">Customer Name *</label>
              <input
                id="customerName"
                type="text"
                className="form-input"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="customerEmail">Customer Email *</label>
              <input
                id="customerEmail"
                type="email"
                className="form-input"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header-inline">
            <h3>Order Items</h3>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={addItem}
              disabled={availableProducts.length === 0}
            >
              ➕ Add Item
            </button>
          </div>

          {availableProducts.length === 0 && (
            <div className="alert alert-warning">
              No products available with stock. Please restock products first.
            </div>
          )}

          {selectedItems.length === 0 ? (
            <div className="empty-state">
              <p>No items added yet. Click "Add Item" to start.</p>
            </div>
          ) : (
            <div className="items-list">
              {selectedItems.map((item, index) => {
                const selectedProduct = products.find(p => p.id === parseInt(item.product_id));
                
                return (
                  <div key={index} className="item-row">
                    <div className="item-number">{index + 1}</div>
                    
                    <div className="form-group flex-grow">
                      <label>Product</label>
                      <select
                        className="form-input"
                        value={item.product_id}
                        onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                        required
                      >
                        <option value="">Select a product</option>
                        {availableProducts.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ${parseFloat(product.price).toFixed(2)} (Stock: {product.stock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group quantity-group">
                      <label>Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                        min="1"
                        max={selectedProduct ? selectedProduct.stock : 999}
                        required
                      />
                    </div>

                    {selectedProduct && (
                      <div className="item-subtotal">
                        <label>Subtotal</label>
                        <div className="subtotal-value">
                          ${(parseFloat(selectedProduct.price) * item.quantity).toFixed(2)}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeItem(index)}
                      title="Remove item"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedItems.length > 0 && (
          <div className="order-summary-box">
            <h3>Order Summary</h3>
            <div className="summary-details">
              <div className="summary-row">
                <span>Items:</span>
                <span>{selectedItems.length}</span>
              </div>
              <div className="summary-row">
                <span>Total Units:</span>
                <span>{selectedItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="summary-row total">
                <span>Total Amount:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary btn-large"
            disabled={submitting || selectedItems.length === 0}
          >
            {submitting ? '⏳ Creating Order...' : '✅ Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrder;
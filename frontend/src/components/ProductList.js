import React from 'react';

function ProductList({ products, loading, onRefresh }) {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  return (
    <div className="content-section">
      <div className="section-header">
        <h2>Product Catalog</h2>
        <button className="btn btn-primary" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <p>No products available</p>
        </div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img
                  src={product.image_url || 'https://via.placeholder.com/300x200?text=No+Image'}
                  alt={product.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                  }}
                />
                {product.stock < 10 && product.stock > 0 && (
                  <span className="badge badge-warning">Low Stock</span>
                )}
                {product.stock === 0 && (
                  <span className="badge badge-danger">Out of Stock</span>
                )}
              </div>

              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>

                <div className="product-footer">
                  <div className="product-price">
                    <span className="price-label">Price:</span>
                    <span className="price-value">${parseFloat(product.price).toFixed(2)}</span>
                  </div>
                  <div className="product-stock">
                    <span className="stock-label">Stock:</span>
                    <span className={`stock-value ${product.stock < 10 ? 'low' : ''}`}>
                      {product.stock} units
                    </span>
                  </div>
                </div>

                <div className="product-meta">
                  <small>ID: {product.id}</small>
                  <small>Added: {new Date(product.created_at).toLocaleDateString()}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-footer">
        <p>Total Products: <strong>{products.length}</strong></p>
      </div>
    </div>
  );
}

export default ProductList;
import React from 'react';

export default function ProductCard({ product, onBook }){
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
      <h4>{product.name}</h4>
      <div>Category: {product.category}</div>
      <div>Price: {product.price}</div>
      <div>Available: {product.available_quantity}</div>
      <button onClick={onBook} disabled={product.available_quantity <= 0}>Book</button>
    </div>
  );
}

import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

const MedicineCard = ({ medicine, onAddToCart, showQuantityControl = true }) => {
  const [quantity, setQuantity] = useState(1);

  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart({ ...medicine, quantity });
      setQuantity(1);
    }
  };

  return (
    <div className="medicine-card">
      <div className="medicine-card-header">
        <div>
          <div className="medicine-name">{medicine.name}</div>
          <div className="medicine-dosage">{medicine.dosage}</div>
          {medicine.category && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
              {medicine.category}
            </div>
          )}
        </div>
        <div className="medicine-price">₹{medicine.price}</div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
        {showQuantityControl ? (
          <div className="qty-control">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>
              <Minus size={16} />
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Qty: <strong>{medicine.quantity || 10}</strong> {medicine.unit || 'Tablets'}
          </div>
        )}
        {onAddToCart && (
          <button
            className="btn btn-secondary"
            onClick={handleAdd}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
};

export default MedicineCard;

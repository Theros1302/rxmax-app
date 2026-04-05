import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Minus, Home, MapPin } from 'lucide-react';
import api from '../services/api';
import MedicineCard from '../components/MedicineCard';

const OrderPage = ({ store }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [deliveryType, setDeliveryType] = useState('home');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [searching, setSearching] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cartMedicines');
    if (savedCart) {
      try {
        const medicines = JSON.parse(savedCart);
        const cartItems = medicines.map(m => ({
          ...m,
          quantity: 1,
          cartQuantity: 1
        }));
        setCart(cartItems);
        localStorage.removeItem('cartMedicines');
      } catch (err) {
        console.log('Error loading saved cart');
      }
    }

    // Load default address
    api.getPatientProfile().then(patient => {
      setDeliveryAddress(patient?.address || '');
    });
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setMedicines([]);
      return;
    }

    setSearching(true);
    try {
      const results = await api.searchMedicines(query);
      setMedicines(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleAddToCart = (medicine) => {
    const existing = cart.find(item => item.id === medicine.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === medicine.id
          ? { ...item, quantity: item.quantity + medicine.quantity }
          : item
      ));
    } else {
      setCart([...cart, { ...medicine, quantity: medicine.quantity }]);
    }
    setSearchQuery('');
    setMedicines([]);
  };

  const handleUpdateQty = (id, qty) => {
    if (qty <= 0) {
      setCart(cart.filter(item => item.id !== id));
    } else {
      setCart(cart.map(item =>
        item.id === id ? { ...item, quantity: qty } : item
      ));
    }
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const delivery = deliveryType === 'pickup' ? 0 : 50;
  const total = subtotal + delivery;

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    if (deliveryType === 'home' && !deliveryAddress.trim()) {
      alert('Please enter delivery address');
      return;
    }

    setProcessing(true);
    try {
      const order = await api.createOrder(cart, deliveryType, deliveryAddress);
      setShowConfirm(false);
      setCart([]);
      navigate(`/orders/${order.id}`, { state: { newOrder: true } });
    } catch (error) {
      alert('Failed to place order: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page">
      <div className="header">
        <h1>Order Medicines</h1>
        <p className="header-subtitle">Search and order from {store?.name || 'pharmacy'}</p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          border: '1.5px solid var(--border)',
          borderRadius: '8px',
          paddingLeft: '1rem',
          transition: 'all 0.2s ease'
        }}>
          <Search size={20} color="var(--text-light)" />
          <input
            type="text"
            placeholder="Search medicines (e.g., Dolo, Aspirin)"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              padding: '0.75rem 1rem',
              fontSize: '1rem',
              outline: 'none',
              background: 'transparent'
            }}
          />
        </div>
        {searching && <div className="spinner" style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}></div>}
      </div>

      {/* Search Results */}
      {searchQuery && medicines.length > 0 && (
        <>
          <div className="section-title">Search Results ({medicines.length})</div>
          {medicines.map(medicine => (
            <MedicineCard
              key={medicine.id}
              medicine={medicine}
              onAddToCart={handleAddToCart}
            />
          ))}
        </>
      )}

      {searchQuery && medicines.length === 0 && !searching && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try searching with different keywords</p>
        </div>
      )}

      {!searchQuery && cart.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <h3>Your cart is empty</h3>
          <p>Search for medicines above to add to your cart</p>
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <>
          <div className="section-title">Your Cart ({cart.length})</div>
          {cart.map(item => (
            <div key={item.id} className="medicine-card">
              <div className="medicine-card-header">
                <div>
                  <div className="medicine-name">{item.name}</div>
                  <div className="medicine-dosage">{item.dosage}</div>
                </div>
                <div className="medicine-price">₹{item.price}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <div className="qty-control">
                  <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)}>
                    <Minus size={16} />
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>
                <div style={{ fontWeight: '600', color: 'var(--primary)' }}>
                  ₹{item.price * item.quantity}
                </div>
                <button
                  onClick={() => removeFromCart(item.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--danger)',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          {/* Delivery Options */}
          <div className="section-title">Delivery Options</div>
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <label style={{
              flex: 1,
              padding: '1rem',
              border: `2px solid ${deliveryType === 'home' ? 'var(--secondary)' : 'var(--border)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: deliveryType === 'home' ? 'rgba(46, 134, 193, 0.05)' : 'white',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="delivery"
                value="home"
                checked={deliveryType === 'home'}
                onChange={(e) => setDeliveryType(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              <Home size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Home Delivery (₹50)
            </label>
            <label style={{
              flex: 1,
              padding: '1rem',
              border: `2px solid ${deliveryType === 'pickup' ? 'var(--secondary)' : 'var(--border)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              background: deliveryType === 'pickup' ? 'rgba(46, 134, 193, 0.05)' : 'white',
              transition: 'all 0.2s ease'
            }}>
              <input
                type="radio"
                name="delivery"
                value="pickup"
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value)}
                style={{ marginRight: '0.5rem' }}
              />
              <MapPin size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
              Store Pickup (Free)
            </label>
          </div>

          {deliveryType === 'home' && (
            <div className="form-group">
              <label>Delivery Address</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter full delivery address"
              />
            </div>
          )}

          {/* Order Summary */}
          <div className="card">
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span>{deliveryType === 'home' ? 'Delivery' : 'Store Pickup'}</span>
                <span>₹{delivery}</span>
              </div>
              <div className="divider"></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.125rem' }}>
                <span>Total</span>
                <span className="currency-large">₹{total}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowConfirm(true)}
            className="btn btn-primary btn-block"
            style={{ marginTop: '1.5rem' }}
          >
            Proceed to Checkout
          </button>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="modal-overlay" onClick={() => !processing && setShowConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirm Order</h2>
              <button
                className="modal-close"
                onClick={() => setShowConfirm(false)}
                disabled={processing}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <div className="section-title">Order Summary</div>
              <div className="card">
                <p style={{ marginBottom: '0.75rem' }}>
                  <strong>{cart.length}</strong> medicine{cart.length > 1 ? 's' : ''} • <strong>₹{total}</strong>
                </p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0 }}>
                  {deliveryType === 'home' ? `Delivery to: ${deliveryAddress}` : 'Pickup at store'}
                </p>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="btn btn-primary btn-block"
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="spinner"></span>
                  Placing Order...
                </>
              ) : (
                'Confirm & Place Order'
              )}
            </button>

            <button
              onClick={() => setShowConfirm(false)}
              className="btn btn-secondary btn-block"
              style={{ marginTop: '0.75rem' }}
              disabled={processing}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderPage;

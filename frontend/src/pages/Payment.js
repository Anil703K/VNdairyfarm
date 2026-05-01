import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createOrder, createRazorpayPaymentOrder, verifyRazorpayPayment, createCartOrder } from '../services/apiClient';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './Payment.css';

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart, clearCart } = useCart();
  const { showSuccessToast } = useToast();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.product) {
      // Single product flow
      setProduct(location.state.product);
      setQuantity(location.state.quantity || 1);
    } else if (location.state?.cartItems) {
      // Cart flow - use first item for display
      const cartItems = location.state.cartItems;
      if (cartItems && cartItems.length > 0) {
        setProduct(cartItems[0]);
        setQuantity(1);
      }
    } else {
      // Redirect to cart if no data
      navigate('/cart');
    }
  }, [location.state, navigate]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const totalPrice = product ? Number(product.price) * quantity : 
  (location.state?.cartItems?.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 0) || 0);

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!product && !location.state?.cartItems) return;

    setIsProcessing(true);
    setMessage('');

    try {
      let paymentReference = '';
      let paymentStatus = 'pending';

      if (paymentMethod !== 'cod') {
        const scriptReady = await loadRazorpayScript();
        if (!scriptReady) {
          throw new Error('Unable to load Razorpay checkout. Check internet and try again.');
        }

        const rpOrder = await createRazorpayPaymentOrder(totalPrice);
        paymentReference = await new Promise((resolve, reject) => {
          const razorpay = new window.Razorpay({
            key: rpOrder.key,
            amount: rpOrder.amount,
            currency: rpOrder.currency || 'INR',
            name: 'VN Dairy',
            description: location.state?.cartItems ? 'Cart items payment' : `${product.name} order payment`,
            order_id: rpOrder.orderId,
            handler: async (response) => {
              try {
                const verify = await verifyRazorpayPayment(response);
                if (!verify.verified) {
                  reject(new Error('Payment verification failed'));
                  return;
                }
                resolve(verify.paymentReference || response.razorpay_payment_id);
              } catch (error) {
                reject(new Error(error.message || 'Payment verification failed'));
              }
            },
            modal: {
              ondismiss: () => reject(new Error('Payment was cancelled')),
            },
          });
          razorpay.open();
        });
        paymentStatus = 'paid';
      }

      // Create order after successful payment
      if (location.state?.cartItems) {
        // Cart flow - create order with multiple items
        await createCartOrder({
          items: location.state.cartItems,
          checkout: {
            paymentMethod,
            paymentStatus,
            paymentReference,
          },
        });
      } else {
        // Single product flow
        await createOrder({
          product,
          quantity,
          checkout: {
            paymentMethod,
            paymentStatus,
            paymentReference,
          },
        });
      }

      // Clear cart after successful payment
      clearCart();
      
      // Show instant toast notification
      showSuccessToast('Order placed successfully from VNDairyFarm');
      
      // Show browser notification
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Order Placed Successfully!', {
            body: `Your order has been placed successfully. Total: ₹${totalPrice}`,
            icon: '/favicon.ico',
            badge: '1'
          });
        } else {
          // Request permission for future notifications
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('Order Placed Successfully!', {
                body: `Your order has been placed successfully. Total: ₹${totalPrice}`,
                icon: '/favicon.ico',
                badge: '1'
              });
            }
          });
        }
      }
      
      setShowSuccess(true);
      setMessage('Order placed successfully!');
      
      // Redirect to orders after 2 seconds
      setTimeout(() => {
        navigate('/orders');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      // Handle specific error cases with user-friendly messages
      if (error.message.includes('404')) {
        setMessage('Payment service is currently unavailable. Please try again later or contact support.');
      } else if (error.message.includes('401') || error.message.includes('login')) {
        setMessage('Please login to continue with payment.');
      } else if (error.message.includes('cancelled')) {
        setMessage('Payment was cancelled. Please try again if you wish to complete your order.');
      } else if (error.message.includes('verification')) {
        setMessage('Payment verification failed. Please contact support if the amount was deducted.');
      } else {
        setMessage(error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (!product) {
    return (
      <div className="payment-page">
        <div className="payment-loading">
          <div className="spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        <button className="back-btn" onClick={goBack}>
          ← Back
        </button>
        
        <h1>Complete Your Order</h1>
        
        <div className="product-summary">
          <img src={product.image} alt={product.name} />
          <div className="product-details">
            <h3>{product.name}</h3>
            <p><strong>Category:</strong> {product.category || 'Dairy'}</p>
            <p><strong>Quantity:</strong> {product.quantityLabel || product.quantity}</p>
            <p><strong>Price:</strong> ₹{product.price}</p>
            <div className="quantity-selector">
              <label><strong>Quantity:</strong></label>
              <div className="quantity-controls">
                <button 
                  type="button" 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isProcessing}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button 
                  type="button" 
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={isProcessing}
                >
                  +
                </button>
              </div>
            </div>
            <div className="total-price">
              <strong>Total: ₹{totalPrice}</strong>
            </div>
          </div>
        </div>

        {!showSuccess ? (
          <form className="payment-form" onSubmit={handlePayment}>
            <div className="payment-methods">
              <h3>Choose Payment Method</h3>
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="payment-option-content">
                  <span className="payment-icon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when you receive your order</p>
                  </div>
                </div>
              </label>
              
              <label className="payment-option">
                <input
                  type="radio"
                  name="payment-method"
                  value="upi"
                  checked={paymentMethod === 'upi'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={isProcessing}
                />
                <div className="payment-option-content">
                  <span className="payment-icon">📱</span>
                  <div>
                    <strong>UPI / Card Payment</strong>
                    <p>Pay instantly with UPI, Credit Card, or Debit Card</p>
                  </div>
                </div>
              </label>
            </div>

            {message && <div className="payment-error">{message}</div>}

            <button 
              type="submit" 
              className="pay-btn" 
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="spinner"></span>
                  Processing...
                </>
              ) : (
                <>
                  {paymentMethod === 'cod' ? 'Place Order' : 'Pay & Place Order'}
                  <span className="pay-amount">₹{totalPrice}</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="payment-success">
            <div className="success-icon">✓</div>
            <h2>Order Placed Successfully!</h2>
            <p>{message}</p>
            <p>Redirecting to your orders...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Payment;

# Quick Start - Order & Notification System

## What Was Fixed/Added

### 🔴 Problems Solved:
1. **Order Failed** → Now saves to database successfully
2. **No Customer Data** → Stores name, phone, address
3. **No Notifications** → Sends SMS & WhatsApp automatically
4. **Wrong Status Code** → Changed from 201 to 200 (frontend compatible)

---

## ⚙️ Quick Setup (5 Minutes)

### Step 1: Update `.env` in backend folder
```env
TWILIO_ACCOUNT_SID=AC...your_sid...
TWILIO_AUTH_TOKEN=your_token...
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### Step 2: Start Backend
```bash
cd backend
npm start
```

### Step 3: Test Order
- Go to frontend
- Select a product → Click "ADD"
- Fill form with:
  - Name
  - Phone (+91XXXXXXXXXX for India)
  - Location
- Click "Place Order"
- ✅ Order saved + SMS/WhatsApp sent!

---

## 📊 Database Structure

**Order Collection:**
```javascript
{
  _id: ObjectId,
  user: ObjectId,           // User who placed order
  items: [
    {
      productId: String,
      name: String,
      quantity: Number,
      price: Number
    }
  ],
  totalPrice: Number,
  status: "pending",
  customerName: String,     // NEW
  customerPhone: String,    // NEW
  deliveryAddress: String,  // NEW
  notificationStatus: {     // NEW
    sms: "sent|failed",
    whatsapp: "sent|failed"
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📱 Phone Number Format

**IMPORTANT:** Phone must include country code!

✅ Correct:
- `+919876543210` (India)
- `+11234567890` (USA)
- `+447911123456` (UK)

❌ Wrong:
- `9876543210` (no country code)
- `0-9876543210` (dash/zero prefix)

---

## 🔔 Notification Messages

### SMS Format:
```
Hello [Name],

Your order has been placed successfully!

Order Details:
Fresh Milk x2 = ₹160

Total: ₹160
Order ID: 66c1a2b3...

Thank you for your order!
```

### WhatsApp Format:
```
Hello [Name],

✅ Your order has been placed successfully!

📦 Order Details:
Fresh Milk x2 = ₹160

💰 Total: ₹160
📋 Order ID: 66c1a2b3...

Thank you for your order! We'll update you soon.
```

---

## 🚀 API Endpoint

**URL:** `POST /api/orders`

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "items": [
    {
      "productId": "1",
      "name": "Fresh Milk",
      "quantity": 2,
      "price": 80
    }
  ],
  "customerName": "Rajesh Kumar",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main Road, City"
}
```

**Success Response (200):**
```json
{
  "_id": "66c1a2b3...",
  "totalPrice": 160,
  "status": "pending",
  "message": "Order placed successfully",
  "notificationStatus": {
    "sms": "pending",
    "whatsapp": "pending"
  }
}
```

---

## ✅ Checklist

- [ ] Twilio account created
- [ ] Credentials added to `.env`
- [ ] Backend running
- [ ] Frontend can submit orders
- [ ] SMS received on phone
- [ ] WhatsApp received on phone
- [ ] Order visible in MongoDB
- [ ] Customer data saved correctly

---

## 🐛 Debugging

**Order not saving?**
```bash
# Check logs in backend terminal
# Look for: "MongoDB connected"
```

**SMS not sent?**
```bash
# Check logs for: "SMS sent successfully" or error message
# Verify phone format: +[country][number]
# Ensure Twilio account has credits
```

**Frontend shows "Order failed"?**
```bash
# Backend should return 200 status
# Check: Authorization header included
# Check: User is logged in
```

---

## 📚 Full Documentation
See `SETUP_GUIDE.md` for comprehensive details

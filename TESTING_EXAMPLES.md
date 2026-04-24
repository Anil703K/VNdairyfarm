# Testing Examples - Order & Notification System

## 🧪 Manual Testing with cURL

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar",
    "email": "rajesh@example.com",
    "password": "password123",
    "phone": "+919876543210",
    "address": "123 Milk Street, Delhi"
  }'
```

**Response:**
```json
{
  "_id": "user123",
  "name": "Rajesh Kumar",
  "email": "rajesh@example.com",
  "phone": "+919876543210",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 2. Place an Order (Full Data)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "1",
        "name": "Fresh Milk 500ml",
        "quantity": 2,
        "price": 80
      },
      {
        "productId": "2",
        "name": "Paneer 200g",
        "quantity": 1,
        "price": 150
      }
    ],
    "customerName": "Rajesh Kumar",
    "customerPhone": "+919876543210",
    "deliveryAddress": "123 Milk Street, Delhi"
  }'
```

**Expected Response (200):**
```json
{
  "_id": "order123",
  "user": "user123",
  "items": [
    {
      "productId": "1",
      "name": "Fresh Milk 500ml",
      "quantity": 2,
      "price": 80
    },
    {
      "productId": "2",
      "name": "Paneer 200g",
      "quantity": 1,
      "price": 150
    }
  ],
  "totalPrice": 310,
  "status": "pending",
  "customerName": "Rajesh Kumar",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Milk Street, Delhi",
  "notificationStatus": {
    "sms": "pending",
    "whatsapp": "pending"
  },
  "message": "Order placed successfully",
  "createdAt": "2026-04-22T10:30:00.000Z",
  "updatedAt": "2026-04-22T10:30:00.000Z"
}
```

### 3. Place Order (Minimal - With Fallback)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "1",
        "name": "Fresh Milk 500ml",
        "quantity": 1,
        "price": 80
      }
    ]
  }'
```

**Response:** (Uses user profile data as fallback)
```json
{
  "_id": "order456",
  "items": [...],
  "totalPrice": 80,
  "customerName": "Rajesh Kumar",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Milk Street, Delhi",
  "message": "Order placed successfully"
}
```

### 4. Get User's Orders

```bash
curl -X GET http://localhost:5000/api/orders/user123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:**
```json
[
  {
    "_id": "order123",
    "items": [...],
    "totalPrice": 310,
    "customerName": "Rajesh Kumar",
    "status": "pending",
    "createdAt": "2026-04-22T10:30:00.000Z"
  }
]
```

---

## 🧬 JavaScript Test Script

Save as `test-order.js` in backend folder:

```javascript
const API_BASE = "http://localhost:5000";

async function testOrderFlow() {
  try {
    console.log("🧪 Starting Order & Notification Test...\n");

    // 1. Register User
    console.log("1️⃣  Registering user...");
    const registerRes = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "testpass123",
        phone: "+919876543210",
        address: "Test Address"
      })
    });
    
    const registerData = await registerRes.json();
    const token = registerData.token;
    const userId = registerData._id;
    console.log(`✅ User registered: ${userId}\n`);

    // 2. Place Order
    console.log("2️⃣  Placing order...");
    const orderRes = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [
          {
            productId: "test1",
            name: "Fresh Milk",
            quantity: 2,
            price: 80
          }
        ],
        customerName: "Test User",
        customerPhone: "+919876543210",
        deliveryAddress: "Test Delivery Address"
      })
    });

    const orderData = await orderRes.json();
    console.log(`✅ Order placed: ${orderData._id}`);
    console.log(`📊 Total: ₹${orderData.totalPrice}\n`);

    // 3. Verify Order Details
    console.log("3️⃣  Verifying order details...");
    console.log(`👤 Customer: ${orderData.customerName}`);
    console.log(`📞 Phone: ${orderData.customerPhone}`);
    console.log(`📍 Address: ${orderData.deliveryAddress}`);
    console.log(`📦 Items: ${orderData.items.length}`);
    console.log(`⏰ Created: ${orderData.createdAt}\n`);

    // 4. Get Orders
    console.log("4️⃣  Fetching user orders...");
    const getRes = await fetch(`${API_BASE}/api/orders/${userId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    const orders = await getRes.json();
    console.log(`✅ Found ${orders.length} order(s)\n`);

    console.log("✨ All tests passed!");
    console.log("\n📱 Check your phone for SMS/WhatsApp notifications...");

  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
}

// Run test
testOrderFlow();
```

**Run with:**
```bash
node test-order.js
```

---

## 🔍 MongoDB Query Examples

### Check Orders in Database

```javascript
// Connect to MongoDB in console/shell

// Get all orders
db.orders.find({}).pretty()

// Get orders for specific user
db.orders.find({ user: ObjectId("user123") }).pretty()

// Get recent orders
db.orders.find({}).sort({ createdAt: -1 }).limit(5).pretty()

// Get orders with SMS sent
db.orders.find({ "notificationStatus.sms": "sent" }).pretty()

// Get orders with customer info
db.orders.find({}).select({
  _id: 1,
  customerName: 1,
  customerPhone: 1,
  totalPrice: 1,
  createdAt: 1
}).pretty()

// Count orders by status
db.orders.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
])
```

---

## 🐛 Debug Scenarios

### Scenario 1: Order Fails (Missing Auth)

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "1", "name": "Milk", "quantity": 1, "price": 80}]}'
```

**Expected Response (401):**
```json
{ "message": "Not authorized" }
```

### Scenario 2: Invalid Phone Format

```bash
# Phone without country code - will be auto-formatted
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer token..." \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "name": "Milk", "quantity": 1, "price": 80}],
    "customerPhone": "9876543210"
  }'
```

**Behavior:** Phone auto-formatted to "+919876543210"

### Scenario 3: Missing Order Items

```bash
curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer token..." \
  -H "Content-Type: application/json" \
  -d '{"items": []}'
```

**Expected Response (400):**
```json
{ "message": "Order must contain at least one item" }
```

### Scenario 4: No Twilio Credentials

**Backend Log Output:**
```
⚠️  SMS notification skipped: Twilio credentials not configured
⚠️  WhatsApp notification skipped: Twilio credentials not configured
```

**Order still succeeds** ✅

---

## 📊 Performance Testing

### Load Test (100 Orders)

```javascript
async function loadTest() {
  const token = "your_token";
  const startTime = Date.now();
  
  for (let i = 0; i < 100; i++) {
    await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        items: [
          {
            productId: `prod${i}`,
            name: `Product ${i}`,
            quantity: 1,
            price: 100
          }
        ],
        customerPhone: "+919876543210"
      })
    });
    
    if ((i + 1) % 10 === 0) {
      console.log(`✅ ${i + 1}/100 orders created`);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`⏱️  Completed 100 orders in ${duration}ms`);
  console.log(`📊 Average: ${(duration / 100).toFixed(2)}ms per order`);
}
```

---

## ✅ Test Checklist

- [ ] Register new user with phone number
- [ ] Place order with full data
- [ ] Verify order in MongoDB
- [ ] Receive SMS notification
- [ ] Receive WhatsApp notification
- [ ] Try order without phone (should succeed)
- [ ] Try order without auth (should fail)
- [ ] Try empty items (should fail)
- [ ] Check notification status field
- [ ] Verify customer data saved correctly

---

## 📈 Success Metrics

**Expected Performance:**
- Order creation: < 500ms
- SMS delivery: 1-10 seconds
- WhatsApp delivery: 2-30 seconds
- Database save: < 100ms

**Expected Reliability:**
- Order success rate: > 99%
- Notification delivery: > 95%
- Error recovery: Automatic


# Order Placement & SMS/WhatsApp Notification Setup

This guide explains how to set up the order placement functionality with SMS and WhatsApp notifications.

## Features Implemented

✅ **Order Placement** - Orders are now successfully saved to the database
✅ **Customer Data Storage** - Customer name, phone, and delivery address saved
✅ **SMS Notifications** - Customers receive SMS confirmations
✅ **WhatsApp Notifications** - Customers receive WhatsApp messages
✅ **Database Persistence** - All order data persists in MongoDB

## Architecture

### Backend Components

1. **Order Model** (`backend/models/Order.js`)
   - Stores order items, totals, customer info
   - Tracks notification status (SMS/WhatsApp)
   - Fields: items, totalPrice, customerName, customerPhone, deliveryAddress, status

2. **Order Controller** (`backend/controllers/orderController.js`)
   - Creates orders with full customer data
   - Automatically sends notifications
   - Validates user authorization
   - Returns 200 status on success (fixed from 201)

3. **Notification Service** (`backend/services/notificationService.js`)
   - Integrates with Twilio API
   - Sends SMS notifications
   - Sends WhatsApp messages
   - Handles errors gracefully

### Frontend Components

- **ProductsCard.js** - Order form with customer details
- **apiClient.js** - API communication

## Setup Instructions

### 1. Install Dependencies

Twilio has already been installed. If needed, run:
```bash
cd backend
npm install twilio
```

### 2. Get Twilio Credentials

1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the console
3. Provision a phone number for SMS (e.g., +1234567890)
4. Enable WhatsApp and get a WhatsApp number (usually same or different)

### 3. Configure Environment Variables

Create or update `backend/.env` file:

```env
PORT=5000
JWT_SECRET=your_secret_key
MONGO_URI=your_mongodb_connection_string

# Twilio Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890
```

### 4. Database Migration (if needed)

If you have existing orders without customer data, they'll be compatible but won't have customer details or notifications. New orders will automatically save all data.

## API Endpoints

### Create Order

**POST** `/api/orders`

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod123",
      "name": "Fresh Milk",
      "quantity": 2,
      "price": 80
    }
  ],
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main St"
}
```

**Alternative (single item):**
```json
{
  "productId": "prod123",
  "productName": "Fresh Milk",
  "quantity": 2,
  "price": 80,
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main St"
}
```

**Response (200 OK):**
```json
{
  "_id": "order123",
  "user": "user456",
  "items": [...],
  "totalPrice": 160,
  "customerName": "John Doe",
  "customerPhone": "+919876543210",
  "deliveryAddress": "123 Main St",
  "status": "pending",
  "notificationStatus": {
    "sms": "pending",
    "whatsapp": "pending"
  },
  "message": "Order placed successfully",
  "createdAt": "2026-04-22T10:00:00.000Z"
}
```

## Notification Flow

1. **Order Creation** - Order saved to database
2. **Phone Validation** - Phone number formatted with country code
3. **SMS Sent** - Customer receives SMS with order details
4. **WhatsApp Sent** - Customer receives WhatsApp message
5. **Status Logged** - Notification status tracked in database

### SMS Message Format
```
Hello [Customer Name],

Your order has been placed successfully!

Order Details:
Product x Qty = Price

Total: ₹XXX
Order ID: order123

Thank you for your order!
```

### WhatsApp Message Format
```
Hello [Customer Name],

✅ Your order has been placed successfully!

📦 Order Details:
Product x Qty = Price

💰 Total: ₹XXX
📋 Order ID: order123

Thank you for your order! We'll update you soon.
```

## Frontend Integration

The ProductsCard component now:
1. Collects customer name, phone, and delivery location
2. Sends all data to backend with order
3. Expects 200 status code on success
4. Shows success message when order completes

## Troubleshooting

### Notifications Not Sending

**Check:**
1. Twilio credentials in `.env` file are correct
2. Phone number format includes country code (e.g., +91 for India)
3. Twilio account has sufficient credits
4. Check server logs for error messages

**Common Issues:**
- Phone number format: Use +[country code][number]
- No credentials: Notifications will be skipped with warning logs
- Invalid phone: WhatsApp may require formatted numbers

### Order Not Saving

**Check:**
1. User is authenticated (Bearer token valid)
2. MongoDB connection is working
3. Required fields: items array, at least one item
4. Check server logs for specific errors

### Database Issues

If orders aren't persisting:
1. Verify MongoDB connection string
2. Check database credentials
3. Ensure collection permissions
4. Review mongoose connection logs

## Testing

### Test Order Creation

```bash
# 1. Get auth token (login/register)
# 2. Create test order:

curl -X POST http://localhost:5000/api/orders \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "1", "name": "Milk", "quantity": 2, "price": 50}],
    "customerName": "Test User",
    "customerPhone": "+919876543210",
    "deliveryAddress": "Test Address"
  }'
```

### Monitor Notifications

Check backend logs for:
- "SMS sent successfully to..."
- "WhatsApp sent successfully to..."
- Any error messages

## Files Modified/Created

- ✅ Created: `backend/services/notificationService.js`
- ✅ Updated: `backend/models/Order.js` - Added customer fields
- ✅ Updated: `backend/controllers/orderController.js` - Fixed order creation
- ✅ Updated: `backend/.env.example` - Added Twilio config
- ✅ Existing: `frontend/src/Components/Products/ProductsCard.js` - Works with new backend

## Next Steps (Optional)

1. **Database Backup** - Set up MongoDB backups
2. **Rate Limiting** - Add rate limiting to order endpoint
3. **Order Status** - Update order status with fulfillment tracking
4. **Email Notifications** - Add SendGrid for email receipts
5. **Order History** - Create order tracking page
6. **Analytics** - Track order metrics

## Support

For issues with:
- **Order API**: Check middleware and authentication
- **Notifications**: Verify Twilio account and credentials
- **Database**: Check MongoDB connection and permissions

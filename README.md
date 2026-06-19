# Eventora - Full-Stack Event Booking Platform

Eventora is a MERN event booking application where users can browse events, verify their accounts with email OTP, submit booking requests, and track booking status. Admin users can create and manage events, review booking requests, confirm bookings, and mark payment status manually.

## Features

- User registration and login with JWT authentication.
- Email OTP verification for account activation.
- Email OTP verification before event booking.
- Role-based access for users and admins.
- Event CRUD for admins.
- Booking request flow with pending, confirmed, and cancelled statuses.
- Manual payment tracking for free and paid events.
- Admin dashboard data for bookings, revenue, and attendance.
- Email notifications through Nodemailer.

## Project Setup

### Prerequisites

- Node.js and npm
- MongoDB database, either local MongoDB or MongoDB Atlas
- Email account credentials for SMTP. Gmail requires an app password.

### Install dependencies

From the repository root:

```bash
npm install
npm run install:all
```

This installs root tooling plus dependencies for both `server` and `client`.

### Configure environment variables

Create `server/.env`:

```env
MONGO_URI=mongodb://localhost:27017/eventora
JWT_SECRET=replace_with_a_long_random_secret
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_app_password
PORT=5000
```

Create `client/.env` for local development:

```env
VITE_API_URL=http://localhost:5000/api
```

### Seed demo data

Optional, but useful for local testing:

```bash
cd server
npm run seed
```

The seed script creates demo users, an admin account, events, and sample bookings.

Demo credentials:

- Admin: `admin@eventora.com`
- User: `user@eventora.com`
- Password for seeded users: `password123`

### Run locally

From the repository root, start both apps:

```bash
npm run dev
```

The backend runs on `http://localhost:5000` by default. The frontend runs on the Vite dev URL, typically `http://localhost:5173`.

You can also run them separately:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

### Build frontend

```bash
npm run build
```

## Environment Variables

### Server

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes in production | MongoDB connection string. Local development falls back to `mongodb://localhost:27017/eventora` if omitted. |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWT access tokens. |
| `EMAIL_USER` | Yes for OTP/email flows | Email account used by Nodemailer as the sender. |
| `EMAIL_PASS` | Yes for OTP/email flows | Email password or provider app password. |
| `PORT` | No | Backend port. Defaults to `5000`. |
| `NODE_ENV` | No | When set to `production`, the server exports the app for deployment instead of starting a local listener. |

### Client

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Recommended | API base URL. Use `http://localhost:5000/api` locally. If omitted, the app currently falls back to the deployed backend URL configured in `client/src/utils/axios.js`. |

## API Documentation

Base URL for local development:

```text
http://localhost:5000/api
```

Protected endpoints require this header:

```text
Authorization: Bearer <jwt_token>
```

A Postman collection is included at `Eventora_Postman_Collection.json`.

### Health

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/` | No | Returns API health message. |

### Auth

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Registers a user and sends account verification OTP. |
| `POST` | `/api/auth/login` | No | Logs in a verified user and returns a JWT. Unverified users receive a verification-required response. |
| `POST` | `/api/auth/verify-otp` | No | Verifies account OTP and returns a JWT. |

Register body:

```json
{
  "name": "Demo User",
  "email": "user@example.com",
  "password": "password123"
}
```

Login body:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Verify OTP body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### Events

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/events` | No | Lists events. Supports `category` and `search` query params. |
| `GET` | `/api/events/:id` | No | Returns one event by ID. |
| `POST` | `/api/events` | Admin | Creates an event. |
| `PUT` | `/api/events/:id` | Admin | Updates an event. |
| `DELETE` | `/api/events/:id` | Admin | Deletes an event. |

Create event body:

```json
{
  "title": "Tech Conference",
  "description": "A full-day developer conference.",
  "date": "2026-08-15T10:00:00.000Z",
  "location": "Mumbai",
  "category": "Technology",
  "totalSeats": 100,
  "ticketPrice": 500,
  "image": "https://example.com/event.jpg"
}
```

### Bookings

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/bookings/send-otp` | User/Admin | Sends an OTP for booking confirmation. |
| `POST` | `/api/bookings` | User/Admin | Creates a pending booking after validating booking OTP. |
| `GET` | `/api/bookings/my` | User/Admin | Returns the current user's bookings. Admins receive all bookings. |
| `PUT` | `/api/bookings/:id/confirm` | Admin | Confirms a booking, sets payment status, deducts one available seat, and emails the user. |
| `DELETE` | `/api/bookings/:id` | Owner/Admin | Cancels a booking. Confirmed cancellations restore one seat. |

Create booking body:

```json
{
  "eventId": "event_mongodb_id",
  "otp": "123456"
}
```

Confirm booking body:

```json
{
  "paymentStatus": "paid"
}
```

`paymentStatus` can be `paid` or `not_paid`.

## Assumptions

- Users cannot self-register as admins. The register controller always creates `user` accounts; admin users must be seeded or updated directly in the database.
- OTP codes are sent by email and expire after 5 minutes.
- Payments are handled outside the application. Eventora only records whether an admin marked a booking as `paid` or `not_paid`.
- A booking starts as `pending`; seats are deducted only when an admin confirms the booking.
- The frontend expects the API URL to include `/api`, for example `http://localhost:5000/api`.
- CORS is currently limited to the local Vite URL and the configured deployed frontend URL in `server/server.js`.

## Design Decisions

- The app is split into separate `client` and `server` packages, with root scripts using `concurrently` for local full-stack development.
- Express controllers keep route definitions small and separate auth, event, and booking behavior.
- MongoDB models use Mongoose references so events can include creator data and bookings can populate user/event details.
- JWT is used for stateless API authentication, while role checks are handled by reusable middleware.
- OTP documents use a MongoDB TTL index through the `expires` schema option to automatically remove expired codes.
- Bookings use an admin approval workflow so free and paid events follow the same verification and capacity-management path.

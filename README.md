# LifeDrop — Peer-to-Peer Voluntary Blood Donation Network

LifeDrop is a direct, community-driven peer-to-peer blood donation network connecting two types of users:
1. **DONOR** — A generous individual voluntarily offering to donate blood.
2. **RECIPIENT** — A person or family member in critical need of compatible blood.

> **Zero Intermediaries**: LifeDrop operates as a direct peer-to-peer network. Zero administrative intermediaries, zero middleman inventory, and zero commercial fees. Donors connect directly with recipients during critical emergency moments.

---

## 📸 Screenshots & Application Preview

```
+-----------------------------------------------------------------------------------+
|                                WEB PORTAL PREVIEW                                 |
+-----------------------------------------------------------------------------------+
|  [Screenshot Placeholder: Web Homepage Hero & Emergency SOS CTA Button]          |
|  [Screenshot Placeholder: Web Emergency SOS Modal & Pulsing Radar Animation]      |
|  [Screenshot Placeholder: Web Donor Acceptance Card & Real-time Phone Reveal]     |
|  [Screenshot Placeholder: Web Live Donor Map with Radius Filtering]               |
+-----------------------------------------------------------------------------------+
|                                MOBILE APP PREVIEW                                 |
+-----------------------------------------------------------------------------------+
|  [Screenshot Placeholder: Mobile Recipient Home with Glowing Gradient SOS Button] |
|  [Screenshot Placeholder: Mobile SOS Bottom-Sheet with Auto-GPS Detection]        |
|  [Screenshot Placeholder: Mobile SOS Status Screen with 10s Polling & Call Card]  |
|  [Screenshot Placeholder: Mobile Donor In-App Urgent Notification & Accept Flow]  |
+-----------------------------------------------------------------------------------+
```

---

## 🛠️ Complete Tech Stack

### Backend
- **Core Platform**: Java 21, Spring Boot 3.2.5, Maven Wrapper (`mvnw` / `mvnw.cmd`)
- **Security**: Spring Security 6, Stateless JWT (`jjwt` 0.12.x), BCrypt password hashing
- **Persistence**: Spring Data JPA, Hibernate ORM, PostgreSQL (production), H2 (in-memory testing)
- **Matching & Geolocation**: Haversine spherical distance calculations with strict ABO/Rh clinical compatibility
- **Push Notification Service**: High-priority push alerts dispatched via Expo Push Notification REST API (`RestClient`)
- **Reliability & Rate Limiting**: 3 requests per 24 hours rate limit (HTTP 429), anti-race condition locking (HTTP 409 Conflict), community anti-spam auto-cancellation after 3 reports
- **API Documentation**: SpringDoc OpenAPI 3 / Swagger UI

### Web Portal
- **Framework & Tooling**: React 18, Vite 6, Tailwind CSS
- **Icons & Styling**: Lucide React, Custom Red Glow & SOS Shadow Tokens
- **Routing & State**: React Router v6, Context API (`AuthContext`, `ToastContext`, `SosContext`)
- **Maps & Geolocation**: Leaflet & React-Leaflet with browser `navigator.geolocation`
- **Networking**: Axios instance with automatic JWT Bearer interceptor and 401 logout handlers

### Mobile App
- **Framework & Runtime**: React Native 0.86, Expo SDK 57 (Expo Router / React Navigation 7)
- **Styling & Design System**: Plus Jakarta Sans custom typography, curated HSL & Hex tokens, responsive safe areas
- **Animations & Effects**: `Animated` radar ripple effects, `expo-linear-gradient` for glowing SOS button
- **Hardware Integration**: `expo-location` for real-time foreground GPS, `expo-notifications` for Android channels (`default` & `urgent`)
- **One-Tap Emergency Dials**: React Native `Linking` for instant calling to donors and national hotlines (112 / 108)

---

## 🚀 Setup & Execution Guide

### 1. Backend Setup

```bash
cd lifedrop/backend

# Run with dev profile (auto-seeds 12 Bhopal donors and 2 recipients)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# On Windows PowerShell:
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev

# Run all 61 automated tests:
.\mvnw.cmd test
```

Backend will start at: **`http://localhost:8080`**  
Interactive Swagger UI: **`http://localhost:8080/swagger-ui.html`**

---

### 2. Web Portal Setup

```bash
cd lifedrop/web

# Install dependencies
npm install

# Start development dev server
npm run dev

# Build production bundle
npm run build
```

Web application will run at: **`http://localhost:5173`**

---

### 3. Mobile App Setup

```bash
cd lifedrop/mobile

# Install dependencies
npm install

# Start Expo dev server
npx expo start
```

Press `a` to run on Android Emulator / Device or scan the QR code using the Expo Go app.

---

## 👥 Demo Logins (`dev` Profile)

When the backend starts with `-Dspring-boot.run.profiles=dev`, test accounts are seeded in Bhopal:

**Universal Password for ALL Demo Accounts**: `Password@123`

### Recipients
| Email | Name | Blood Group | Coordinates | City |
|---|---|---|---|---|
| `recipient1@lifedrop.test` | Rajesh Recipient | A+ | 23.2599, 77.4126 (Center) | Bhopal |
| `recipient2@lifedrop.test` | Sunita Recipient | O+ | 23.2210, 77.4380 (Habibganj) | Bhopal |

### Seeded Donors
| Email | Name | Blood Group | Phone | Area / Locality |
|---|---|---|---|---|
| `donor1@lifedrop.test` | Aarav Sharma | A+ | 9800000001 | MP Nagar (~3.6 km) |
| `donor2@lifedrop.test` | Pooja Patel | A+ | 9800000002 | Arera Colony (~5.2 km) |
| `donor3@lifedrop.test` | Rohan Verma | O+ | 9800000003 | TT Nagar (~2.4 km) |
| `donor4@lifedrop.test` | Sneha Jain | O- | 9800000004 | New Market (~2.8 km) |
| `donor5@lifedrop.test` | Vikram Singh | B+ | 9800000005 | Kolar Road (~8.7 km) |
| `donor6@lifedrop.test` | Ananya Mishra | B- | 9800000006 | Shahpura (~7.6 km) |
| `donor7@lifedrop.test` | Kunal Ghosh | AB+ | 9800000007 | Hoshangabad Rd (~10.2 km) |
| `donor8@lifedrop.test` | Neha Gupta | AB- | 9800000008 | Govindpura (~5.0 km) |
| `donor9@lifedrop.test` | Deepak Yadav | A- | 9800000009 | BHEL (~7.3 km) |
| `donor10@lifedrop.test` | Priyanka Tiwari | O+ | 9800000010 | Karond (~5.2 km) |
| `donor11@lifedrop.test` | Amit Saxena | A+ | 9800000011 | Bairagarh (~7.0 km) |
| `donor12@lifedrop.test` | Kavita Rao | B+ | 9800000012 | Ayodhya Bypass (~5.0 km) |

---

## 📖 REST API Overview

### 1. Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new Donor or Recipient (validates age 18-65 and blood group for donors).
- `POST /api/auth/login`: Authenticate with email/password; returns JWT and user profile.
- `GET /api/auth/me`: Get currently logged-in user profile.
- `POST /api/auth/logout`: Invalidate session client-side.

### 2. Recipient Operations (`/api/recipient`)
- `POST /api/recipient/sos`: Broadcast Emergency SOS (urgency `URGENT`, 25 km auto-retry to 50 km, high-priority push).
- `GET /api/recipient/sos/active`: Fetch currently active SOS broadcast.
- `POST /api/recipient/requests`: Create standard blood request (`NORMAL` or `URGENT`).
- `GET /api/recipient/requests`: List all blood requests for logged-in recipient.
- `GET /api/recipient/requests/{id}`: Detailed request status (reveals donor phone ONLY after acceptance).
- `PUT /api/recipient/requests/{id}/cancel`: Cancel an active blood request.
- `POST /api/recipient/requests/{id}/complete`: Mark request completed (updates donor's `lastDonatedDate`).
- `GET /api/recipient/donors/nearby`: Discover compatible donors within radius (privacy protected: no phone or exact GPS).

### 3. Donor Operations (`/api/donor`)
- `GET /api/donor/requests/available`: List nearby open requests matching donor's blood group.
- `GET /api/donor/requests/accepted`: List requests accepted by the donor.
- `PUT /api/donor/requests/{id}/accept`: Accept request (concurrency locked; first-come-first-served).
- `PUT /api/donor/availability`: Toggle availability on/off.
- `GET /api/donor/stats`: View personal donation count and eligibility cooldown status.

### 4. Location & Push Notifications (`/api/users` & `/api/notifications`)
- `PUT /api/users/location`: Update user GPS coordinates (throttled).
- `PUT /api/users/push-token`: Register Expo push token.
- `DELETE /api/users/push-token`: Deregister Expo push token on logout.
- `GET /api/notifications`: Retrieve in-app notifications (paged).
- `GET /api/notifications/unread-count`: Fast polling for notification bell badge.
- `PUT /api/notifications/{id}/read`: Mark notification as read.
- `PUT /api/notifications/mark-all-read`: Mark all notifications as read.

### 5. Community Safety (`/api/requests`)
- `POST /api/requests/{id}/report`: Report fraudulent or commercial requests (auto-cancels after 3 reports).

---

## ⚖️ Safety & Medical Disclaimer

LifeDrop is a voluntary, non-commercial software bridge connecting donors and recipients directly. In any critical medical emergency, always call national emergency services (**112**) or ambulance services (**108**).

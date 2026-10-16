# LifeDrop — Peer-to-Peer Blood Donation Network

LifeDrop is a direct peer-to-peer blood donation network connecting only two types of users:
1. **DONOR** — A generous individual willing to donate blood.
2. **RECIPIENT** — A person or family member in need of blood.

> **Zero Intermediaries**: LifeDrop has **NO** hospitals, **NO** blood banks, **NO** trauma centers, and **NO** administrative inventory. Donors connect directly with recipients.

---

## 🛠️ Backend Architecture & Tech Stack

- **Platform**: Java 17, Spring Boot 3.2.5, Maven
- **Security**: Spring Security 6, JWT (`jjwt` 0.12.x), BCrypt password hashing, stateless sessions
- **Persistence**: Spring Data JPA, Hibernate, PostgreSQL (production/local), H2 in-memory (testing/embedded)
- **Matching Engine**: Haversine distance calculations and strict ABO/Rh blood compatibility rules
- **Push Notifications**: Expo Push Notification API (`https://exp.host/--/api/v2/push/send`) via Spring 6 `RestClient`
- **Safety**: Rate limiting (3 requests/24h), fake request reporting (auto-cancellation after 3 reports), anti-race condition locking (`409 Conflict`), and privacy boundaries
- **API Documentation**: SpringDoc OpenAPI 3 / Swagger UI

---

## ⚙️ Environment Variables

The backend reads configuration from environment variables with sensible local defaults:

| Variable | Description | Default Value |
|---|---|---|
| `DB_URL` | PostgreSQL JDBC Connection URL | `jdbc:postgresql://localhost:5432/lifedrop` |
| `DB_USER` | Database Username | `postgres` |
| `DB_PASS` | Database Password | *(empty)* |
| `JWT_SECRET` | Secret key for signing HMAC-SHA256 JWT tokens (min 256 bits) | `LifeDropDefaultDevSecret_ChangeMe_In_Production_1234567890abcdef` |
| `JWT_EXPIRATION` | JWT token lifespan in milliseconds | `86400000` (24 hours) |
| `DONATION_GAP_DAYS`| Mandatory eligibility recovery period between donations | `90` (days) |
| `EXPO_PUSH_URL` | Outgoing Expo Push API endpoint | `https://exp.host/--/api/v2/push/send` |
| `SERVER_PORT` | HTTP server listening port | `8080` |

---

## 🚀 Getting Started

### Prerequisites
- **JDK 17 or 21** installed (`java -version`)
- **Maven** (or use the included `./mvnw` / `mvnw.cmd` wrapper)
- *(Optional)* PostgreSQL 14+ running locally on port 5432 (or run with dev/test profile)

### Run the Application

```bash
cd lifedrop/backend

# Standard execution
./mvnw spring-boot:run

# With 'dev' profile (Seeds 12 Bhopal donors and 2 recipients automatically)
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

On Windows PowerShell:
```powershell
cd lifedrop\backend
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

### Running Tests

```bash
cd lifedrop/backend
./mvnw test
```

---

## 👥 Demo Logins (`dev` Profile)

When started with the `dev` profile (`-Dspring-boot.run.profiles=dev`), LifeDrop automatically seeds 12 donors with mixed blood groups and 2 recipients centered in **Bhopal, Madhya Pradesh** (within a 15 km radius):

**Password for ALL demo accounts:** `Password@123`

### Recipients
| Email | Name | Blood Group | Coordinates | City |
|---|---|---|---|---|
| `recipient1@lifedrop.test` | Rajesh Recipient | A+ | 23.2599, 77.4126 (Center) | Bhopal |
| `recipient2@lifedrop.test` | Sunita Recipient | O+ | 23.2210, 77.4380 (Habibganj) | Bhopal |

### Donors
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

## 📖 API Documentation & Swagger UI

Once running, interactive OpenAPI / Swagger UI documentation is available at:
👉 **`http://localhost:8080/swagger-ui.html`**

### Authorize via Swagger UI:
1. Log in via `POST /api/auth/login` using any demo email and `Password@123`.
2. Copy the `token` string from the response.
3. Click the green **Authorize 🔓** button at the top right of the Swagger UI.
4. Enter the token into the value box and click **Authorize**. All subsequent requests will automatically include the `Authorization: Bearer <token>` header.

---

## 🛡️ Safety & Reliability Features

1. **Rate Limiting (HTTP 429)**: Recipients are limited to creating at most 3 blood requests per 24 hours to prevent spam and platform abuse.
2. **Community Safety Reporting**: Any authenticated user can report suspicious requests via `POST /api/requests/{id}/report`. A user cannot report the same request twice. Upon receiving 3 reports, the request and pending responses are automatically cancelled.
3. **Concurrency Control**: First-come-first-served donor acceptance. If a second donor attempts to accept an already-accepted request, the system returns `409 Conflict`.
4. **Strict Privacy Shield**:
   - Donors only see the recipient's first name, city, and distance. The recipient's phone number is withheld until the donor accepts.
   - Recipients never see donor contact information until a donor accepts.
5. **No Password or Token Logging**: Passwords, hashes, and authentication tokens are strictly excluded from all log output.

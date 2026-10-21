# LifeDrop — Complete Manual Cloud Deployment & Android APK Guide

This personalized guide walks you through deploying **LifeDrop** end-to-end:
- **Database**: PostgreSQL on Neon (Serverless Cloud)
- **Backend**: Spring Boot 3.2.5 on Render (Docker container)
- **Web Frontend**: React 18 + Vite on Vercel
- **Mobile App**: React Native Expo (Android APK via EAS Build)

---

## 1. Project Architecture & Configuration Map

| Component | Repository Path | Framework / Tool | Config Files | Port / Default URL |
| :--- | :--- | :--- | :--- | :--- |
| **Backend** | `lifedrop/backend` | Spring Boot 3.2.5, Java 17 | `pom.xml`, `application.properties`, `application-prod.properties`, `Dockerfile` | `8080` (dynamic `$PORT` on Render) |
| **Web** | `lifedrop/web` | React 18, Vite 6, Tailwind | `package.json`, `vite.config.js` | `VITE_API_URL` |
| **Mobile** | `lifedrop/mobile` | React Native, Expo SDK 52 | `app.json`, `eas.json` | `EXPO_PUBLIC_API_URL` |
| **Database** | Cloud Neon | PostgreSQL 16 | Managed Neon Project | Neon SSL endpoint:5432 |

---

## 2. Deployment Roadmap

```mermaid
graph TD
    A["Phase 1: Local Project Validation"] --> B["Phase 2: Neon Cloud Database Setup"]
    B --> C["Phase 3: Connect & Test Backend with Neon"]
    C --> D["Phase 4: Commit & Push to GitHub"]
    D --> E["Phase 5: Deploy Backend to Render"]
    E --> F["Phase 6: Verify Live Backend Health & APIs"]
    F --> G["Phase 7: Deploy Web to Vercel (Optional)"]
    F --> H["Phase 8: Connect Mobile App to Live Render URL"]
    H --> I["Phase 9: Build Android APK with Expo EAS (Client Delivery)"]
    I --> J["Phase 10: End-to-End Real Device Testing"]
    J --> K["Phase 11: Custom Domain & Play Store (Production)"]
```

### Which Phases are Mandatory for Delivering an Android APK to a Client?
- **Mandatory (Phases 1, 2, 3, 4, 5, 6, 8, 9, 10):**
  A mobile APK cannot work in isolation; it must communicate with an active, reachable backend API on the internet (`https://...onrender.com`), which requires an active cloud database (`Neon`).
- **Optional for APK (Phase 7):**
  Deploying the web app to Vercel is only required if the client also needs a browser dashboard.
- **Optional for APK (Phase 11):**
  Custom domain and Play Store submission (`.aab` bundle) are only needed when releasing publicly on the Google Play Store. For testing and direct client delivery, the direct `.apk` generated in Phase 9 is sufficient.

---

## 3. Render Production Environment Variables Reference

Configure these in Render under **Your Web Service > Environment**:

| Variable Name | Recommended Value Format | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `prod` | Loads `application-prod.properties` |
| `PORT` | `8080` | Port listened to by container |
| `DB_URL` | `jdbc:postgresql://<neon-host>/neondb?sslmode=require` | Neon JDBC connection string |
| `DB_USER` | `neondb_owner` (or your Neon username) | Neon database user |
| `DB_PASS` | `[YOUR_NEON_PASSWORD]` | Neon database password |
| `JWT_SECRET` | `[64_CHAR_HEX_KEY]` | 256-bit secret key for HMAC-SHA256 signing |
| `JWT_EXPIRATION` | `86400000` | Token expiration in ms (24 hours) |
| `CORS_ALLOWED_ORIGINS` | `https://lifedrop.vercel.app,https://lifedrop.onrender.com` | Allowed domains for browser access |
| `DONATION_GAP_DAYS` | `90` | Clinical gap between blood donations |

*(Note: If you provide a single `DATABASE_URL=postgresql://user:pass@host/neondb?sslmode=require`, the built-in `DatabaseUrlEnvironmentInitializer` automatically extracts the username and password and normalizes the JDBC URL).*

---

## 4. Key Pre-Flight Checklist

- [ ] Java 17 and Maven installed locally.
- [ ] Neon account created at [console.neon.tech](https://console.neon.tech).
- [ ] Render account created at [render.com](https://render.com).
- [ ] GitHub repository synced (`https://github.com/hiteshsao/Blood-APK.git`).
- [ ] Node.js (v18+) and Expo EAS CLI (`npm install -g eas-cli`) installed.
- [ ] Expo account created at [expo.dev](https://expo.dev).

# City Help 24x7 — Phase 1 + Phase 2 guide

## What is built
**Phase 1 – Blood Service**: unified account (USER / ADMIN, optional donor profile), city selector, new Home screen, Requests hub
("I Requested" / "I Can Help"), donor onboarding, hospitals + blood banks directory (information only), SOS centre tab.

**Phase 2 – Service Providers** (ON by default; the app is services-first. Turn off with `FEATURE_SERVICES=false`): categories, provider registration with admin verification,
discovery (filters + sort, phone/address hidden), bookings (PENDING → ACCEPTED/REJECTED/CANCELLED/EXPIRED, ACCEPTED → COMPLETED/CANCELLED),
privacy shield, reviews, reports (3 reports auto-suspend), 5-pending-booking cap, 48 h expiry scheduler, in-app + push notifications.

Phases 3–6 (Directory, News, Jobs, Buy & Sell) are only feature flags for now: `FEATURE_DIRECTORY`, `FEATURE_NEWS`, `FEATURE_JOBS`, `FEATURE_BUYSELL`.

## Environment variables
| Variable | Default | Purpose |
|---|---|---|
| `FEATURE_SERVICES` | true | Phase 2 services. Set `false` to fall back to the blood-only app (API answers 404, app shows the Phase 1 tabs and Home) |
| `FACILITIES_SEED_SAMPLE` | false (true in `dev`) | Seeds sample hospitals / blood banks. They are named "Sample ..." |
| (dev profile only) | — | Seeds 6 VERIFIED "Sample ..." service providers (linked to donor3–donor8) so Home has demo data |
| `ADMIN_BOOTSTRAP_EMAIL` | empty | Existing user with this email becomes ADMIN on startup |

Admins can never self-register. Register normally, set `ADMIN_BOOTSTRAP_EMAIL`, restart the backend.

## Run
```powershell
cd backend
.\mvnw.cmd test                      # run all tests first
$env:SPRING_PROFILES_ACTIVE="dev"; .\mvnw.cmd spring-boot:run
cd ..\mobile; npm install; npx expo start
```

## Phase 2 API (all need a Bearer token)
| Method + path | Who | Notes |
|---|---|---|
| GET `/api/services/categories` | any | 12 seeded categories, first 6 featured |
| GET `/api/services/providers` | any | `categoryId, cityId, lat, lng, radiusKm, q, minRating, sort=rating\|distance\|price, page, size` |
| GET `/api/services/providers/{id}` | any | phone/address only after an ACCEPTED booking (or owner) |
| GET `/api/services/providers/{id}/reviews` | any | |
| POST `/api/services/providers/{id}/report` | any | `{reason}` — 3 distinct reports suspend |
| POST `/api/services/providers` | any | register, starts PENDING |
| GET/PUT `/api/services/providers/me` | provider | edit; a rejected profile returns to PENDING |
| PUT `/api/services/providers/me/availability` | provider | `{available}` |
| POST `/api/services/bookings` | customer | `{providerId, scheduledAt, description, address}` |
| GET `/api/services/bookings/mine` / `/provider` / `/{id}` | party | |
| PUT `/api/services/bookings/{id}/accept\|reject\|cancel\|complete` | see rules | |
| POST `/api/services/bookings/{id}/review` | customer | `{rating 1-5, comment}` after COMPLETED, once |
| GET `/api/admin/services/providers?status=` | admin | |
| PUT `/api/admin/services/providers/{id}/verify\|reject\|suspend\|reinstate` | admin | `{reason}` for reject/suspend |

## Manual QA checklist
1. Register 2 users. Promote one to admin via `ADMIN_BOOTSTRAP_EMAIL`.
2. User A: Profile → Service provider → Register. Status shows "under review".
3. Admin: `PUT /api/admin/services/providers/{id}/verify` (Swagger). User A gets a notification.
4. User B: Services tab → pick category → provider card shows no phone → Book Now → request sent.
5. User A: Bookings → Received → Accept. User B now sees phone + address; before that they were hidden.
6. User A: Mark Completed. User B: rate 1–5. Provider rating updates.
7. User B creates 6 pending bookings with different providers: the 6th is refused.
8. Turn `FEATURE_SERVICES=false`: tabs disappear, `/api/services/**` returns 404, blood flows still work.
9. Old DONOR / RECIPIENT accounts still log in and work.

## Known limits
- The Java backend was syntax-checked but NOT compiled or run in the build environment: run `.\mvnw.cmd test` before shipping.
- Admin panel for provider verification is API-only (Swagger) for now; a web admin page can be added later.
- Sample facilities are placeholders. Replace them with real data via `/api/admin/facilities`.

# LifeDrop - Antigravity Prompts (clean copy)

Send Prompt 0 first, then one prompt at a time in order. Test after each step.


---

## PROMPT 0 - Master Context (sabse pehle ye bhejo)

*Area:* Setup  
*When:* Naya chat / workspace kholne ke baad sabse pehla message. Isme code mat likhwana, sirf samjhane do.

```text
## ROLE
You are a senior full-stack engineer and UI designer. We will build a project called "LifeDrop" step by step. Read this whole context carefully and remember it for every next prompt. Do NOT write any code in this message. Reply only with a short summary of your understanding and the folder plan.

## PRODUCT
LifeDrop is a Blood Donation Network that connects ONLY two kinds of users:
1. DONOR - a person who is willing to donate blood.
2. RECIPIENT - a person (or family member) who needs blood.
There are NO hospitals, NO blood banks, NO trauma centers and NO admin-managed blood inventory in this product. Never add them anywhere (UI text, database, API, images).
Core idea: a recipient creates a blood request, the system finds compatible donors nearby, donors accept or reject, and only after a donor accepts, the donor's phone number is shown to the recipient.

## TECH STACK
- Backend: Java 17, Spring Boot 3.x, Maven, Spring Security + JWT (jjwt) + BCrypt, Spring Data JPA (Hibernate), Lombok, springdoc-openapi (Swagger).
- Database: PostgreSQL.
- Mobile app (APK): React Native with Expo (JavaScript), React Navigation, Axios, expo-location, expo-secure-store, expo-notifications, react-native-maps.
- Web (optional): React 18 + Vite + React Router + Axios + Tailwind CSS + lucide-react icons + Leaflet (OpenStreetMap).
- Nearby search: Haversine formula inside a native SQL query.

## FOLDER STRUCTURE
lifedrop/
  backend/   (Spring Boot)
  web/       (React + Vite)
  mobile/    (React Native + Expo)
  README.md

## CORE FEATURES
- Auth: register, login, logout, role selection (DONOR / RECIPIENT), JWT, BCrypt password hashing.
- Donor: profile, availability ON/OFF, 90-day gap after donation, incoming requests, accept/reject, donation history.
- Recipient: create blood request, see nearby donors (map + list with distance), track request status, see donor contact after accept, mark request completed.
- Nearby location: GPS latitude/longitude, radius search, blood group compatibility matching.
- Emergency SOS: one-tap URGENT request with a wider search radius.
- Notifications: in-app notifications + push notifications.
- Safety: phone number hidden until accept, report fake request, daily request limit, medical disclaimer.

## DESIGN SYSTEM (use in EVERY UI screen)
Style: clean, modern, friendly medical look. Light pink page background, white cards, crimson red accents, dark navy text.
Colors: primary-dark #991B1B, primary #B91C1C, accent/SOS #DC2626, SOS-gradient-end #BE123C, page-bg #FFF5F5, soft-pink #FEE2E2, border-pink #FECACA, ink #0F172A, muted #475569, light-muted #94A3B8, white #FFFFFF, success #16A34A, warning #F59E0B.
Font: Plus Jakarta Sans (weights 400 to 800). Headings use weight 800 with tight letter spacing.
Shape: buttons radius 12px, cards radius 20px, badges fully rounded (pill). Red soft glow shadow on primary and SOS buttons: 0 10px 30px rgba(185,28,28,0.30).
Buttons: Primary = gradient #991B1B to #C62828 with white text. Secondary = #FFF1F1 background, red text, 1px #FECACA border, heart icon. SOS = gradient #DC2626 to #BE123C with alert icon and glow.
Logo: rounded-square dark red gradient with a white blood-drop icon, text "Life" in navy + "Drop" in red, and a small slate tagline "BLOOD DONATION NETWORK".

## WORKING RULES
1. Do only what the current prompt asks. Do not touch unrelated files.
2. Before coding, show a short plan. After coding, list created/changed files, the command to run, and how to test.
3. Layered architecture (Controller -> Service -> Repository), DTOs for all requests/responses, validation on inputs. Never return the password hash. Never return a phone number before a donor accepts.
4. No hard-coded secrets. Use environment variables.
5. Code must compile and run. Fix your own errors before finishing.
6. UI text must be simple, friendly English. No fake claims (no certifications, no fake statistics, no hospital or blood-bank wording).
7. Mobile first: every screen must look good on a 360px wide phone.
```

**Check:**
- Antigravity ne bina code likhe summary di ho.
- Summary me 'no hospital / no blood bank' wali baat likhi ho.
- Agar Antigravity me Rules / Workspace instructions ka option hai to ye Master Context wahan bhi save kar do.


---

## PROMPT 1 - Backend Project Setup

*Area:* Backend  
*When:* Master Context ke baad. Pehle PostgreSQL install kar lo aur `lifedrop` naam ka database bana lo.

```text
## TASK
Create the Spring Boot backend in lifedrop/backend.

## REQUIREMENTS
- Maven project, Java 17, Spring Boot 3.x, group com.lifedrop, artifact backend.
- Dependencies: spring-boot-starter-web, data-jpa, security, validation, postgresql driver, lombok, springdoc-openapi-starter-webmvc-ui, jjwt-api + jjwt-impl + jjwt-jackson (0.12.x).
- Create these packages under com.lifedrop: config, controller, dto, entity, enums, exception, repository, security, service, util.
- application.properties must read values from environment variables with local defaults: DB_URL (jdbc:postgresql://localhost:5432/lifedrop), DB_USER (postgres), DB_PASS, JWT_SECRET, JWT_EXPIRATION (86400000), server.port=8080, spring.jpa.hibernate.ddl-auto=update, spring.jpa.open-in-view=false.
- Add CorsConfig allowing all origins for development.
- Add HealthController: GET /api/health returns {"status":"UP"}.
- Add a proper .gitignore (target/, .env, application-local.properties, firebase json files).

## ALSO EXPLAIN
- How to create the PostgreSQL database named lifedrop.
- The exact command to run the app.

## ACCEPTANCE
App starts on port 8080 and GET http://localhost:8080/api/health returns status UP. Swagger UI opens at /swagger-ui.html.
```

**Check:**
- Terminal me app bina error ke start ho.
- Browser me /api/health aur /swagger-ui.html khulte hain.
- Git commit kar do: 'step 1 backend setup'.


---

## PROMPT 2 - Entities, Enums and Repositories

*Area:* Backend  
*When:* Setup chalne ke baad. Ye database ki tables banata hai.

```text
## TASK
Create enums, JPA entities and Spring Data repositories in lifedrop/backend.

## ENUMS
- Role: DONOR, RECIPIENT
- BloodGroup: A_POSITIVE, A_NEGATIVE, B_POSITIVE, B_NEGATIVE, AB_POSITIVE, AB_NEGATIVE, O_POSITIVE, O_NEGATIVE. Each has a display label such as "A+" and a static fromLabel() helper.
- RequestStatus: PENDING, ACCEPTED, COMPLETED, CANCELLED, EXPIRED
- ResponseStatus: PENDING, ACCEPTED, REJECTED, EXPIRED
- Urgency: NORMAL, URGENT

## ENTITIES (all with createdAt)
1. User (table users): id, name, email (unique), password, phone, role, bloodGroup, age, gender, city, latitude, longitude, available (default true), lastDonatedDate, pushToken, active (default true), createdAt.
2. BloodRequest (table blood_requests): id, recipient (ManyToOne User), patientName, bloodGroup, unitsNeeded, urgency, city, latitude, longitude, radiusKm (default 10), message, requiredBy (LocalDateTime), status, acceptedDonor (ManyToOne User, nullable), createdAt.
3. RequestResponse (table request_responses): id, request (ManyToOne), donor (ManyToOne), status, respondedAt. Unique constraint on (request_id, donor_id).
4. Notification (table notifications): id, user (ManyToOne), title, body, type, relatedRequestId, read (boolean), createdAt.

## REPOSITORIES
UserRepository (findByEmail, existsByEmail), BloodRequestRepository, RequestResponseRepository, NotificationRepository with sensible finder methods (for example by recipient, by donor and status, by user ordered by createdAt desc).

## RULES
Use Lombok, LAZY fetching, and add indexes on users(role, blood_group, available) and blood_requests(status).

## ACCEPTANCE
App starts and Hibernate creates all 4 tables in PostgreSQL without errors.
```

**Check:**
- pgAdmin / DBeaver me users, blood_requests, request_responses, notifications tables dikhni chahiye.
- Git commit: 'step 2 entities'.


---

## PROMPT 3 - Authentication and JWT Security

*Area:* Backend  
*When:* Tables ban jaane ke baad. Login system yahin banta hai.

```text
## TASK
Build register/login with JWT and role-based security.

## DTOs
- RegisterRequest: name, email, password (min 8), phone (10 digits), role, bloodGroup (REQUIRED when role = DONOR), age (donor must be 18 to 65), gender, city, latitude, longitude.
- LoginRequest: email, password.
- AuthResponse: token, and a UserSummary (id, name, email, role, bloodGroup, city, available).
- ApiResponse<T> wrapper: success, message, data.

## ENDPOINTS
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me (needs token)

## SECURITY
- BCrypt password encoder.
- JwtUtil (generate, validate, read email and role) using JWT_SECRET and JWT_EXPIRATION from properties.
- JwtAuthFilter reading "Authorization: Bearer <token>".
- CustomUserDetailsService.
- SecurityConfig: stateless sessions, CSRF disabled, public routes = /api/auth/**, /api/health, swagger URLs. /api/donor/** only for DONOR. /api/recipient/** only for RECIPIENT. Everything else needs login.
- Return clean JSON 401/403 errors (no HTML pages).
- GlobalExceptionHandler with ResourceNotFoundException, BadRequestException, validation errors (field-wise messages) and a generic fallback.

## ACCEPTANCE
Register donor, register recipient, login, call /api/auth/me with token. Wrong password returns 401. Donor calling a /api/recipient/** route returns 403. Show me sample Postman/curl requests.
```

**Check:**
- Postman me register + login + /me test karo.
- Password DB me hashed (BCrypt) dikhna chahiye, plain nahi.
- Git commit: 'step 3 auth'.


---

## PROMPT 4 - Profile, Location and Donor Availability

*Area:* Backend  
*When:* Auth chalne ke baad.

```text
## TASK
Add profile, location and donor availability APIs.

## ENDPOINTS
- GET  /api/users/me - full profile of logged-in user.
- PUT  /api/users/me - update name, phone, city, age, gender, bloodGroup (donor), never email or role.
- PUT  /api/users/location - body {latitude, longitude}; validate ranges (-90..90, -180..180).
- PUT  /api/users/push-token - body {pushToken}.
- PUT  /api/donor/availability - body {available: true/false}.
- GET  /api/donor/eligibility - returns {eligible, lastDonatedDate, nextEligibleDate, daysRemaining}.

## BUSINESS RULE
Put donation.gap-days=90 in application.properties. A donor is eligible only if lastDonatedDate is null or at least 90 days ago. If a donor who is not eligible tries to turn availability ON, return a 400 error with a clear message and the next eligible date.

## ACCEPTANCE
Location and availability update correctly. Eligibility returns correct days remaining. Add 3 unit tests for the eligibility logic.
```

**Check:**
- Donor ka last donated date manually DB me set karke eligibility test karo.
- Git commit: 'step 4 profile location'.


---

## PROMPT 5 - Blood Compatibility and Nearby Donor Search

*Area:* Backend  
*When:* Ye project ka dil hai (matching logic). Dhyan se test karna.

```text
## TASK
Build blood compatibility and nearby donor search.

## BloodCompatibility (util class)
Given the RECIPIENT blood group, return the list of DONOR groups that can donate:
A+  <- A+, A-, O+, O-
A-  <- A-, O-
B+  <- B+, B-, O+, O-
B-  <- B-, O-
AB+ <- all 8 groups
AB- <- AB-, A-, B-, O-
O+  <- O+, O-
O-  <- O- only

## DistanceCalculator
Haversine distance in km between two lat/lng points.

## UserRepository
Add a native query findNearbyDonors(groups, lat, lng, radiusKm, eligibleBefore) that returns DONORS where: role = 'DONOR', active = true, available = true, blood_group IN groups, latitude/longitude not null, (last_donated_date IS NULL OR last_donated_date <= eligibleBefore), and Haversine distance < radiusKm. Order by distance ascending. Also return the distance value (use a projection interface).

## MatchingService
findCompatibleDonors(bloodGroup, lat, lng, radiusKm) using the above and donation.gap-days.

## ENDPOINT
GET /api/recipient/donors/nearby?bloodGroup=&lat=&lng=&radiusKm=10
Response items (DonorResponseDto): id, firstName only, bloodGroup, distanceKm (1 decimal), city, lastDonatedDate. NEVER return phone, email or exact coordinates here.

## ACCEPTANCE
Unit tests for every recipient blood group in the compatibility table. Tests for the distance calculator. Explain how the SQL works in 5 lines.
```

**Check:**
- 8 recipient groups ka compatibility test pass hona chahiye.
- Response me phone / email nahi aana chahiye.
- Git commit: 'step 5 matching'.


---

## PROMPT 6 - Blood Request Flow (Create, Accept, Reject, Complete)

*Area:* Backend  
*When:* Matching ke baad. Ye sabse bada backend step hai; Antigravity ko Planning mode me chalao.

```text
## TASK
Build the complete blood request flow.

## RECIPIENT ENDPOINTS
- POST /api/recipient/requests - create request (patientName, bloodGroup, unitsNeeded, urgency, city, latitude, longitude, radiusKm, message, requiredBy). Save with status PENDING, then find compatible nearby donors with MatchingService (use radius 10 km for NORMAL and 25 km for URGENT unless radiusKm is given). Create one RequestResponse (PENDING) per matched donor. Call NotificationService.notifyDonorsOfNewRequest() (create an interface + a simple logging implementation now; real push comes later). Return the request plus matchedDonorCount.
- GET  /api/recipient/requests - my requests (newest first).
- GET  /api/recipient/requests/{id} - details. If status is ACCEPTED or COMPLETED include the accepted donor's name and phone. Otherwise never include any donor phone.
- PUT  /api/recipient/requests/{id}/cancel
- POST /api/recipient/requests/{id}/complete - only when ACCEPTED; set status COMPLETED and set the donor's lastDonatedDate = today.

## DONOR ENDPOINTS
- GET  /api/donor/requests - incoming requests where my response is PENDING.
- GET  /api/donor/requests/{id} - details (recipient first name, blood group, city, urgency, message, distance). Recipient phone only if I accepted.
- POST /api/donor/requests/{id}/accept - @Transactional. Only first donor wins: if the request is no longer PENDING return 409. Set acceptedDonor, status ACCEPTED, my response ACCEPTED, all other responses EXPIRED. Return recipient contact.
- POST /api/donor/requests/{id}/reject
- GET  /api/donor/history - requests I accepted/completed.

## RULES
- A donor can respond only to requests that were matched to him.
- A recipient can manage only his own requests.
- A scheduled job (@Scheduled every 15 minutes) marks PENDING requests older than 24 hours as EXPIRED.
- Enable scheduling with @EnableScheduling.

## ACCEPTANCE
Write an integration test for: create request -> donor accepts -> second donor accept fails with 409 -> recipient completes -> donor lastDonatedDate updated. Provide a Postman collection (JSON) for all endpoints.
```

**Check:**
- Phone number sirf accept ke baad dikhna chahiye (dono taraf).
- Do donors ek saath accept karein to sirf pehla jeete.
- Git commit: 'step 6 request flow'.


---

## PROMPT 7 - Notifications (In-app + Push)

*Area:* Backend  
*When:* Request flow chalne ke baad.

```text
## TASK
Implement real notifications in the backend.

## NotificationService (replace the logging stub)
- Always save an in-app Notification row for the target user.
- Also send a push notification when the user has a pushToken. Use the Expo Push API (POST https://exp.host/--/api/v2/push/send) with Spring RestClient. Include title, body, sound "default", and data {requestId, type}. For URGENT requests set priority "high" and channelId "urgent".
- If sending fails, log the error and continue. Never fail the main request because of a push error.

## WHEN TO NOTIFY
- New request -> every matched donor ("A+ blood needed near you").
- Donor accepts -> the recipient ("A donor accepted your request").
- Request cancelled -> donors who were still PENDING.
- Request completed -> the donor ("Thank you for saving a life").

## ENDPOINTS
- GET /api/notifications (paged, newest first)
- GET /api/notifications/unread-count
- PUT /api/notifications/{id}/read
- PUT /api/notifications/read-all

## ACCEPTANCE
Show how to test using a real Expo push token later. For now log the outgoing payload and write unit tests with a mocked RestClient.
```

**Check:**
- Request create karne par donors ke notifications table me rows aani chahiye.
- Git commit: 'step 7 notifications'.


---

## PROMPT 8 - Safety, Seed Data, Swagger and Tests

*Area:* Backend  
*When:* Backend lagbhag complete. Ab usse mazboot banate hain.

```text
## TASK
Harden the backend and add demo data.

## SAFETY
- Report fake request: POST /api/requests/{id}/report with {reason}. Create a Report entity (id, reporter, request, reason, createdAt). A user cannot report the same request twice. After 3 reports, mark the request CANCELLED.
- Rate limit: a recipient may create at most 3 requests per 24 hours. Return 429 with a clear message.
- Never log passwords or tokens.

## DEMO DATA
Create a dev-profile CommandLineRunner (profile "dev") that inserts 12 donors with mixed blood groups around Bhopal, Madhya Pradesh (center 23.2599, 77.4126, spread within 15 km) and 2 recipients. Password for all: Password@123. Emails like donor1@lifedrop.test and recipient1@lifedrop.test. Insert only if the users table is empty.

## DOCS AND TESTS
- Swagger annotations: tag every controller, add JWT "Authorize" button support.
- Add README section for backend: setup, env variables, run, test, demo logins.
- Run all tests and fix failures.

## ACCEPTANCE
mvn test passes. With the dev profile, a recipient request for A+ near Bhopal matches seeded donors.
```

**Check:**
- Swagger me Authorize button se token daal kar saari APIs chal rahi ho.
- Git commit: 'step 8 safety and seed'. Ab backend ready hai.


---

## PROMPT 9 - Web: Setup, Theme and Landing Page

*Area:* Web (optional)  
*When:* Agar sirf APK chahiye to Prompt 9 aur 10 skip karke Prompt 11 par jao. Landing page isi theme ka hai jo aapne screenshot me bheja.

```text
## TASK
Create the React web app in lifedrop/web.

## SETUP
Vite + React 18, React Router, Axios, Tailwind CSS (latest stable), lucide-react, react-leaflet + leaflet. Load Plus Jakarta Sans from Google Fonts. Put all design tokens from the DESIGN SYSTEM in the Master Context into the Tailwind theme / CSS variables. Create folders: src/api, src/components, src/context, src/pages, src/hooks, src/utils.

## LAYOUT COMPONENTS
1. TopAlertBar - red gradient strip (#991B1B to #C62828), small white bold text. A rounded "LIVE" pill at left and text: "Medical emergency? Call 112 (Emergency) / 108 (Ambulance)".
2. Navbar - sticky, white, 1px bottom border. Left: logo (rounded-square dark-red gradient with white drop icon, "LifeDrop" with Life navy and Drop red, tagline BLOOD DONATION NETWORK). Center links: Home, How It Works, Find Donors, Blood Requests. The active link has a soft pink pill background (#FEE2E2) and red text. Right: "EMERGENCY SOS" pill button (red gradient, alert icon, glow shadow), a thin divider, "Sign In" text link, "Register" dark red button. On mobile collapse into a hamburger menu. Do NOT add an Admin link.
3. Footer - logo, short links, privacy/terms links, and the disclaimer: "LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112."

## LANDING PAGE (Home)
Hero section on #FFF5F5 background, centered:
- Small pill badge: "Community-driven Blood Donor Network" (do NOT say certified).
- H1 in two lines, very bold, tight tracking: "Every Drop Counts." in navy and "Every Life Saved." in red (second line in the primary-dark to accent gradient).
- Subtitle in slate: "A real-time network connecting voluntary blood donors with people who need blood, within seconds during critical emergencies."
- Three buttons in one row: "Find Donors Near Me" (primary + search icon), "Register as a Donor" (secondary + heart icon), "EMERGENCY SOS" (SOS style + alert icon).
Below the hero add: a 4-card stats strip (use neutral labels like Donors, Requests, Cities, Lives helped and show 0 until API data exists, no fake numbers), "How It Works" in 4 steps (Register, Post request, Nearby donors get alerted, Donor accepts and contacts you), a blood group compatibility chart (recipient vs donors), a "Why LifeDrop" 3-card section (Nearby matching, Privacy first, Instant alerts), and a final call-to-action band in red gradient.

## ACCEPTANCE
Run npm run dev. The home page must look like a polished version of: white navbar, pink hero, big bold two-color headline, three CTA buttons. It must be responsive at 360px, 768px and 1280px.
```

**Check:**
- localhost:5173 par page screenshot jaisa dikhna chahiye (par certified/blood bank wording ke bina).
- Mobile width par navbar hamburger ban jaye.
- Git commit: 'step 9 web landing'.


---

## PROMPT 10 - Web: Auth, Dashboards, Map

*Area:* Web (optional)  
*When:* Landing page ready hone ke baad.

```text
## TASK
Connect the web app to the backend and build the pages.

## FOUNDATION
- src/api/axiosInstance.js with baseURL from VITE_API_URL and an interceptor that adds the JWT token; on 401 log out and redirect to /login.
- AuthContext (user, token, login, register, logout) saving token in localStorage.
- ProtectedRoute with role check (DONOR / RECIPIENT).

## PAGES
1. Login and Register: Register has a role toggle (I am a Donor / I need blood). Donor fields: blood group, age, gender, city. Show a "Use my current location" button (browser Geolocation). Show friendly field errors from the API.
2. Donor Dashboard: availability toggle, eligibility card (days remaining after last donation), incoming requests list with Accept/Reject buttons, history list.
3. Recipient Dashboard: "Request Blood" form (patient name, blood group, units, urgency, city, location picker, required-by, message), "My Requests" with a status timeline (Pending, Accepted, Completed), and when accepted show the donor name and a "Call donor" button.
4. Find Donors page (Recipient, after login): map (Leaflet + OpenStreetMap) with donor pins and a list with distance such as "3.2 km away". Blood group and radius filters. Never show phone numbers here.
5. Blood Requests page: list of open requests for donors; guests see only blood group, city, urgency (no names).
6. Profile page, Notifications dropdown in the navbar with unread count (poll every 30 seconds), Privacy Policy and Terms pages, 404 page.

## UI RULES
Every page uses the DESIGN SYSTEM. Use skeleton loaders, empty states and toast messages. All forms validate before submit.

## ACCEPTANCE
Full flow works in the browser against the running backend: register donor, register recipient, create request, donor accepts, recipient sees phone number.
```

**Check:**
- Do browsers (ek donor, ek recipient) se poora flow test karo.
- Git commit: 'step 10 web pages'.


---

## PROMPT 11 - Mobile: Expo Setup, Theme, Navigation and Auth

*Area:* Mobile  
*When:* Yahan se APK ka kaam shuru hota hai. Backend chal raha hona chahiye.

```text
## TASK
Create the React Native (Expo) app in lifedrop/mobile using JavaScript.

## SETUP
Install: @react-navigation/native, native-stack, bottom-tabs, axios, expo-secure-store, expo-location, expo-notifications, expo-linear-gradient, react-native-maps, @expo/vector-icons, @expo-google-fonts/plus-jakarta-sans, expo-font. Use the folder layout:
src/api, src/context, src/navigation, src/screens/{auth,donor,recipient,common}, src/components, src/hooks, src/utils, src/theme.

## THEME (src/theme/colors.js, typography.js, spacing.js)
Copy every token from the DESIGN SYSTEM in the Master Context. Load Plus Jakarta Sans (400, 500, 600, 700, 800). Create a shared shadow helper for the red glow.

## API
src/api/axiosInstance.js: baseURL from EXPO_PUBLIC_API_URL (document that on a real phone this must be the PC's LAN IP such as http://192.168.x.x:8080 and on the Android emulator http://10.0.2.2:8080). Add a JWT interceptor using expo-secure-store.

## NAVIGATION
AuthContext (token, user, role, login, register, logout, loading). AppNavigator: loading -> Splash; no token -> AuthStack (Login, Register); DONOR -> DonorTabs (Home, Requests, History, Profile); RECIPIENT -> RecipientTabs (Home, Request Blood, My Requests, Profile). Bottom tab bar is white with red active icon and label.

## COMPONENTS
CustomButton (variants: primary gradient, secondary, sos, outline), InputField (label, error text, password eye toggle), BloodGroupPicker (8 chips, selected chip is red), Card, StatusBadge (Pending amber, Accepted green, Completed blue-grey, Cancelled/Expired grey, Urgent red), Loader, EmptyState, ScreenHeader.

## SCREENS
SplashScreen (pink background, logo and tagline), LoginScreen, RegisterScreen (role toggle at the top, donor-only fields appear for DONOR, "Use my location" button). Hero text on Login: "Every Drop Counts. Every Life Saved."

## ACCEPTANCE
Run with npx expo start. Register and login work against the backend; after login the correct tabs appear for each role; logout works; token survives app restart.
```

**Check:**
- Expo Go me Login/Register chal rahe hon.
- Phone aur PC same Wi-Fi par hon, aur EXPO_PUBLIC_API_URL me PC ka IP ho.
- Git commit: 'step 11 mobile setup'.


---

## PROMPT 12 - Mobile: Donor Screens

*Area:* Mobile  
*When:* Auth chalne ke baad.

```text
## TASK
Build all DONOR screens in the mobile app and connect them to the backend.

## SCREENS
1. DonorHomeScreen: greeting with name, a big availability switch card (Available / Not available), eligibility card with a progress bar and "next eligible date" if the 90-day gap is not over, small stat tiles (Requests received, Donations done), and the 3 latest incoming requests.
2. IncomingRequestsScreen: pull-to-refresh list of RequestCards (blood group badge in a red circle, urgency badge, city, distance, time ago, short message). Empty state: "No requests near you right now."
3. RequestDetailScreen: full details, a map preview of the recipient's approximate location, Accept and Reject buttons with confirm dialogs. After Accept show the recipient's name and phone with "Call" (Linking tel:) and "WhatsApp" buttons. Handle 409 ("Another donor already accepted") with a friendly message.
4. DonationHistoryScreen: completed donations with date and a thank-you note.
5. ProfileScreen (shared): edit profile, blood group, city, update location button, logout.

## RULES
Use the Design System everywhere. Add loading, error and empty states for every list. Create api/requestApi.js and api/userApi.js for all calls.

## ACCEPTANCE
Using seeded data, a donor can toggle availability, open a request, accept it, and call the recipient.
```

**Check:**
- Availability toggle backend me save hota hai (app restart ke baad bhi).
- Git commit: 'step 12 donor screens'.


---

## PROMPT 13 - Mobile: Recipient Screens and Nearby Map

*Area:* Mobile  
*When:* Donor screens ke baad.

```text
## TASK
Build all RECIPIENT screens.

## SCREENS
1. RecipientHomeScreen: greeting, a large "Request Blood" primary card, EMERGENCY SOS button (wired in a later prompt, for now navigate to CreateRequest with urgency URGENT), latest request status card, and a short "How it works" strip.
2. CreateRequestScreen: patient name, BloodGroupPicker, units (stepper 1-5), urgency toggle (Normal / Urgent), city, location block (auto-detect GPS with expo-location, show address text and a small map, allow moving the pin), required-by date/time, message. Submit calls POST /api/recipient/requests then navigates to the request details.
3. NearbyDonorsScreen: react-native-maps with donor markers + user marker, a radius chip row (5, 10, 25 km), blood group filter, and a bottom list of DonorCards (first name, blood group badge, distance such as "3.2 km away", last donated). Tapping a card highlights its marker. No phone numbers here.
4. MyRequestsScreen: list with StatusBadge and filters (All, Active, Completed).
5. RequestStatusScreen: timeline (Request sent -> Donors notified -> Donor accepted -> Completed), number of donors notified, Cancel button while PENDING, and when ACCEPTED show donor name + phone with Call button + "Mark as Completed" button.

## NOTES
- Add the Google Maps API key placeholder in app.json under android.config.googleMaps.apiKey and explain how to get a key.
- Ask for location permission with a clear reason text before the system dialog.
- Handle permission denied by letting the user type a city and tap the map.

## ACCEPTANCE
Recipient can create a request, see nearby donors on the map, watch the status change when a donor accepts, call the donor and mark completed.
```

**Check:**
- Map par seeded donors (Bhopal) ke pins dikhne chahiye.
- Git commit: 'step 13 recipient screens'.


---

## PROMPT 14 - Mobile: Location Updates, Push Notifications, Notification Screen

*Area:* Mobile  
*When:* Recipient screens ke baad. Push test karne ke liye development build chahiye (niche Common Issues dekho).

```text
## TASK
Add location syncing and push notifications to the mobile app.

## LOCATION
- useLocation hook: request foreground permission, get current position, handle denied/blocked states.
- For DONORS: update the server location (PUT /api/users/location) after login and whenever the app comes to the foreground, but at most once every 30 minutes.

## PUSH NOTIFICATIONS
- useNotifications hook: ask permission (Android 13+ POST_NOTIFICATIONS), get the Expo push token, send it to PUT /api/users/push-token after login, clear it on logout.
- Create two Android notification channels: "default" and "urgent" (importance MAX, vibration, red light color #DC2626).
- Foreground: show a banner. Tap on a notification: navigate to RequestDetailScreen (donor) or RequestStatusScreen (recipient) using data.requestId, even if the app was closed.

## NOTIFICATION SCREEN
NotificationScreen listing in-app notifications (GET /api/notifications) with unread dot, mark one as read on tap, "Mark all read" button, and a bell icon with unread count badge in the tab headers.

## ACCEPTANCE
Explain clearly how to test push on a real phone and give the exact commands. Show how to send a test push from the Expo push tool.
```

**Check:**
- Request banate hi donor ke phone par notification aaye.
- Notification tap karne par sahi screen khule.
- Git commit: 'step 14 location push'.


---

## PROMPT 15 - Emergency SOS Feature (Backend + Web + Mobile)

*Area:* Full-stack  
*When:* Screenshot ka red EMERGENCY SOS button yahin real kaam karega.

```text
## TASK
Make the EMERGENCY SOS button fully functional.

## BACKEND
POST /api/recipient/sos with {patientName, bloodGroup, city, latitude, longitude, message}. It creates a BloodRequest with urgency URGENT, radius 25 km, requiredBy = now + 6 hours, notifies all eligible compatible donors with a high-priority push on the "urgent" channel, and returns {requestId, donorsNotified}. If no donor is found in 25 km, automatically retry once with 50 km. Limit: one active SOS per recipient at a time.

## MOBILE
- SOS button on RecipientHome (red gradient, glow, alert icon).
- Tap opens a bottom-sheet confirmation: blood group picker (preselect if known), patient name, auto-detected location, a note line, and a big "Send SOS" button.
- After sending show an SOS Status screen: pulsing red circle animation, "X donors notified", live status (poll every 10 seconds), and as soon as a donor accepts show his name and phone with a Call button.
- Always show two extra quick-call buttons: "Call 112" and "Call 108" using Linking.
- Show the disclaimer: "LifeDrop connects donors and recipients. In a medical emergency, contact a hospital or call 112."

## WEB
Make the navbar and hero SOS buttons open the same flow (modal) for logged-in recipients and redirect guests to Register.

## ACCEPTANCE
With seeded donors, one SOS tap notifies matching donors, a donor accepts, and the recipient screen updates to show the donor contact.
```

**Check:**
- SOS ke baad donorsNotified count sahi aa raha ho.
- Git commit: 'step 15 sos'.


---

## PROMPT 16 - Full QA, Bug Fixing and UI Polish

*Area:* Full-stack  
*When:* Saare features banne ke baad, release se pehle.

```text
## TASK
Act as a QA engineer and a UI reviewer for the whole project. Do NOT add new features.

## TEST SCENARIOS (run and report pass/fail for each)
1. Register donor, register recipient, login, logout, token expiry.
2. Donor without blood group is rejected. Donor under 18 is rejected.
3. Recipient creates NORMAL request, matching donors are notified.
4. Two donors accept at the same time: only one wins.
5. Phone number is hidden before accept and visible after accept (both sides).
6. Donor within 90 days of last donation never receives requests.
7. Request expires after 24 hours. Cancelled request cannot be accepted.
8. Rate limit (4th request in 24 hours returns 429).
9. SOS flow end to end.
10. Location permission denied path on mobile.
11. Offline / backend down: app shows a friendly error, not a crash.

## UI REVIEW
Check every screen against the DESIGN SYSTEM: colors, font weights, radius, spacing, button styles, status badges, empty states and loading states. List mismatches and fix them. Make sure no text mentions hospitals, blood banks, certifications or fake numbers.

## CLEANUP
Remove unused files and console logs, add missing validations, write a root README.md with: project overview, screenshots placeholders, tech stack, setup steps for backend / web / mobile, demo logins, and API overview.

## OUTPUT
A table of issues found, what you fixed, and anything left open.
```

**Check:**
- Issues table padho aur khud ek baar app chala kar verify karo.
- Git commit: 'step 16 qa and polish'.


---

## PROMPT 17 - APK Build and Deployment

*Area:* Release  
*When:* Sab kuch test ho jaane ke baad.

```text
## TASK
Prepare the project for release.

## BACKEND DEPLOYMENT
- Add a Dockerfile (multi-stage, Java 17) for the backend.
- Create application-prod.properties reading everything from environment variables.
- Give step-by-step instructions to deploy the backend on Render (or Railway) and the database on Neon (or Supabase) free tier. List every environment variable to set (DB_URL, DB_USER, DB_PASS, JWT_SECRET, JWT_EXPIRATION, SPRING_PROFILES_ACTIVE=prod).
- Restrict CORS to the real web domain in production.

## MOBILE APK
- app.json: name "LifeDrop", slug "lifedrop", version 1.0.0, android.package "com.lifedrop.app", app icon and adaptive icon (red drop on white), splash screen (pink background with logo), Android permissions ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, POST_NOTIFICATIONS.
- eas.json with profiles: development (development build), preview (APK for testing), production (AAB for Play Store).
- Set EXPO_PUBLIC_API_URL to the deployed HTTPS backend URL for preview and production.
- Give the exact commands: eas login, eas build:configure, eas build -p android --profile preview. Explain how to install the APK on a phone.

## PLAY STORE READINESS
- Create a Privacy Policy page (web route /privacy) covering: what data is collected (name, phone, blood group, location), why, who can see it, deletion on request, and contact email placeholder.
- Add an in-app "Delete my account" option (backend endpoint DELETE /api/users/me that anonymizes personal data).
- Create a checklist for the Play Console (data safety form, content rating, screenshots, short and full description).

## ACCEPTANCE
The backend is reachable over HTTPS, the APK installs on a real phone, login works, and push notification arrives.
```

**Check:**
- APK dusre phone par install karke full flow test karo.
- Git tag: v1.0.0.

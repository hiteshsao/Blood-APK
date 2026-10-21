# LifeDrop - Email OTP Login Prompts

Ye do prompts `LifeDrop_Prompts.md` ke Prompt 3 (auth) ke baad kabhi bhi bhej sakte ho. Pehle backend (OTP-1), test karo, phir web + mobile (OTP-2).

## Design (jo hum bana rahe hain)

- Password login jaisa hai waisa rahega. Email OTP uske **saath ek naya login tareeka** hai (user dono me se kuch bhi use kar sakta hai).
- Sirf **already registered** users OTP se login kar sakte hain. Register pehle ki tarah form se hi hoga.
- Flow: email daalo -> "Send code" -> email me 6 digit code aata hai -> code daalo -> login (wahi JWT + user jo password login deta hai).
- Naye endpoints: `POST /api/auth/otp/send` aur `POST /api/auth/otp/verify`. `/api/auth/**` SecurityConfig me pehle se public hai.
- Dev me email asli bheje bina OTP backend console me print hota hai; production me asli SMTP.

---

## PROMPT OTP-1 - Backend: Email OTP login

*Area:* Backend
*When:* Prompt 3 chal jaane ke baad. PostgreSQL chalu ho.

```text
## TASK
Add passwordless EMAIL OTP login to the existing Spring Boot backend in lifedrop/backend. Keep the existing
POST /api/auth/login (email + password) working exactly as it is. Do not touch unrelated files.

## DESIGN
- Only users that already exist and are active can log in with OTP. Registration is unchanged.
- POST /api/auth/otp/send    body {email}       -> sends a 6 digit code by email.
- POST /api/auth/otp/verify  body {email, otp}  -> returns the SAME AuthResponse (token + UserSummary) as
  AuthService.login(), built with the same jwtUtil.generateToken(email, role, id) call.
- Both endpoints are public (they live under /api/auth/**, already permitted in SecurityConfig).

## NEW PIECES (follow the existing layered style: Controller -> Service -> Repository, DTOs, validation)
1. Dependency: spring-boot-starter-mail in pom.xml.
2. Entity EmailOtp (table email_otps): id, email (normalized lower-case), otpHash, expiresAt, attempts
   (default 0), consumed (boolean, default false), createdAt. Index on (email, createdAt).
3. EmailOtpRepository: find the latest non-consumed OTP for an email, count OTPs created for an email since
   a given time, delete expired rows.
4. DTOs: OtpSendRequest {@Email @NotBlank email}, OtpVerifyRequest {@Email @NotBlank email,
   @Pattern(regexp = "\\d{6}") otp}.
5. OtpMailSender interface with two implementations:
   - LoggingOtpMailSender (active when profile "dev" is on OR app.otp.mail-enabled=false): logs
     "DEV OTP for <email>: <code>" at WARN level. This is the ONLY place a code may ever be logged.
   - SmtpOtpMailSender (active otherwise): uses JavaMailSender. Subject "Your LifeDrop login code". Plain
     text body: "Your LifeDrop login code is 123456. It expires in 5 minutes. If you did not request this,
     you can ignore this email." Never put a link in the email.
6. OtpService with sendOtp(email) and verifyOtp(email, otp). A Clock bean is injected so tests can control
   time.
7. Add the two endpoints to AuthController with Swagger @Operation summaries.

## OTP RULES (all configurable in application.properties with environment overrides)
- Generate with java.security.SecureRandom, exactly 6 digits, left padded with zeros.
- Store only a hash: HMAC-SHA256 of the code using a server secret OTP_PEPPER (env var, with a dev default,
  NOT used in prod). Compare with MessageDigest.isEqual (constant time). Never store or log the plain code.
- app.otp.expiry-minutes=5. An expired code is rejected.
- app.otp.max-attempts=5. Every wrong guess increments attempts; at 5 the code is consumed and a new one
  must be requested.
- Single use: a code is marked consumed after a successful verify.
- A new send invalidates (consumes) all earlier unused codes for that email.
- Resend cooldown app.otp.resend-cooldown-seconds=60 -> too early returns 429 with a clear message.
- Per email cap app.otp.max-sends-per-hour=5 -> returns 429.
- Add a small in-memory per-IP limiter (for example 20 requests per 10 minutes for the two endpoints). Use
  the existing RateLimitException (HTTP 429) and make sure GlobalExceptionHandler maps it.
- No user enumeration: /otp/send ALWAYS returns HTTP 200 with the same generic message ("If this email is
  registered, a login code has been sent.") whether the email exists, is inactive, or is unknown. For unknown
  or inactive emails simply send nothing.
- /otp/verify returns 401 with ONE generic message ("Invalid or expired code") for every failure: unknown
  email, wrong code, expired, consumed, too many attempts, inactive account.
- Sending the email must never leak an exception to the client. Catch mail errors, log the error message
  only (no code, no full email body), and still return the generic 200.
- Add @Scheduled cleanup (once a day) that deletes OTP rows older than 24 hours.

## CONFIG (application.properties, nothing hard-coded)
app.otp.length=6
app.otp.expiry-minutes=5
app.otp.max-attempts=5
app.otp.resend-cooldown-seconds=60
app.otp.max-sends-per-hour=5
app.otp.mail-enabled=${OTP_MAIL_ENABLED:true}
app.otp.pepper=${OTP_PEPPER:dev-only-otp-pepper-change-me}
spring.mail.host=${MAIL_HOST:}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME:}
spring.mail.password=${MAIL_PASSWORD:}
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
app.mail.from=${MAIL_FROM:no-reply@lifedrop.app}
In the dev profile set app.otp.mail-enabled=false so nothing is sent.

## ALSO EXPLAIN (short)
- How to test OTP with the dev profile (read the code from the console) and the demo user donor1@lifedrop.test.
- How to send real email later: Gmail SMTP with an App Password for testing, or a transactional provider
  (Brevo, Resend, Mailgun SMTP) for production. List the exact env vars to set.
- Why only a hash is stored.

## TESTS (write them and run mvnw test)
- Unit tests with a fixed Clock and a mocked OtpMailSender: success path, wrong code increments attempts,
  5 wrong codes lock the code, expired code, consumed code cannot be reused, new send invalidates the old
  code, 60 second cooldown, 6th send within an hour -> 429, unknown email -> same 200 response and no mail
  sent, inactive user -> no mail and generic 401 on verify.
- Integration test: send -> read the code from the mocked sender -> verify -> token works on GET /api/auth/me.
- Test that the plain code never appears in any log output outside the dev logging sender, and that the
  stored otpHash is not equal to the code.

## ACCEPTANCE
POST /api/auth/otp/send for donor1@lifedrop.test returns 200; the code appears in the console in dev; POST
/api/auth/otp/verify with that code returns a token; /api/auth/me works with it; reusing the code returns
401; all tests pass; the old password login still works.
```

**Check:**
- Console me `DEV OTP for ...` dikhe aur DB me `email_otps` table ban jaye (otp_hash me 6 digit code nahi, lamba hash).
- Galat email aur galat code dono par response same type ka aaye (enumeration nahi).
- 6 baar galat code daalne par code lock ho jaye; 60 second se pehle resend par 429.
- Git commit: `step 3b email otp backend`.

---

## PROMPT OTP-2 - Web + Mobile: OTP login screens

*Area:* Web + Mobile
*When:* OTP-1 test ho jaane ke baad. Backend chalu rakho.

```text
## TASK
Add the Email OTP login flow to the web app (lifedrop/web) and the mobile app (lifedrop/mobile). Keep the
existing email + password login working. Use the existing DESIGN SYSTEM (colors, Plus Jakarta Sans, radius
12 / 20, red glow on primary buttons). Do not touch unrelated files. Do not change how the token is stored:
reuse the same login function in AuthContext that password login uses, so token storage (localStorage on
web, expo-secure-store on mobile) and 401 handling stay identical.

## API (add next to the existing auth calls)
- sendOtp(email)        -> POST /api/auth/otp/send
- verifyOtp(email, otp) -> POST /api/auth/otp/verify -> returns {token, user} like login.
Show backend messages as they are. Treat HTTP 429 as "Please wait before requesting another code."

## WEB (src/pages/Login.jsx, src/api, src/context/AuthContext.jsx)
- On the Login page add two tabs: "Password" and "Email code". Default tab stays "Password".
- Email code tab, step 1: email field + "Send code" button. Validate the email before calling the API.
- Step 2 (after send): message "We sent a 6 digit code to <email>", a 6 box OTP input (auto-focus, digits
  only, paste support for a 6 digit code, backspace moves back), a "Verify and sign in" button, "Resend code"
  disabled for 60 seconds with a visible countdown, and a "Change email" link.
- Loading state on buttons, disable while a request is running (no double submit), inline error text, toast
  for success. After a successful verify navigate exactly like password login (donor dashboard or
  recipient dashboard by role).
- Responsive at 360, 768 and 1280 px.

## MOBILE (src/screens/auth/LoginScreen.js, src/api/authApi.js, src/context/AuthContext.js)
- Same two-mode UI: a segmented toggle "Password | Email code" at the top of LoginScreen.
- Step 1: InputField for email (keyboardType email-address, autoCapitalize none) + CustomButton "Send code".
- Step 2: create a reusable OtpInput component (src/components) with 6 boxes, numeric keyboard,
  textContentType="oneTimeCode" and autoComplete="one-time-code", paste support, backspace handling.
  Add a 60 second resend countdown, "Change email", and a "Verify and sign in" button.
- Handle: no internet, server down, wrong code, expired code, 429. Reset loading flags in finally blocks,
  and clear the countdown timer on unmount.
- After verify call the same AuthContext login path as password login so role-based tabs open correctly
  and the token is saved to expo-secure-store.

## RULES
- Never log the OTP or the token. Do not store the OTP anywhere (not in AsyncStorage, not in state that
  survives leaving the screen).
- Friendly English text only. No claims about the code being "secure" or "guaranteed".

## ACCEPTANCE
With the backend in dev mode: enter donor1@lifedrop.test, press Send code, read the code from the backend
console, type it, and land on the donor home. The same on the recipient demo user. A wrong code shows a
clear error. Resend is blocked for 60 seconds. Password login still works on both apps.
```

**Check:**
- Web aur mobile dono me OTP se login ho aur password login bhi chale.
- App restart ke baad session bana rahe (token pehle jaise store hota hai).
- Git commit: `step 3c email otp web and mobile`.

---

## Production ke liye yaad rakho

- Real email ke liye env vars set karo: `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM`, `OTP_PEPPER`, `OTP_MAIL_ENABLED=true`. `OTP_PEPPER` ko JWT_SECRET ki tarah hi secret rakho, git me mat daalo.
- Free SMTP (Gmail) par daily limit hoti hai aur spam me ja sakta hai; live launch ke liye transactional email provider behtar hai.
- Prompt 17 ke prod profile me bhi ye env vars list me jodna.

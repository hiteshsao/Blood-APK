# LifeDrop Mobile — Peer-to-Peer Blood Donation App

LifeDrop Mobile is a React Native app built with Expo that directly connects **Donors** and **Recipients** for life-saving blood donations without intermediaries.

> **Zero Intermediaries**: No hospitals, no blood banks, and no admin inventory. Donors connect directly with recipients.

---

## 📱 Features

- **Auth & Session Persistence**: Secure JWT storage using `expo-secure-store`. Tokens survive app restart.
- **Role-Based Navigation**:
  - **DONOR**: Home (availability toggle, 90-day recovery indicator, incoming alerts), Requests (review & accept), History, Profile.
  - **RECIPIENT**: Home (create request, Emergency SOS), Request Blood (GPS auto-detection, units, blood group picker), My Requests (timeline, donor phone revealed upon accept), Profile.
- **Emergency SOS**: Rapid high-priority alert with 25 km radius.
- **Design System**: Plus Jakarta Sans (400–800), light pink background (`#FFF5F5`), crimson red gradients, and signature soft red button glow.

---

## 🛠️ Project Structure

```
lifedrop/mobile/
├── assets/                 # App icons, splash screens, assets
├── src/
│   ├── api/
│   │   ├── axiosInstance.js# BaseURL, SecureStore JWT interceptor, 401 handling
│   │   └── authApi.js      # Auth, profile, and location API methods
│   ├── context/
│   │   └── AuthContext.js  # token, user, role, login, register, logout
│   ├── navigation/
│   │   ├── AppNavigator.js # Root orchestrator (Splash, AuthStack, DonorTabs, RecipientTabs)
│   │   ├── AuthNavigator.js# Login & Register stack
│   │   ├── DonorNavigator.js# White bottom tabs with red active highlight
│   │   └── RecipientNavigator.js# Recipient bottom tabs
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.js    # "Every Drop Counts. Every Life Saved." + demo fill
│   │   │   └── RegisterScreen.js # Role toggle, donor-only fields, GPS auto-detect
│   │   ├── donor/
│   │   │   ├── DonorHomeScreen.js
│   │   │   ├── DonorRequestsScreen.js
│   │   │   └── DonorHistoryScreen.js
│   │   ├── recipient/
│   │   │   ├── RecipientHomeScreen.js
│   │   │   ├── CreateRequestScreen.js
│   │   │   └── MyRequestsScreen.js
│   │   └── common/
│   │       ├── SplashScreen.js
│   │       └── ProfileScreen.js
│   ├── components/
│   │   ├── CustomButton.js    # primary gradient, secondary, sos, outline
│   │   ├── InputField.js      # label, error, password eye toggle
│   │   ├── BloodGroupPicker.js# 8 chips, selected chip is red
│   │   ├── Card.js            # 20px radius, soft shadow
│   │   ├── StatusBadge.js     # Pending, Accepted, Completed, Cancelled, Urgent
│   │   ├── Loader.js
│   │   ├── EmptyState.js
│   │   └── ScreenHeader.js
│   ├── hooks/
│   │   └── useLocation.js     # GPS foreground permission & reverse geocoding
│   ├── utils/
│   │   ├── bloodCompatibility.js # ABO/Rh compatibility rules
│   │   └── formatters.js      # Distance, phone, and date formatting
│   └── theme/
│       ├── colors.js          # Brand palette & gradients
│       ├── typography.js      # Plus Jakarta Sans weights 400-800
│       ├── spacing.js         # Radii & spacing tokens
│       ├── shadows.js         # Shared red glow & elevation helpers
│       └── index.js
├── App.js                     # Root entry with useFonts and AuthProvider
├── app.json                   # Expo configuration & permissions
├── .env                       # EXPO_PUBLIC_API_URL configuration
└── package.json
```

---

## ⚙️ Backend Connection & Network Configuration

Set `EXPO_PUBLIC_API_URL` in `.env`:

### 1. Android Emulator:
```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:8080
```
*(The Android emulator uses `10.0.2.2` as an alias to access your computer's localhost.)*

### 2. Real Physical Phone (Expo Go via Wi-Fi):
```env
EXPO_PUBLIC_API_URL=http://192.168.1.15:8080
```
- Replace `192.168.1.15` with your PC's local Wi-Fi IP address (find it by running `ipconfig` on Windows or `ifconfig` on macOS/Linux).
- Both your phone and your PC **must** be connected to the exact same Wi-Fi router.

### 3. iOS Simulator or Web:
```env
EXPO_PUBLIC_API_URL=http://localhost:8080
```

---

## 🚀 Running the App

From the `lifedrop/mobile` directory:

```bash
# Start the Expo development server
npx expo start

# Or with clear cache:
npx expo start -c
```

Scan the QR code with the **Expo Go** app on your phone, or press:
- `a` to launch on Android emulator
- `i` to launch on iOS simulator
- `w` to open in web browser

---

## 👥 Demo Logins

When the backend is started with `-Dspring-boot.run.profiles=dev`, the following demo accounts are available:

**Password for ALL accounts:** `Password@123`

- **Recipient:** `recipient1@lifedrop.test` (Rajesh Recipient, Bhopal)
- **Donor (A+):** `donor1@lifedrop.test` (Aarav Sharma, MP Nagar)
- **Donor (O+):** `donor3@lifedrop.test` (Rohan Verma, TT Nagar)
- **Donor (O-):** `donor4@lifedrop.test` (Sneha Jain, New Market)

On the **Login** screen, you can also tap the quick-fill chips to test with one click!

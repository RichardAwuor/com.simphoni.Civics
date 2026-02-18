# Kenya Civic - Electoral Agent Management System

A comprehensive mobile application for managing electoral agents, incident reporting, and Form 34A submissions for Kenyan elections.

## 🚀 Backend Integration Status

### ✅ Fully Integrated Features

#### 1. **Location Data System**
- **Counties**: All 47 Kenyan counties with official codes
- **Constituencies**: Comprehensive data for all counties (290+ constituencies)
- **Wards**: Sample wards for major constituencies (expandable)

**Endpoints Integrated:**
- `GET /api/locations/counties` - Returns all 47 counties
- `GET /api/locations/constituencies/:county` - Returns constituencies for selected county
- `GET /api/locations/wards/:constituency` - Returns wards for selected constituency

**Frontend Implementation:**
- Cascading dropdown pattern in registration screen
- Automatic loading of constituencies when county is selected
- Automatic loading of wards when constituency is selected
- Proper loading states and error handling
- County filter in dashboard for reports

#### 2. **Authentication System**
- **Email Magic Link**: Passwordless authentication via email
- **Biometric Authentication**: Fingerprint/Face ID support
- **Session Management**: Persistent sessions across app restarts
- **Token Management**: Bearer token storage in SecureStore (native) and localStorage (web)

**Endpoints Integrated:**
- `POST /api/auth/*` - Better Auth endpoints for email magic link
- `POST /api/biometric/register` - Register biometric credential
- `POST /api/biometric/verify` - Verify biometric and sign in

#### 3. **Agent Management**
- **Registration**: Complete agent registration with location data
- **Profile Management**: View and edit agent profile
- **Civic Code**: Auto-generated unique identifier for each agent

**Endpoints Integrated:**
- `POST /api/agents/register` - Register new agent
- `GET /api/agents/me` - Get current agent profile
- `PUT /api/agents/me` - Update agent profile

#### 4. **Incident Reporting**
- **Video Upload**: Record and upload incident videos (max 3 per agent)
- **Location Tracking**: GPS coordinates captured with each video
- **Video Codes**: Unique codes generated for each video

**Endpoints Integrated:**
- `POST /api/incidents/upload-video` - Upload incident video
- `GET /api/incidents/my-videos` - Get agent's uploaded videos

#### 5. **Form 34A Submission**
- **Image Capture**: Scan and submit Form 34A
- **Serial Number Tracking**: Unique serial numbers for each form
- **Discrepancy Detection**: Automatic detection of duplicate serial numbers
- **Candidate Results**: Extract and store candidate vote counts

**Endpoints Integrated:**
- `POST /api/form34a/submit` - Submit Form 34A with image
- `GET /api/form34a/my-submission` - Get agent's submission

#### 6. **Dashboard & Analytics**
- **Candidate Votes**: Aggregated vote counts across all submissions
- **Incident Videos**: View videos by county
- **Serial Discrepancies**: Detect duplicate serial numbers
- **Missing Submissions**: Identify polling stations without submissions
- **Extra Submissions**: Detect multiple submissions from same station
- **Duplicate Detection**: Find duplicate submissions by station or serial

**Endpoints Integrated:**
- `GET /api/dashboard/candidate-votes?county=` - Get aggregated votes
- `GET /api/dashboard/incident-videos?county=` - Get incident videos
- `GET /api/dashboard/serial-discrepancies?county=` - Get serial discrepancies
- `GET /api/dashboard/missing-submissions?county=` - Get missing submissions
- `GET /api/dashboard/extra-submissions?county=` - Get extra submissions
- `GET /api/dashboard/duplicate-submissions?county=` - Get duplicates

## 🏗️ Architecture

### Backend URL Configuration
The backend URL is configured in `app.json`:
```json
{
  "expo": {
    "extra": {
      "backendUrl": "https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev"
    }
  }
}
```

### API Client (`utils/api.ts`)
Centralized API client with:
- Automatic backend URL reading from `Constants.expoConfig.extra.backendUrl`
- Bearer token management (SecureStore for native, localStorage for web)
- Helper functions: `apiGet`, `apiPost`, `apiPut`, `apiPatch`, `apiDelete`
- Authenticated helpers: `authenticatedGet`, `authenticatedPost`, etc.
- File upload support: `authenticatedUpload` for multipart form data

### Authentication Flow
1. **New User Registration**:
   - User fills registration form → Email magic link sent → User clicks link → Auth callback → Registration completed → Biometric setup → Dashboard

2. **Returning User Sign-In**:
   - User opens app → Biometric prompt → Device biometric verified → Backend verification → Dashboard

3. **Session Persistence**:
   - Bearer token stored in platform-specific secure storage
   - Auth context checks session on app start
   - Automatic redirect to appropriate screen based on auth state

### UI Components
- **CustomModal**: Web-compatible modal for alerts and confirmations (replaces Alert.alert)
- **BiometricSetup**: Biometric enrollment component
- **LoadingButton**: Button with loading state
- **Picker**: Dropdown for county/constituency/ward selection

## 📱 Screens

### 1. Auth Screen (`app/auth.tsx`)
- Biometric sign-in button
- New agent registration link
- Clean, branded UI with Kenya Civic logo

### 2. Registration Screen (`app/(tabs)/register.tsx`)
- Email and personal information
- Cascading location dropdowns (County → Constituency → Ward)
- Date of birth picker
- National ID input (8 digits)
- Biometric setup after registration

### 3. Profile Screen (`app/(tabs)/profile.tsx`)
- View agent details (name, civic code, email, location)
- Edit profile (first name, last name)
- Sign out button

### 4. On-Location Screen (`app/(tabs)/on-location.tsx`)
- Record incident videos (max 3)
- Submit Form 34A with camera
- View uploaded videos and form submission

### 5. Dashboard Screen (`app/(tabs)/(home)/index.tsx`)
- Multiple report types (candidate votes, incidents, discrepancies)
- County filter for all reports
- Real-time data from backend

## 🔐 Security Features

1. **Biometric Authentication**: Device-level security with fingerprint/Face ID
2. **Bearer Token**: Secure token storage in platform-specific secure storage
3. **Email Verification**: Magic link authentication for initial registration
4. **National ID Encryption**: 8-digit national ID replaced with auto-generated civic code
5. **HTTPS**: All API calls over secure HTTPS connection

## 🧪 Testing

### Test User Creation
To test the app, register a new agent:
1. Open the app → "New Agent Registration"
2. Fill in the form with test data:
   - Email: `test@example.com`
   - First Name: `John`
   - Last Name: `Doe`
   - County: Select any county (e.g., "Nairobi")
   - Constituency: Select from loaded list (e.g., "Westlands")
   - Ward: Select from loaded list
   - Date of Birth: Any date
   - National ID: `12345678` (8 digits)
3. Submit → Check email for magic link → Click link
4. Set up biometric authentication
5. Sign in with biometric

### Testing Location Data
1. **Counties**: Open registration screen → Verify all 47 counties load
2. **Constituencies**: Select "Nairobi" → Verify 17 constituencies load
3. **Wards**: Select "Westlands" → Verify wards load
4. **Cascading Reset**: Change county → Verify constituency and ward reset

### Testing Dashboard
1. Sign in as registered agent
2. Navigate to Dashboard (home tab)
3. Test each report type:
   - Candidate Votes: View aggregated votes
   - Incident Videos: Select county → View videos
   - Serial Discrepancies: View duplicate serial numbers
   - Missing Submissions: View stations without submissions
   - Extra Submissions: View stations with multiple submissions
   - Duplicates: View duplicate submissions

## 📊 Data Coverage

### Counties
All 47 Kenyan counties with official codes (001-047)

### Constituencies
Comprehensive data for all counties including:
- Nairobi: 17 constituencies (updated to correct list)
- Mombasa: 6 constituencies (updated)
- Kiambu: 9 constituencies
- Kisumu: 7 constituencies
- Nakuru: 11 constituencies
- And all other 42 counties with their constituencies

### Wards
Sample wards for major constituencies (3-5 wards per constituency)
- Expandable to include all wards for each constituency

## 🚀 Deployment

### Backend
- Deployed at: `https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev`
- OpenAPI documentation available at `/documentation`

### Frontend
- Built with Expo 54
- Supports iOS, Android, and Web
- Uses Expo Router for navigation

## 📝 Recent Updates

### Location Data Expansion (Latest)
- **Backend**: Expanded constituency data to include all 47 Kenyan counties
- **Frontend**: Already integrated - automatically receives expanded data
- **Nairobi**: Updated to correct 17 constituencies
- **Mombasa**: Updated to 6 constituencies
- **All Counties**: Added comprehensive constituency data

### No Frontend Changes Required
The frontend is already properly integrated with the location endpoints. The API structure remains the same:
- `GET /api/locations/constituencies/:county` returns constituencies for any county
- `GET /api/locations/wards/:constituency` returns wards for any constituency

The frontend will automatically receive the expanded data once the backend is updated with the comprehensive constituency and ward data for all 47 counties.

## 🔧 Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation
```bash
npm install
```

### Running the App
```bash
# Start Expo dev server
npx expo start

# Run on iOS
npx expo start --ios

# Run on Android
npx expo start --android

# Run on Web
npx expo start --web
```

## 📚 Documentation

- [API Testing Notes](./API_TESTING_NOTES.md)
- [Authentication Update](./AUTHENTICATION_UPDATE.md)
- [Biometric Only Update](./BIOMETRIC_ONLY_UPDATE.md)
- [Integration Complete](./INTEGRATION_COMPLETE.md)
- [Location Data Implementation](./LOCATION_DATA_IMPLEMENTATION.md)
- [Quick Start Testing](./QUICK_START_TESTING.md)
- [Test User Guide](./TEST_USER_GUIDE.md)

---

Made with 💙 for Kenya's democratic process.

Built using [Natively.dev](https://natively.dev) - a platform for creating mobile apps.

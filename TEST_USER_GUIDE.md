
# 🧪 Kenya Civic - Test User Guide

## Quick Start Testing

### Step 1: Launch the App
```bash
# The app should already be running
# If not, start it with:
npm run dev
```

### Step 2: Sign In with Passwordless OTP

**🔐 No passwords required! The app uses email verification codes.**

#### First-Time Sign In:
1. Enter your email address (use a real email you can access)
2. Click **"Send Verification Code"**
3. Check your email for a 6-digit OTP code
4. Enter the code in the app
5. Click **"Verify Code"**
6. You'll be authenticated and redirected to registration

#### Returning User Sign In:
**Option A: Email OTP**
1. Enter your email address
2. Click **"Send Verification Code"**
3. Check your email for the OTP
4. Enter the code and verify

**Option B: Biometric (if enabled)**
1. Enter your email address
2. Click **"Sign in with Fingerprint"**
3. Authenticate with your fingerprint/face
4. You'll be signed in immediately

### Step 3: Complete Agent Registration

After OTP verification, you'll be redirected to registration. Fill in:

```
Email: test@kenyacivic.com (pre-filled)
Confirm Email: test@kenyacivic.com
First Name: John
Last Name: Doe
County: Mombasa (select from dropdown)
Constituency: Changamwe (auto-loads based on county)
Ward: Portreitz (auto-loads based on constituency)
Date of Birth: 1990-01-01 (use date picker)
National ID: 12345678 (8 digits)
```

Click **"Continue to Biometric Setup"**

### Step 4: Set Up Biometric Authentication (Optional)

After registration, you'll see the biometric setup screen:

1. **If biometric is available:**
   - Click **"Enable Fingerprint"** (or "Enable Face ID" on iOS)
   - Authenticate with your device's biometric sensor
   - Your biometric credential will be registered
   - Or click **"Skip for now"** to skip

2. **If biometric is not available:**
   - You'll see a message explaining biometric is not set up
   - Click **"Continue without Biometric"**

You'll receive your Civic Code: **MOMBASA-001-0001-01** (example)

### Step 5: Test Dashboard Reports

Navigate to the Dashboard (Home tab) and test each report:

#### 4.1 Candidate Votes
- Default view shows all candidates across all counties
- Use county filter to narrow results
- Should show: Name, Party, Total Votes, Forms Count

#### 4.2 Incident Videos
- **IMPORTANT**: Select a county first (required)
- Shows all incident videos for that county
- Displays: Video Code, Agent Code, Location, Date

#### 4.3 Serial Discrepancies
- Shows Form 34A serial numbers appearing multiple times
- Red border indicates discrepancy
- Filter by county/constituency/ward

#### 4.4 Missing Submissions
- Shows polling stations with no Form 34A submitted
- Filter by county/constituency/ward

#### 4.5 Extra Submissions
- Shows polling stations with multiple submissions
- Orange border indicates extra submissions
- Filter by county/constituency/ward

#### 4.6 Duplicate Submissions
- Shows duplicate submissions by station or serial
- Red border indicates duplicates
- Filter by county/constituency/ward

### Step 6: Test On-Location Features

Navigate to "On-Location" tab:

#### 5.1 Record Incident Video
1. Click "📹 Record Incident Video"
2. Grant camera permission (if prompted)
3. Grant location permission (if prompted)
4. Record a short video (max 60 seconds)
5. Video uploads automatically
6. You'll see success message with video code
7. Video appears in the list below
8. **Limit**: Can upload max 3 videos

#### 5.2 Submit Form 34A
1. Click "📄 Scan & Submit Form 34A"
2. Grant camera permission (if prompted)
3. Take a photo of a Form 34A (or any document for testing)
4. Form uploads automatically
5. Backend extracts:
   - Serial number
   - Candidate names and parties
   - Vote counts
6. You'll see success message with serial number
7. Form details appear below
8. **Limit**: Can only submit ONE form per agent

### Step 7: Test Profile Management

Navigate to "Profile" tab:

#### 6.1 View Profile
- See your Civic Code
- See your name, email
- See your county, constituency, ward
- See your date of birth

#### 6.2 Edit Profile
1. Click "Edit Profile"
2. Change First Name or Last Name
3. Click "Save Changes"
4. Success message appears
5. Profile updates immediately

#### 6.3 Sign Out
1. Click "Sign Out"
2. Redirected to authentication screen
3. Sign in again to verify session persistence

## 🎯 Test Scenarios

### Scenario 1: New Agent Registration with Biometric
```
1. Enter email → Request OTP
2. Check email → Enter 6-digit code
3. Verify OTP → Redirected to registration
4. Fill registration form
5. Set up biometric authentication
6. Verify Civic Code generation
7. Check that you're redirected to Dashboard
8. Verify agent info appears in Profile
9. Sign out
10. Sign in with biometric → Instant access
```

### Scenario 2: Video Upload Workflow
```
1. Go to On-Location
2. Record first video → Success
3. Record second video → Success
4. Record third video → Success
5. Try fourth video → Should show "Maximum Videos Reached"
6. Go to Dashboard → Incident Videos
7. Select your county
8. Verify your videos appear
```

### Scenario 3: Form 34A Submission
```
1. Go to On-Location
2. Submit Form 34A → Success
3. Verify extracted data appears
4. Try to submit again → Should show "Already Submitted"
5. Go to Dashboard → Candidate Votes
6. Verify your submission is counted
```

### Scenario 4: Dashboard Filtering
```
1. Go to Dashboard
2. Test Candidate Votes:
   - View all counties
   - Filter by specific county
   - Verify vote counts
3. Test Incident Videos:
   - Select county
   - Verify videos appear
4. Test other reports with filters
```

### Scenario 5: Profile Edit
```
1. Go to Profile
2. Click Edit Profile
3. Change name
4. Save
5. Verify name updates in Profile
6. Go to Dashboard
7. Verify name updates in agent info
```

### Scenario 6: Session Persistence
```
1. Sign in with OTP
2. Complete registration
3. Close browser/app
4. Reopen browser/app
5. Verify you're still signed in
6. Verify you're on Dashboard (not registration)
```

### Scenario 7: Passwordless Authentication Flow
```
1. New user enters email → Receives OTP
2. Verifies OTP → Account created
3. Completes registration → Sets up biometric
4. Signs out
5. Returns later → Enters email → Uses biometric
6. Instant sign-in (no OTP needed)
```

### Scenario 8: OTP Expiration
```
1. Request OTP
2. Wait 10+ minutes
3. Try to verify expired OTP → Error
4. Request new OTP
5. Verify within 10 minutes → Success
```

## 🐛 Expected Behaviors

### Success Cases
- ✅ Registration creates unique Civic Code
- ✅ Videos upload with location data
- ✅ Form 34A extracts candidate data
- ✅ Dashboard shows real-time data
- ✅ Profile edits save immediately
- ✅ Session persists across restarts

### Error Cases
- ❌ Email mismatch → Error modal
- ❌ Invalid National ID → Error modal
- ❌ 4th video upload → Disabled button
- ❌ 2nd Form 34A → "Already Submitted" modal
- ❌ Missing county filter → "Please select county" message
- ❌ Network error → User-friendly error modal

## 📊 Sample Test Data

### Test Counties
- Mombasa
- Nairobi
- Kisumu
- Nakuru
- Eldoret

### Test Constituencies (Mombasa)
- Changamwe
- Jomvu
- Kisauni
- Likoni
- Mvita
- Nyali

### Test Wards (Changamwe)
- Airport
- Chaani
- Changamwe
- Kipevu
- Miritini
- Port Reitz

## 🎬 Demo Flow (6 minutes)

```
1. Request OTP (30s)
   → Email: demo@kenyacivic.com
   → Click "Send Verification Code"
   → Check email for OTP

2. Verify OTP (30s)
   → Enter 6-digit code
   → Click "Verify Code"
   → Redirected to registration

3. Register Agent (1m)
   → Fill form with Mombasa/Changamwe/Portreitz
   → Click "Continue to Biometric Setup"

4. Set Up Biometric (30s)
   → Click "Enable Fingerprint"
   → Authenticate with fingerprint
   → Get Civic Code

5. Record Video (1m)
   → Go to On-Location
   → Record 10-second video
   → Verify upload success

6. Submit Form 34A (1m)
   → Take photo of any document
   → Verify extraction (may be mock data)
   → Check success message

7. View Dashboard (1m)
   → Check Candidate Votes
   → Filter by Mombasa
   → Check Incident Videos

8. Edit Profile (30s)
   → Change name
   → Save
   → Verify update

9. Sign Out & Biometric Sign In (30s)
   → Sign out
   → Enter email
   → Click "Sign in with Fingerprint"
   → Instant access
```

## 🔌 API Endpoints

Backend URL: `https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev`

### Authentication (Passwordless)
- **POST /api/auth/request-otp** - Request OTP for email
  ```json
  { "email": "user@example.com" }
  ```
- **POST /api/auth/verify-otp** - Verify OTP and sign in
  ```json
  { 
    "email": "user@example.com", 
    "code": "123456"
  }
  ```
- **POST /api/biometric/register** - Register biometric credential
  ```json
  { 
    "email": "user@example.com", 
    "biometricPublicKey": "device_key_123" 
  }
  ```
- **POST /api/biometric/verify** - Sign in with biometric
  ```json
  { 
    "email": "user@example.com", 
    "biometricPublicKey": "device_key_123" 
  }
  ```

### Agents
- **GET /api/agents/me** - Get current agent profile
- **PUT /api/agents/me** - Update agent profile
- **POST /api/agents/register** - Register new agent

### Locations
- **GET /api/locations/counties** - Get all Kenyan counties
- **GET /api/locations/constituencies/:county** - Get constituencies
- **GET /api/locations/wards/:constituency** - Get wards

### Incidents
- **POST /api/incidents/upload-video** - Upload incident video
- **GET /api/incidents/my-videos** - Get current agent's videos

### Form 34A
- **POST /api/form34a/submit** - Submit Form 34A
- **GET /api/form34a/my-submission** - Get current agent's submission

### Dashboard
- **GET /api/dashboard/candidate-votes** - Get aggregated votes
- **GET /api/dashboard/incident-videos** - Get incident videos
- **GET /api/dashboard/serial-discrepancies** - Get discrepancies
- **GET /api/dashboard/missing-submissions** - Get missing submissions
- **GET /api/dashboard/extra-submissions** - Get extra submissions
- **GET /api/dashboard/duplicate-submissions** - Get duplicates

## 🔍 Troubleshooting

### Issue: "Failed to send verification code"
**Solution**: 
1. Check your email address is valid
2. Verify your internet connection
3. Check spam folder for OTP email
4. Try again after a few seconds

### Issue: "Invalid verification code"
**Solution**: 
1. Make sure you're entering the correct 6-digit code
2. OTP codes expire after 10 minutes
3. Request a new code if expired
4. Check for typos in the code

### Issue: "No biometric credential found"
**Solution**: 
1. You need to set up biometric during registration
2. Or sign in with email OTP instead
3. Check if biometric is enabled on your device

### Issue: "Backend URL not configured"
**Solution**: Check `app.json` → `expo.extra.backendUrl` is set

### Issue: "Authentication token not found"
**Solution**: Sign out and sign in again with OTP

### Issue: Camera not working
**Solution**: Grant camera permissions in device settings

### Issue: Location not available
**Solution**: Grant location permissions in device settings

### Issue: Videos not uploading
**Solution**: 
1. Check network connection
2. Verify file size < 50MB
3. Check console for errors

### Issue: Dashboard shows no data
**Solution**: 
1. Ensure you're signed in
2. Ensure agent is registered
3. Check if data exists in backend
4. Try refreshing the page

## 📱 Platform-Specific Notes

### iOS
- Apple OAuth available
- Native date picker
- SecureStore for tokens

### Android
- Google OAuth available
- Material date picker
- SecureStore for tokens

### Web
- OAuth popup flow
- HTML5 date picker
- localStorage for tokens
- File upload via input

---

**Ready to Test!** 🚀

Start with the Quick Start guide above, then explore the test scenarios.
All features are fully integrated and ready for testing.

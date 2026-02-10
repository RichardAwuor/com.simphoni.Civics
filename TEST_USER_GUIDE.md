
# 🧪 Kenya Civic - Test User Guide

## Quick Start Testing

### Step 1: Launch the App
```bash
# The app should already be running
# If not, start it with:
npm run dev
```

### Step 2: Create Test Account

#### Option A: Email/Password
1. Click "Sign Up" on the auth screen
2. Enter test credentials:
   ```
   Name: Test Agent
   Email: test@kenyacivic.com
   Password: TestPass123!
   ```
3. Click "Sign Up"

#### Option B: Google OAuth (Recommended for Web)
1. Click "Continue with Google"
2. Sign in with your Google account
3. Authorize the app

### Step 3: Complete Agent Registration

After authentication, you'll be redirected to registration. Fill in:

```
Email: test@kenyacivic.com
Confirm Email: test@kenyacivic.com
First Name: John
Last Name: Doe
County: Mombasa (select from dropdown)
Constituency: Changamwe (auto-loads)
Ward: Portreitz (auto-loads)
Date of Birth: 1990-01-01 (use date picker)
National ID: 12345678 (8 digits)
```

Click "Register" and you'll receive your Civic Code:
**MOMBASA-001-0001-01** (example)

### Step 4: Test Dashboard Reports

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

### Step 5: Test On-Location Features

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

### Step 6: Test Profile Management

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

### Scenario 1: New Agent Registration
```
1. Sign up with new email
2. Complete registration form
3. Verify Civic Code generation
4. Check that you're redirected to Dashboard
5. Verify agent info appears in Profile
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
1. Sign in
2. Complete registration
3. Close browser/app
4. Reopen browser/app
5. Verify you're still signed in
6. Verify you're on Dashboard (not registration)
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

## 🎬 Demo Flow (5 minutes)

```
1. Sign Up (30s)
   → Email: demo@test.com
   → Password: Demo123!

2. Register Agent (1m)
   → Fill form with Mombasa/Changamwe/Portreitz
   → Get Civic Code

3. Record Video (1m)
   → Go to On-Location
   → Record 10-second video
   → Verify upload success

4. Submit Form 34A (1m)
   → Take photo of any document
   → Verify extraction (may be mock data)
   → Check success message

5. View Dashboard (1m)
   → Check Candidate Votes
   → Filter by Mombasa
   → Check Incident Videos

6. Edit Profile (30s)
   → Change name
   → Save
   → Verify update

7. Sign Out & In (30s)
   → Sign out
   → Sign in again
   → Verify session restored
```

## 🔍 Troubleshooting

### Issue: "Backend URL not configured"
**Solution**: Check `app.json` → `expo.extra.backendUrl` is set

### Issue: "Authentication token not found"
**Solution**: Sign out and sign in again

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

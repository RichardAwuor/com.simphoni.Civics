
# Quick Start Testing Guide

## 🚀 Start the App

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npx expo start

# Press 'w' for web, 'i' for iOS simulator, 'a' for Android emulator
```

## 📱 Test Scenario 1: New User Registration

### Steps:
1. **Open the app** - You'll see the sign-in screen with the Kenya Civic logo

2. **Tap "New Agent Registration"** - Green button at the bottom

3. **Fill in the registration form:**
   ```
   Email: test@example.com
   Confirm Email: test@example.com
   First Name: John
   Last Name: Doe
   County: Nairobi (select from dropdown)
   Constituency: Westlands (select from dropdown)
   Ward: Parklands (select from dropdown)
   Date of Birth: 1990-01-01 (tap to select)
   National ID: 12345678 (8 digits)
   ```

4. **Tap "Continue to Fingerprint Setup"**
   - You'll see: "Check Your Email"
   - In development, check the **backend console logs** for the magic link

5. **Click the magic link** (from email or console logs)
   - You'll be redirected back to the app
   - Registration will complete automatically

6. **Set up biometric:**
   - Tap "Enable Fingerprint" (or "Enable Face ID")
   - Authenticate with your device biometric
   - You'll see your **Civic Code** (e.g., "NAIROBI-008-0001-01")

7. **Verify success:**
   - ✅ You should be on the home screen
   - ✅ Your civic code should be displayed
   - ✅ Profile tab should show your information

### Expected Result:
✅ User registered successfully with civic code generated

---

## 🔐 Test Scenario 2: Biometric Sign-In

### Prerequisites:
- You've already registered (Scenario 1)
- You've set up biometric

### Steps:
1. **Sign out** (if signed in):
   - Go to Profile tab
   - Tap "Sign Out"

2. **Enter your email:**
   ```
   Email: test@example.com
   ```

3. **Tap "Sign In with Biometric"** (red button)

4. **Authenticate with your device biometric:**
   - Use fingerprint or face ID
   - Wait for verification

5. **Verify success:**
   - ✅ You should be signed in immediately
   - ✅ Home screen should load
   - ✅ Profile should show your information

### Expected Result:
✅ Signed in successfully with biometric

---

## 📧 Test Scenario 3: Email Magic Link Sign-In

### Prerequisites:
- You've already registered (Scenario 1)

### Steps:
1. **Sign out** (if signed in):
   - Go to Profile tab
   - Tap "Sign Out"

2. **Enter your email:**
   ```
   Email: test@example.com
   ```

3. **Tap "Sign In with Email Link"** (blue button)

4. **Check your email** (or backend console logs in development):
   - Find the magic link
   - Click the link

5. **Verify success:**
   - ✅ You should be signed in automatically
   - ✅ Home screen should load
   - ✅ Profile should show your information

### Expected Result:
✅ Signed in successfully with email link

---

## 👤 Test Scenario 4: Profile Management

### Prerequisites:
- You're signed in

### Steps:
1. **Navigate to Profile tab** (bottom navigation)

2. **View your information:**
   - ✅ Name displayed
   - ✅ Civic code displayed
   - ✅ Email displayed
   - ✅ Location information displayed

3. **Tap "Edit Profile"**

4. **Change your first name:**
   ```
   First Name: Jane
   ```

5. **Tap "Save Changes"**

6. **Verify success:**
   - ✅ Success modal appears
   - ✅ Name updated in profile
   - ✅ "Edit Profile" button visible again

### Expected Result:
✅ Profile updated successfully

---

## 📊 Test Scenario 5: Dashboard Reports

### Prerequisites:
- You're signed in

### Steps:
1. **Navigate to Dashboard tab** (bottom navigation)

2. **View "Candidate Votes" report:**
   - ✅ Report loads
   - ✅ Candidate data displayed (if any submissions exist)

3. **Scroll horizontally to view other reports:**
   - Incident Videos
   - Serial Discrepancies
   - Missing Submissions
   - Extra Submissions
   - Duplicates

4. **Filter by county:**
   - Tap the county dropdown
   - Select "Nairobi"
   - ✅ Data filters correctly

5. **Try different report types:**
   - Tap each report button
   - ✅ Data loads for each report

### Expected Result:
✅ All reports load and filter correctly

---

## 🐛 Troubleshooting

### Issue: Email not received
**Solution:**
- In development, check the **backend console logs**
- The magic link will be printed there
- Copy and paste the link into your browser

### Issue: Biometric not working
**Solution:**
- Ensure your device has biometric authentication enabled
- Try using "Sign In with Email Link" instead
- If on web, biometric may not be available

### Issue: "Agent not found" error
**Solution:**
- Complete registration first (Scenario 1)
- Verify you clicked the email magic link
- Check backend logs for errors

### Issue: Registration fails
**Solution:**
- Verify all fields are filled correctly
- Ensure email addresses match
- Check that National ID is exactly 8 digits
- Try a different email address

### Issue: Backend not responding
**Solution:**
- Verify backend URL in `app.json`:
  ```json
  "extra": {
    "backendUrl": "https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev"
  }
  ```
- Check if backend is running
- Test backend directly: `curl https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev/api/locations/counties`

---

## 📝 Test Checklist

Use this checklist to verify all functionality:

### Authentication
- [ ] New user registration works
- [ ] Email magic link received
- [ ] Biometric setup works
- [ ] Civic code generated
- [ ] Biometric sign-in works
- [ ] Email link sign-in works
- [ ] Sign out works

### Profile
- [ ] Profile displays correctly
- [ ] Edit profile works
- [ ] Save changes works
- [ ] Profile updates persist

### Dashboard
- [ ] Candidate votes report loads
- [ ] Incident videos report loads
- [ ] Serial discrepancies report loads
- [ ] Missing submissions report loads
- [ ] Extra submissions report loads
- [ ] Duplicates report loads
- [ ] County filter works

### Error Handling
- [ ] Invalid email shows error
- [ ] Missing fields show error
- [ ] Network errors handled gracefully
- [ ] Loading states display correctly
- [ ] Success messages display correctly

---

## 🎯 Success Criteria

The integration is successful if:

1. ✅ New users can register and receive civic codes
2. ✅ Users can sign in with biometric
3. ✅ Users can sign in with email magic link
4. ✅ Profile management works
5. ✅ Dashboard reports load correctly
6. ✅ All API endpoints respond correctly
7. ✅ Error handling works properly
8. ✅ Loading states display correctly
9. ✅ Session persists across app restarts
10. ✅ No crashes or critical errors

---

## 📞 Need Help?

1. **Check the logs:**
   - Frontend: Browser console or React Native debugger
   - Backend: Server console logs

2. **Test API directly:**
   ```bash
   # Test counties endpoint
   curl https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev/api/locations/counties
   
   # Test with authentication (replace TOKEN)
   curl -H "Authorization: Bearer TOKEN" \
     https://4cjk8xzg5w77tfq474mq4utfs59jke49.app.specular.dev/api/agents/me
   ```

3. **Review documentation:**
   - `AUTHENTICATION_UPDATE.md` - Authentication changes
   - `INTEGRATION_SUMMARY.md` - Complete integration details
   - `TEST_USER_GUIDE.md` - Detailed testing guide

---

## ✨ Quick Tips

- **Development Mode:** Magic links are logged to backend console
- **Biometric:** Works on physical devices, may not work on simulators
- **Web:** Use Chrome/Safari for best compatibility
- **Debugging:** Enable "Debug JS Remotely" in Expo for better logs
- **Reset:** Clear app data if you encounter persistent issues

---

**Status:** 🟢 Ready for Testing

**Last Updated:** 2024-02-11

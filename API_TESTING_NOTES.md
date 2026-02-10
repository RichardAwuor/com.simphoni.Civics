
# 🔧 Kenya Civic - API Testing Notes

## Backend URL
```
https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev
```

## Sample Test Credentials

### Test User 1 (Email/Password)
```
Email: agent1@kenyacivic.com
Password: Agent123!
Expected Civic Code: MOMBASA-001-0001-01
```

### Test User 2 (Email/Password)
```
Email: agent2@kenyacivic.com
Password: Agent123!
Expected Civic Code: NAIROBI-002-0002-01
```

### Test User 3 (Email/Password)
```
Email: agent3@kenyacivic.com
Password: Agent123!
Expected Civic Code: KISUMU-003-0003-01
```

## API Endpoint Testing

### 1. Authentication Endpoints

#### Sign Up
```bash
curl -X POST https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "name": "Test User"
  }'
```

#### Sign In
```bash
curl -X POST https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/auth/sign-in \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### 2. Agent Registration

#### Register Agent
```bash
curl -X POST https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/agents/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "confirmEmail": "test@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "county": "Mombasa",
    "constituency": "Changamwe",
    "ward": "Portreitz",
    "dateOfBirth": "1990-01-01",
    "nationalId": "12345678"
  }'
```

#### Get Agent Profile
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/agents/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Update Agent Profile
```bash
curl -X PUT https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/agents/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### 3. Location Data

#### Get Counties
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/locations/counties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Constituencies
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/locations/constituencies/Mombasa \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Wards
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/locations/wards/Changamwe \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Incident Videos

#### Upload Video
```bash
curl -X POST https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/incidents/upload-video \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "video=@/path/to/video.mp4" \
  -F "latitude=-4.0435" \
  -F "longitude=39.6682" \
  -F "locationName=Mombasa"
```

#### Get My Videos
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/incidents/my-videos \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 5. Form 34A

#### Submit Form 34A
```bash
curl -X POST https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/form34a/submit \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "form34a=@/path/to/form.jpg" \
  -F "county=Mombasa" \
  -F "constituency=Changamwe" \
  -F "ward=Portreitz" \
  -F "pollingStation=Portreitz Primary School" \
  -F "latitude=-4.0435" \
  -F "longitude=39.6682"
```

#### Get My Submission
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/form34a/my-submission \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Dashboard Reports

#### Candidate Votes (All Counties)
```bash
curl -X GET https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/candidate-votes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Candidate Votes (Filtered by County)
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/candidate-votes?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Incident Videos by County
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/incident-videos?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Serial Discrepancies
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/serial-discrepancies?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Missing Submissions
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/missing-submissions?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Extra Submissions
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/extra-submissions?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Duplicate Submissions
```bash
curl -X GET "https://ym2m4q87zqt3sjjk5e2sv9sdftz3fafc.app.specular.dev/api/dashboard/duplicate-submissions?county=Mombasa" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Expected Response Formats

### Agent Registration Response
```json
{
  "success": true,
  "agent": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "civicCode": "MOMBASA-001-0001-01",
    "firstName": "John",
    "lastName": "Doe",
    "email": "test@example.com",
    "county": "Mombasa",
    "constituency": "Changamwe",
    "ward": "Portreitz",
    "dateOfBirth": "1990-01-01"
  }
}
```

### Video Upload Response
```json
{
  "videoUrl": "https://storage.example.com/videos/abc123.mp4",
  "videoCode": "MOMBASA-001-0001-01-A",
  "uploadedAt": "2024-01-01T12:00:00Z"
}
```

### Form 34A Submission Response
```json
{
  "form34aId": "550e8400-e29b-41d4-a716-446655440001",
  "serialNumber": "12345678",
  "imageUrl": "https://storage.example.com/forms/abc123.jpg",
  "hasDiscrepancy": false,
  "candidates": [
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "party": "Party A",
      "votes": 1234
    },
    {
      "firstName": "Bob",
      "lastName": "Johnson",
      "party": "Party B",
      "votes": 5678
    }
  ],
  "submittedAt": "2024-01-01T12:00:00Z"
}
```

### Candidate Votes Response
```json
[
  {
    "candidateFirstName": "Jane",
    "candidateLastName": "Smith",
    "partyName": "Party A",
    "totalVotes": 123456,
    "formsCount": 150
  },
  {
    "candidateFirstName": "Bob",
    "candidateLastName": "Johnson",
    "partyName": "Party B",
    "totalVotes": 234567,
    "formsCount": 200
  }
]
```

### Serial Discrepancies Response
```json
[
  {
    "serialNumber": "12345678",
    "submissionCount": 3,
    "forms": [
      {
        "agentCode": "MOMBASA-001-0001-01",
        "county": "Mombasa",
        "constituency": "Changamwe",
        "ward": "Portreitz",
        "submittedAt": "2024-01-01T12:00:00Z"
      },
      {
        "agentCode": "NAIROBI-002-0002-01",
        "county": "Nairobi",
        "constituency": "Westlands",
        "ward": "Parklands",
        "submittedAt": "2024-01-01T12:05:00Z"
      }
    ]
  }
]
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "message": "Email addresses do not match"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication token not found. Please sign in."
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Agent profile not found"
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "You have already submitted a Form 34A"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred. Please try again."
}
```

## Testing Checklist

### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth
- [ ] Sign in with Apple OAuth (iOS)
- [ ] Token persists across app restarts
- [ ] Token refreshes automatically
- [ ] Sign out clears token

### Agent Registration
- [ ] Register with valid data
- [ ] Civic Code generated correctly
- [ ] Email validation works
- [ ] National ID validation (8 digits)
- [ ] County/Constituency/Ward cascade works
- [ ] Date picker works
- [ ] Cannot register twice

### Video Upload
- [ ] Upload first video (A)
- [ ] Upload second video (B)
- [ ] Upload third video (C)
- [ ] Cannot upload fourth video
- [ ] Location captured correctly
- [ ] Video code generated correctly

### Form 34A
- [ ] Submit form successfully
- [ ] Serial number extracted
- [ ] Candidate data extracted
- [ ] Discrepancy detection works
- [ ] Cannot submit twice
- [ ] Location captured correctly

### Dashboard
- [ ] Candidate votes loads
- [ ] County filter works
- [ ] Incident videos loads (with county)
- [ ] Serial discrepancies loads
- [ ] Missing submissions loads
- [ ] Extra submissions loads
- [ ] Duplicate submissions loads

### Profile
- [ ] View agent info
- [ ] Edit name
- [ ] Save changes
- [ ] Changes persist

## Performance Notes

### Expected Response Times
- Authentication: < 2s
- Agent Registration: < 3s
- Video Upload: 5-30s (depends on file size)
- Form 34A Upload: 3-10s (depends on OCR processing)
- Dashboard Reports: < 2s
- Profile Operations: < 1s

### File Size Limits
- Videos: Max 50MB, 60 seconds
- Images: Max 10MB

### Rate Limiting
- No explicit rate limits currently
- Recommended: Max 10 requests per second per user

---

**All endpoints are fully integrated and ready for testing!** 🚀


# Location Data Implementation - Kenya Civic App

## Overview
The Kenya Civic app now has **full support for loading County names, Constituency names, and Ward names** for agent registration. This document describes the implementation.

## Backend Implementation

### Endpoints Available

#### 1. Get All Counties
```
GET /api/locations/counties
```
**Response:** Array of 47 Kenyan counties
```json
[
  { "name": "Baringo", "code": "001" },
  { "name": "Bomet", "code": "002" },
  { "name": "Mombasa", "code": "029" },
  { "name": "Nairobi", "code": "031" },
  ...
]
```

#### 2. Get Constituencies by County
```
GET /api/locations/constituencies/:county
```
**Example:** `/api/locations/constituencies/Nairobi`

**Response:** Array of constituencies for the specified county
```json
[
  { "name": "Kamukunji", "code": "001", "county": "Nairobi" },
  { "name": "Kasarani", "code": "002", "county": "Nairobi" },
  { "name": "Westlands", "code": "008", "county": "Nairobi" },
  ...
]
```

#### 3. Get Wards by Constituency
```
GET /api/locations/wards/:constituency
```
**Example:** `/api/locations/wards/Kamukunji`

**Response:** Array of wards for the specified constituency
```json
[
  { "name": "Eastleigh North", "code": "0001", "constituency": "Kamukunji" },
  { "name": "Eastleigh South", "code": "0002", "constituency": "Kamukunji" },
  { "name": "Pumwani", "code": "0004", "constituency": "Kamukunji" },
  ...
]
```

### Data Coverage

**Counties:** All 47 Kenyan counties with official codes

**Constituencies:** Sample data for major counties:
- Nairobi (8 constituencies)
- Mombasa (4 constituencies)
- Kiambu (10 constituencies)
- Kisumu (7 constituencies)
- Nakuru (11 constituencies)

**Wards:** Sample data for major constituencies:
- Kamukunji (4 wards)
- Kasarani (5 wards)
- Changamwe (3 wards)
- Kisauni (4 wards)
- And more...

## Frontend Implementation

### Registration Screen (`app/(tabs)/register.tsx`)

The registration screen implements a **cascading dropdown pattern**:

1. **County Selection**
   - Loads all 47 counties on screen mount
   - User selects their county from dropdown

2. **Constituency Selection**
   - Automatically loads constituencies when county is selected
   - Dropdown is disabled until county is selected
   - Resets when county changes

3. **Ward Selection**
   - Automatically loads wards when constituency is selected
   - Dropdown is disabled until constituency is selected
   - Resets when constituency changes

### User Flow

```
1. User opens Registration screen
   ↓
2. Counties load automatically (47 counties)
   ↓
3. User selects County (e.g., "Mombasa")
   ↓
4. Constituencies load for Mombasa (4 constituencies)
   ↓
5. User selects Constituency (e.g., "Changamwe")
   ↓
6. Wards load for Changamwe (3 wards)
   ↓
7. User selects Ward (e.g., "Portreitz")
   ↓
8. User completes registration with location data
```

### Code Example

```typescript
// Load counties on mount
useEffect(() => {
  loadCounties();
}, []);

// Load constituencies when county changes
useEffect(() => {
  if (county) {
    loadConstituencies(county);
  }
}, [county]);

// Load wards when constituency changes
useEffect(() => {
  if (constituency) {
    loadWards(constituency);
  }
}, [constituency]);
```

### Error Handling

- All API calls wrapped in try-catch blocks
- User-friendly error messages via custom Modal component
- Console logging for debugging
- Graceful fallback if data fails to load

### Loading States

- Counties load on screen mount
- Constituencies/Wards show loading state during fetch
- Dropdowns disabled until parent selection is made
- Clear visual feedback for user

## Dashboard Integration

The Dashboard screen also uses the county data for filtering reports:

```typescript
// Filter reports by county
<Picker
  selectedValue={selectedCounty}
  onValueChange={(value) => setSelectedCounty(value)}
>
  <Picker.Item label="All Counties" value="" />
  {counties.map((c) => (
    <Picker.Item key={c.code} label={c.name} value={c.name} />
  ))}
</Picker>
```

## Testing the Implementation

### 1. Test County Loading
- Open Registration screen
- Verify all 47 counties appear in dropdown
- Check console logs: `[Register] Counties loaded successfully: 47 counties`

### 2. Test Constituency Loading
- Select "Nairobi" from County dropdown
- Verify 8 constituencies appear
- Check console logs: `[Register] Constituencies loaded successfully: 8 constituencies`

### 3. Test Ward Loading
- Select "Kamukunji" from Constituency dropdown
- Verify 4 wards appear
- Check console logs: `[Register] Wards loaded successfully: 4 wards`

### 4. Test Cascading Reset
- Select County → Constituency → Ward
- Change County selection
- Verify Constituency and Ward reset to empty

## API Authentication

All location endpoints use **authenticated requests** via `authenticatedGet()`:
- Automatically includes Bearer token from auth context
- Works on both Web and Native platforms
- Handles token refresh if needed

## Future Enhancements

To expand the location data coverage:

1. **Add More Constituencies**
   - Edit `backend/src/routes/locations.ts`
   - Add entries to `constituenciesByCounty` object

2. **Add More Wards**
   - Edit `backend/src/routes/locations.ts`
   - Add entries to `wardsByConstituency` object

3. **Load from Database**
   - Create `counties`, `constituencies`, `wards` tables
   - Update endpoints to query database instead of static data

4. **Import from External Source**
   - Use IEBC official data
   - Import via CSV or API integration

## Summary

✅ **Backend:** All 3 location endpoints implemented and working
✅ **Frontend:** Cascading dropdowns with proper state management
✅ **Data:** 47 counties + sample constituencies and wards
✅ **UX:** Loading states, error handling, and user feedback
✅ **Integration:** Used in both Registration and Dashboard screens

The location data loading system is **fully functional** and ready for agent registration!

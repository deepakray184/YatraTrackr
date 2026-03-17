# YatraTrackr: Specialized Operational Tool for Railway Personnel

YatraTrackr is a data-driven operations platform for railway staff and contractors. This repository includes:
# RailOps: Specialized Operational Tool for Railway Personnel

RailOps is a data-driven operations platform for railway staff and contractors. This repository includes:
- **Android client** to fetch traveller information via PNR and submit cleanliness reviews.
- **Node.js backend** that stores PNR snapshots and signed review records.

## Important Disclaimer & Data Source
- **Non-Official Status:** YatraTrackr is an independent, privately developed application.
- It is **not affiliated with, authorized by, or endorsed by IRCTC or Indian Railways**.
- Any live PNR integration must use officially permitted/licensed data providers and must comply with IRCTC and legal requirements.

## Features
1. Fetch traveller information by 10-digit PNR.
2. Persist fetched passenger snapshot into backend storage.
3. Capture cleanliness rating and staff comments.
4. Capture signature strokes from Android and store them in backend.

## Backend setup
```bash
cd backend
npm install
npm start
```

### Optional environment variables for real provider integration
- `IRCTC_API_BASE_URL`
- `IRCTC_API_KEY`
- `PORT` (default `4000`)

If provider variables are not set, the API falls back to mock PNR data for development.

## Android setup
1. Open `android-app` in Android Studio (Hedgehog+).
2. Sync Gradle.
3. Run app on emulator/device.
4. Ensure backend runs on host at port `4000` (emulator URL in app uses `http://10.0.2.2:4000/`).

## API endpoints
- `POST /api/trips/fetch-by-pnr`
  - body: `{ "pnr": "1234567890", "requestedBy": "staff123" }`
- `POST /api/reviews`
  - body: `{ "pnr": "1234567890", "staffId": "staff123", "cleanlinessRating": 4, "comments": "Coach clean", "signaturePayload": "x1,y1;x2,y2" }`
- `GET /health`

## Storage
Backend writes JSON files into `backend/data`:
- `travellers.json`
- `reviews.json`

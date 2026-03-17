# YatraTrackr: Specialized Operational Tool for Railway Personnel

YatraTrackr is a data-driven operations platform for railway staff and contractors. This repository includes:
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

## Azure deployment steps (separate)

### 1) Prerequisites
- Install Azure CLI and sign in:
```bash
az login
```
- Set the subscription:
```bash
az account set --subscription "<SUBSCRIPTION_ID>"
```

### 2) Create Azure resources
```bash
az group create -n yatratrackr-rg -l centralindia
az appservice plan create -g yatratrackr-rg -n yatratrackr-plan --is-linux --sku B1
az webapp create -g yatratrackr-rg -p yatratrackr-plan -n yatratrackr-api --runtime "NODE|22-lts"
```

### 3) Configure backend app settings
Set runtime settings (dummy mode). If `IRCTC_API_BASE_URL` and `IRCTC_API_KEY` are not configured, backend automatically uses mock PNR data.
```bash
az webapp config appsettings set -g yatratrackr-rg -n yatratrackr-api --settings \
WEBSITE_NODE_DEFAULT_VERSION=22-lts \
SCM_DO_BUILD_DURING_DEPLOYMENT=true
```

### 4) Deploy backend code to Azure App Service
From repository root:
```bash
cd backend
zip -r ../backend.zip .
cd ..
az webapp deploy -g yatratrackr-rg -n yatratrackr-api --src-path backend.zip --type zip
```

### 5) Validate deployment
```bash
curl https://yatratrackr-api.azurewebsites.net/health
curl -X POST https://yatratrackr-api.azurewebsites.net/api/trips/fetch-by-pnr \
  -H "Content-Type: application/json" \
  -d '{"pnr":"1234567890","requestedBy":"azure-test"}'
```

### 6) Connect Android app to Azure backend
Update the base URL in Android app from emulator-local URL to Azure URL:
- Current local URL: `http://10.0.2.2:4000/`
- Azure URL example: `https://yatratrackr-api.azurewebsites.net/`

Then build and distribute the APK/AAB from Android Studio.

### 7) Recommended production hardening
- Replace file-based JSON storage with Azure SQL or Cosmos DB.
- Use Azure Key Vault for provider API secrets.
- Restrict CORS and add authentication/authorization for railway staff workflows.

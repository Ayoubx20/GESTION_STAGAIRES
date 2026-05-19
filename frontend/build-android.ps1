# This script will convert your web app into an Android app using Capacitor and open it in Android Studio.

Write-Host "1. Installing Capacitor Core and Android packages..." -ForegroundColor Cyan
npm install @capacitor/core @capacitor/android

Write-Host "`n2. Installing Capacitor CLI..." -ForegroundColor Cyan
npm install -D @capacitor/cli

Write-Host "`n3. Initializing Capacitor project..." -ForegroundColor Cyan
# Initialize capacitor (we use --force to overwrite if it already exists)
# npx cap init GESTION com.gestion.app --web-dir dist --force

Write-Host "`n4. Building the React frontend..." -ForegroundColor Cyan
npm run build

Write-Host "`n5. Adding Android platform to Capacitor..." -ForegroundColor Cyan
npx cap add android

Write-Host "`n6. Syncing web code to Android project..." -ForegroundColor Cyan
npx cap sync android

Write-Host "`n7. Opening Android Studio! (This may take a moment)" -ForegroundColor Green
npx cap open android

Write-Host "`nDone! Android Studio should now be opening your project." -ForegroundColor Green
Write-Host "From Android Studio, you can run the app on an emulator or your physical Android device." -ForegroundColor Yellow

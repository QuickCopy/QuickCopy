# QuickCopy Android Deployment Guide

## ✅ Setup Complete!

Your React app has been successfully converted to an Android app using Capacitor.

## 📱 Project Structure

```
QuickCopy/
├── android/          # Native Android project
├── dist/            # Built web assets
├── src/             # React source code
└── capacitor.config.ts  # Capacitor configuration
```

## 🚀 How to Build and Deploy

### Option 1: Using Android Studio (Recommended)

1. **Open the project in Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Wait for Gradle sync** to complete

3. **Build the APK:**
   - Click **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - The APK will be generated at: `android/app/build/outputs/apk/debug/app-debug.apk`

4. **Run on Device/Emulator:**
   - Click the green **Run** button (▶️) in Android Studio
   - Select your device or emulator

### Option 2: Command Line (Advanced)

If you have Android SDK installed:

```bash
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🔧 Building Release APK (For Production)

### In Android Studio:

1. **Build** → **Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select your keystore
4. Choose **release** build variant
5. Sign with V2 signature
6. Click **Finish**

### Command Line:

```bash
cd android
.\gradlew assembleRelease
```

## 📝 Important Configurations

### App Information
- **App Name:** QuickCopy
- **Package ID:** com.quickcopy.app
- **Web Directory:** dist

### Updating App Content

Whenever you make changes to your React code:

```bash
# 1. Rebuild the web app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Open in Android Studio and rebuild
npx cap open android
```

## 🔐 Permissions

The app is configured with default permissions. To add specific Android permissions, edit:
`android/app/src/main/AndroidManifest.xml`

Common permissions:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## 🎨 App Icon

To change the app icon:
1. Replace icon files in `android/app/src/main/res/mipmap-*/ic_launcher.png`
2. Or use Android Studio's Image Asset Studio (right-click res folder → New → Image Asset)

## 📊 Testing

### On Physical Device:
1. Enable **Developer Options** on your Android device
2. Enable **USB Debugging**
3. Connect via USB
4. Run from Android Studio

### On Emulator:
1. Open **Device Manager** in Android Studio
2. Create a new virtual device
3. Select system image (API 21+)
4. Run the app

## 🛠️ Troubleshooting

### Build Errors:
- Make sure you have Android Studio installed
- Ensure Android SDK is properly configured
- Check that `ANDROID_HOME` environment variable is set

### App Crashes:
- Check Logcat in Android Studio for errors
- Enable web contents debugging in `capacitor.config.ts`

### Web View Issues:
- Run `npx cap sync android` after any code changes
- Rebuild the web app with `npm run build`

## 📦 Next Steps

1. **Test the app** thoroughly on multiple devices
2. **Customize the app icon** and splash screen
3. **Configure signing** for release builds
4. **Optimize performance** if needed
5. **Submit to Google Play Store** when ready

## 🔗 Useful Commands

```bash
# Build web app
npm run build

# Sync web assets to Android
npx cap sync android

# Copy without full sync
npx cap copy android

# Update native projects only
npx cap update android

# Open in Android Studio
npx cap open android

# List connected devices
adb devices
```

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Google Play Publishing](https://support.google.com/googleplay/android-developer/answer/9859152)

---

**Need help?** Your app is ready to build! Just run `npx cap open android` to get started.

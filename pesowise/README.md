# PesoWise

A student allowance (baon) tracker. Set your weekly or monthly allowance, log what you spend in a few
taps, and see how much you can still spend per day. The phone vibrates and shows a warning when you
are close to or over your budget. You can attach a photo of the receipt to any expense.

Built with **Ionic Vue** and packaged as an Android APK with **Apache Cordova**.

## Features

| Feature | What it does |
| --- | --- |
| Accounts | Register and log in. Data is stored on the phone only. Passwords are salted and hashed (PBKDF2, SHA-256). Five wrong passwords lock login for 30 seconds. |
| Budget summary | Home shows the money left for this week or month, a progress bar, how much you spent today, a "safe to spend per day" amount and the days left. The card turns orange when you reach the warning level and red when you are over budget. |
| Log expenses | Tap **+** to add an expense: amount, category (Food, Fare, School, Load / Data, Snacks, Others), note and date. Tap any expense to edit it or delete it. |
| Receipt photo | Take a receipt photo with the camera or pick one from the gallery. Tap the photo to view it full screen. |
| Budget alerts | When an expense pushes your spending past the warning level (50 / 70 / 80 / 90%) or over the allowance, the phone vibrates and a message appears. |
| Expenses list | Filter by this period, last period or all; filter by category; search notes. Grouped by day with daily totals. Swipe left to delete. |
| Reports | Spending per day (bar chart; days above your daily share are red), spending per category, total saved or over, average per day, and a list of past weeks or months. |
| Fingerprint lock | Optional lock when the app opens or comes back from the background. |
| Settings | Allowance, weekly or monthly period, week start day, warning level, vibration on or off, change password, a "Device access" list that tests the camera, vibration and fingerprint, sample data for demos, delete all expenses, delete account. |

## Tech stack

| Part | Used |
| --- | --- |
| UI | Ionic 8 (`@ionic/vue`), Ionicons |
| Framework | Vue 3 + Vue Router |
| Build tool | Vite |
| Android wrapper | Apache Cordova |
| APK build | Gradle, Android SDK, JDK 17 |
| Storage | `localStorage` on the phone (no server or database) |
| Cordova plugins | camera, vibration, fingerprint-aio |
| Charts | Plain HTML and CSS (no chart library) |

## Project structure

```
pesowise/
├─ cordova/config.xml        Cordova settings (copied into the Cordova project)
├─ docs/screenshots/         Screenshots for the paper / presentation
├─ index.html
├─ package.json
├─ vite.config.js
└─ src/
   ├─ main.js                Starts the app after Cordova is ready
   ├─ App.vue                Fingerprint lock screen
   ├─ router/index.js        Routes and login guard
   ├─ theme/variables.css    Colors and shared styles
   ├─ components/
   │  ├─ CategoryIcon.vue    Colored category icon
   │  ├─ ExpenseItem.vue     One row in an expense list
   │  └─ ExpenseEditor.vue   Add / Edit expense sheet (camera, alerts)
   ├─ services/
   │  ├─ storage.js          localStorage wrapper
   │  ├─ auth.js             Register, login, password hashing, lockout
   │  ├─ store.js            Expenses, settings and categories
   │  ├─ budget.js           Week / month ranges, totals, budget status
   │  ├─ device.js           Camera, vibration, fingerprint (Cordova plugins)
   │  └─ editor.js           Opens the expense sheet from any page
   └─ views/
      ├─ LoginPage.vue
      ├─ RegisterPage.vue
      ├─ TabsPage.vue        Bottom tabs
      ├─ HomePage.vue
      ├─ ExpensesPage.vue
      ├─ ReportsPage.vue
      └─ SettingsPage.vue
```

## Run it in the browser (for development)

```
npm install
npm run dev
```

Open the link it prints (usually http://localhost:5173). In Chrome, press F12 and turn on the phone
view (Ctrl+Shift+M) to see it at phone size. The camera uses a file picker in the browser. The
fingerprint lock works only in the installed app.

## Before you build the APK (one time)

Install these on Windows:

1. **Node.js** (LTS version)
2. **JDK 17**
3. **Android Studio** (it installs the Android SDK). In SDK Manager, install an Android SDK Platform and Build-Tools.
4. **Gradle 8.x** (binary zip), extracted to a folder such as `C:\Gradle\gradle-8.14`, with its `bin` folder added to PATH.
5. **Cordova**:
   ```
   npm install -g cordova
   ```

Check everything with `node -v`, `java -version`, `gradle -v` and `cordova -v`.

## Build the APK

### 1. Build the web app

In the `pesowise` folder:

```
npm install
npm run build
```

This creates the `dist` folder.

### 2. Create the Cordova project

Run these **outside** the `pesowise` folder (for example, in the folder above it):

```
cordova create pesowise-cordova com.example.pesowise PesoWise
cd pesowise-cordova
cordova platform add android
cordova plugin add cordova-plugin-camera
cordova plugin add cordova-plugin-vibration
cordova plugin add cordova-plugin-fingerprint-aio
```

### 3. Replace config.xml

Copy `pesowise/cordova/config.xml` over `pesowise-cordova/config.xml` (overwrite).

### 4. Copy the web app into Cordova

1. Delete everything inside `pesowise-cordova/www`.
2. Copy everything inside `pesowise/dist` into `pesowise-cordova/www`.

`www` must contain `index.html` and an `assets` folder directly (not inside another `dist` folder).

### 5. Build

In the `pesowise-cordova` folder:

```
cordova requirements
cordova build android
```

The first build takes 5 to 10 minutes. The APK is here:

```
pesowise-cordova/platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

Send it to the phone and install it (allow "Install unknown apps" if asked).

## Updating the app after changing code

1. `npm run build` in the `pesowise` folder.
2. Empty `pesowise-cordova/www` and copy the new `dist` contents into it.
3. `cordova build android` in the `pesowise-cordova` folder.
4. Install the new `app-debug.apk` over the old one (data is kept).

## Phone setup

1. Long-press the PesoWise icon > **App info** > **Permissions** > set **Camera** to Allow.
2. Make sure the phone is not on silent or Do Not Disturb, and vibration is on in Sound & vibration.
3. To use the fingerprint lock, a fingerprint must already be set up in the phone's settings.
4. In the app, open **Settings > Device access** and tap each row to test it.

## Testing on a phone

1. Register, then go to **Settings** and set your allowance (for example ₱1,000 per week).
2. Tap **+** on Home and add an expense with a receipt photo.
3. Add expenses until you pass the warning level. The phone vibrates and the Home card turns orange.
   Go over the allowance and it vibrates again and turns red.
4. For a quick demo, use **Settings > Add sample expenses**, then open **Reports**.
5. Turn on **Fingerprint lock**, close the app, wait more than 10 seconds and open it again.

## Limits

- Accounts and data stay on the phone. Uninstalling the app erases them.
- Receipt photos are stored inside the app's storage (about 5 MB in total). If it fills up, the
  expense is still saved without the photo.
- "Saved / over" for past periods is compared with your current allowance.
- Use a real phone for the camera, vibration and fingerprint. The emulator cannot test them properly.

# AppDev Case Study: PesoWise

PesoWise is a student allowance (baon) tracker for Android, built with Ionic Vue and Apache Cordova.

The app source and the full setup and build guide are in [`pesowise/`](pesowise/README.md).
Screenshots are in [`pesowise/docs/screenshots`](pesowise/docs/screenshots).

## Getting the APK

GitHub builds the APK automatically every time something is pushed to `main`
(see `.github/workflows/build-apk.yml`). Nothing needs to be installed on your computer for this.

1. Open the repo on GitHub and go to the **Actions** tab.
2. Open the latest **Build APK** run (it takes about 5 minutes and shows a green check when done).
3. Under **Artifacts**, download **PesoWise-APK**. Unzip it to get `app-debug.apk`.

To build it on your own computer instead, follow "Build the APK" in [`pesowise/README.md`](pesowise/README.md).

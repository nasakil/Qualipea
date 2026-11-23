# QualiPea

**Know every kernel’s grade.**

QualiPea is a mobile optical-grading app built with **Expo** and **React Native** for classifying Spanish peanut kernels into **Grade A**, **Grade B**, or **Grade C** using a YOLO11-cls workflow—complete with confidence scores, low-confidence expert review flags, reference pricing, handling advice, and scan history.

---

## Features

- **Interactive Splash & Onboarding** — Editorial launch screen with an animated swipe-up arrow handle and a 4-step guided onboarding flow.
- **Dual Scanning Modes**
  - **Demo Mode (Pi 5 Chamber Simulation):** Simulated Raspberry Pi 5 chamber connection flow with progressive checkmarks, LED status, and sample scan data.
  - **Live Camera Mode (Demo Mode Off):** Real rear-camera capture via `expo-camera` with viewfinder brackets, flash/torch toggle, photo preview, and retake support. Captured photos are saved directly to History and displayed in thumbnails and detail modals.
- **Classification & Reference Pricing** — Animated grade badge, SVG confidence ring, per-class probability bars (`A / B / C`), low-confidence expert review banners, reference price breakdown, and handling advice.
- **Scan History & Expert Correction** — Filterable scan log (`All`, `Grade A`, `Grade B`, `Grade C`, `Flagged`) with centered detail sheets and non-destructive expert grade overrides (original model prediction is always preserved).
- **Dashboard Analytics** — Total scan distribution, average confidence, Grade A rate, review queue, animated 7-day activity chart, and confidence breakdown by grade.
- **System Diagnostics & Preferences** — 6-point hardware/service diagnostic runner plus toggles for **Animations**, **Sound effects**, **Demo mode**, and **Dark mode**.
- **Native Touch Gestures** — Swipe left/right between main tabs (`Home`, `History`, `Dashboard`, `Settings`), swipe down to dismiss bottom sheets, and swipe right from the left edge to go back on sub-screens.

---

## Tech Stack

- **Framework:** React Native + Expo (`~58.0.0`)
- **Camera & Media:** `expo-camera`, `expo-audio`, `expo-asset`, `expo-font`
- **UI & Graphics:** `expo-linear-gradient`, `react-native-svg`, `@expo/vector-icons`
- **Build & Distribution:** EAS Build (Android APK)

---

## Project Structure

```text
qualipea-expo/
├── App.jsx                  # Root entry wrapping AppProvider and Navigator
├── app.json                 # Expo manifest, permissions, and EAS project config
├── eas.json                 # EAS Build profiles (Android APK)
├── assets/
│   └── sounds/              # UI, shutter, boot, and grade feedback WAV audio
└── src/
    ├── AppContext.jsx       # Global state, scan workflow, audio & animation toggles
    ├── Navigator.jsx        # Screen router with directional transitions & swipe gestures
    ├── theme.js             # Light/dark palettes, grade colors, and AnimCtx
    ├── data.js              # Grade labels, advice copy, and sample seed scans
    ├── sound.js             # Audio playback controller
    ├── components/          # TabBar, SheetModal, Kernel SVG, Ring, Bar, Card, Btn, etc.
    └── screens/             # Splash, Onboarding, Home, ScanPrep, Scanner,
                             # Processing, Result, History, Dashboard, Settings
```

---

## Getting Started

### Prerequisites
- **Node.js** `>= 22.13`
- **Expo Go** on iOS or Android (for development preview)

### Run Locally

```bash
npm install
npx expo start
```

Scan the QR code in your terminal using **Expo Go** (or press `a` for Android emulator / `w` for web).

---

## Building an Android APK

This project is preconfigured with [eas.json](eas.json) to output an installable Android `.apk` via Expo Application Services (EAS):

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

Once the cloud build finishes, open the EAS build link to download or scan-install the `.apk` directly on an Android device.

---

## Notes

- Sample prices, model metadata (`yolo11n-cls 1.0.0`), and demo chamber states are illustrative for prototyping.
- Turning **Demo mode** off in **Settings** switches the scanner to your device's live rear camera and stores captured kernel photos in your session history.

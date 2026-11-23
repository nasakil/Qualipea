<div align="center">

# 🥜 QualiPea

### **Know every kernel’s grade.**

*AI-powered optical grading for Spanish peanut kernels — built with Expo, React Native, and Raspberry Pi 5.*

[![Expo](https://img.shields.io/badge/Expo-~58.0.0-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React_Native-19.3-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Raspberry Pi 5](https://img.shields.io/badge/Raspberry_Pi_5-Flask_API-C51A4A?style=for-the-badge&logo=raspberrypi&logoColor=white)](#raspberry-pi-5-integration)
[![YOLO11-cls](https://img.shields.io/badge/Model-YOLO11--cls-1F6A49?style=for-the-badge)](#grading-pipeline)
[![Android APK](https://img.shields.io/badge/Android-EAS_APK-3DDC84?style=for-the-badge&logo=android&logoColor=white)](#building-the-android-apk)

<br/>

[Features](#-features) • [Architecture](#-architecture) • [Raspberry Pi 5 API](#-raspberry-pi-5-integration) • [Getting Started](#-getting-started) • [Build APK](#-building-the-android-apk)

</div>

---

## ✨ Overview

**QualiPea** pairs a mobile React Native companion app with a **Raspberry Pi 5 optical grading chamber** (or your phone's built-in camera) to classify individual Spanish peanut kernels into **Grade A**, **Grade B**, or **Grade C** in seconds.

Every scan produces:
- A **grade classification** with per-class probability bars (`A`, `B`, `C`)
- A **confidence ring** with automatic **low-confidence flagging** (`< 75%`) for expert review
- **Reference market pricing** and actionable **handling advice**
- A **persistent session history** with saved kernel photos and non-destructive expert overrides

---

## 🚀 Features

| Area | Highlights |
| :--- | :--- |
| **Interactive Launch** | Editorial dark-emerald Splash screen with a bouncing swipe-up arrow track + 4-step Onboarding flow |
| **Live Camera & Demo Mode** | Toggle seamlessly between the **Demo Pi 5 Chamber** and **Real Rear Camera** (`expo-camera`) with torch/flash control |
| **Raspberry Pi 5 Sync** | Connects to your local Pi 5 Flask server (`http://192.168.137.31:5000`), editable directly in Settings |
| **Classification Result** | Animated grade badge, SVG progress confidence ring, captured photo preview, probability bars, Price & Advice tabs |
| **History & Expert Override** | Filter by `All`, `Grade A/B/C`, or `Flagged`; tap any scan to view the centered kernel photo and record expert corrections |
| **Dashboard Analytics** | Total scan distribution, average confidence, Grade A rate, review queue, and animated 7-day activity chart |
| **Gestures & Polish** | Swipe left/right across tabs, swipe down to dismiss bottom sheets, edge-swipe back on sub-screens, and a global **Animations** toggle |

---

## 🧭 Architecture

```mermaid
flowchart LR
    A["📱 QualiPea Mobile App<br/>(Expo / React Native)"] -->|"GET /health · /status"| B["🍓 Raspberry Pi 5<br/>http://192.168.137.31:5000"]
    A -->|"POST /predict<br/>(multipart/form-data)"| B
    B -->|"YOLO11-cls Inference"| C["🧠 Grade A / B / C<br/>+ Confidence & Probs"]
    C -->|"JSON Response"| A
    A -->|"Save Scan + Photo"| D["🗂️ History & Dashboard"]
```

---

## 🍓 Raspberry Pi 5 Integration

When **Demo mode** is turned **OFF** in **Settings**, QualiPea communicates directly with your Raspberry Pi 5 server over local Wi-Fi / hotspot.

- **Default Server URL:** `http://192.168.137.31:5000` *(editable anytime in **Settings → Raspberry Pi 5 server URL**)*
- **Health Check Endpoints:** `GET /health` → fallback `/status` → fallback `/`
- **Classification Endpoint:** `POST /predict` *(fallback `/classify`, `/grade`)* with `multipart/form-data` (`file` / `image`)

### Example JSON Response

```json
{
  "grade": "A",
  "confidence": 0.94,
  "model": "yolo11n-cls 1.0.0",
  "probabilities": {
    "A": 0.94,
    "B": 0.04,
    "C": 0.02
  }
}
```

> **Tip:** Both Android (`usesCleartextTraffic: true`) and iOS (`NSAllowsArbitraryLoads: true`) are preconfigured in [app.json](app.json) so local `http://` LAN requests work in standalone builds.

---

## 📁 Project Structure

```text
qualipea-expo/
├── App.jsx                    # Root entry wrapping AppProvider and Navigator
├── app.json                   # Expo manifest, camera/audio permissions & EAS config
├── eas.json                   # EAS Build profiles (Android APK)
├── assets/
│   └── sounds/                # Custom WAV audio cues (boot, shutter, nav, grades)
└── src/
    ├── api.js                 # Raspberry Pi 5 HTTP health & classification client
    ├── AppContext.jsx         # Global state, Pi 5 sync, animations & audio toggles
    ├── Navigator.jsx          # Screen router with directional transitions & gestures
    ├── theme.js               # Light/dark palettes, grade colors & AnimCtx
    ├── data.js                # Grade definitions, handling advice & sample scans
    ├── sound.js               # Audio playback engine
    ├── components/            # TabBar, SheetModal, Kernel SVG, Ring, Bar, Card, Btn
    └── screens/               # Splash, Onboarding, Home, ScanPrep, Scanner,
                               # Processing, Result, History, Dashboard, Settings
```

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js** `>= 22.13`
- **Expo Go** on iOS or Android

### Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the Expo dev server
npx expo start
```

Scan the QR code with **Expo Go** (or press `a` for Android emulator / `w` for web).

---

## 📦 Building the Android APK

QualiPea is preconfigured with [eas.json](eas.json) to build an installable standalone Android `.apk` via **EAS Build**:

```bash
# Sign in to Expo
npx eas-cli login

# Build an Android APK in the cloud
npx eas-cli build -p android --profile preview
```

Once the cloud build completes, open the EAS build URL to download or QR-install the `.apk` directly onto any Android device.

---

<div align="center">

Made with 🥜 for smarter peanut quality grading.

</div>

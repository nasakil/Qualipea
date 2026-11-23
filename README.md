# QualiPea (Expo SDK 58)
Prototype of the QualiPea Spanish peanut kernel grading app. Simulated chamber and sample data (Demo mode).

Targets Expo SDK 58 (React Native 0.88, React 19.2). Needs Node 22.13 or newer.

## Run
1. `npm install` (the included `.npmrc` sets `legacy-peer-deps=true`, so npm won't stop on peer-version conflicts before Expo has picked the right versions)
2. `npx expo install --fix` (replaces react, react-native, expo-linear-gradient, react-native-svg, expo-status-bar and @expo/vector-icons with the exact versions SDK 58 expects)
3. `npx expo-doctor` (optional check)
4. `npx expo start`

If step 1 still fails, delete `node_modules` and `package-lock.json`, then run it again.

Expo Go for SDK 58 reaches the app stores a few weeks after the October 2026 release. If your store version of Expo Go can't open the project yet, use a development build (`npx expo run:android` or `npx expo run:ios`).

## Structure
Components, screens, context and navigator are `.jsx` files; theme, data and sound helpers are plain `.js`.
- `index.js` registers the root component; `App.jsx` wraps the app; `src/Navigator.jsx` picks the screen and mounts overlays
- `src/AppContext.jsx` all state and actions (connect, analyze, save, demo mode, diagnostics)
- `src/theme.js` colors and theme context; `src/data.js` grades, advice, sample scans
- `src/components/` Kernel, Card, Txt, Btn, Chip, Bar, Ring, Brackets, Row, Top, TabBar, Toast, SavingOverlay, SheetModal
- `src/screens/` Splash, Onboarding, Home, ScanPrep, Scanner, Processing, Result, History, Dashboard, Settings

Wire real endpoints (/health, /capture, /classify, /model/info) in `connect()` and `analyze()` inside `src/AppContext.jsx` when Demo mode is off.

## Sound
`src/sound.js` plays short WAV effects from `assets/sounds` with expo-audio (expo-av was removed from the SDK). `src/soundMap.js` lists several variants per sound; `sfx()` picks one at random and varies its pitch slightly, so effects are never identical. Splash, each of the 4 onboarding slides and grades A, B and C have their own sounds (A gets a brighter variant above 90% confidence). Settings has a Sound effects switch.

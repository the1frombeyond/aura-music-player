<img width="1919" height="940" alt="Screenshot 2026-05-08 110939" src="https://github.com/user-attachments/assets/53aad91a-47a4-4b90-90b2-21ecafe6bd76" />

# 🎵 AURA Music Player

A beautiful, modern music player built with Electron featuring an immersive CoverFlow interface, real-time audio visualization, and particle effects.

![AURA Music Player](https://img.shields.io/badge/AURA-Music%20Player-purple) ![Electron](https://img.shields.io/badge/Electron-28.0.0-blue) ![License](https://img.shields.io/badge/license-ISC-green)

---

## ✨ Features

- **🎨 CoverFlow Interface** - Swipe through albums with a stunning 3D cover flow effect
- **📊 Audio Visualizer** - Real-time frequency visualization that reacts to your music
- **✨ Particle Effects** - Dynamic background particles for a mesmerizing experience
- **📝 Queue Management** - Smart play queue with shuffle and repeat modes
- **🎧 Multi-Format Support** - MP3, WAV, FLAC, M4A, AAC formats
- **🪟 Windows Integration** - Set as default music player with file associations
- **🎨 Dynamic Colors** - Album artwork extracts colors for a personalized UI

---

## 📦 Installation

### Option 1: Install via npm (Global)

```bash
npm install -g aura-music-player
```

Then run:
```bash
aura-music-player
```

### Option 2: Clone & Run Locally

```bash
git clone https://github.com/yourusername/aura-music-player.git
cd aura-music-player
npm install
npm start
```

### Option 3: Download Windows Installer

1. Download the latest `AURA Music Player Setup.exe` from the [Releases](https://github.com/yourusername/aura-music-player/releases) page
2. Run the installer
3. Launch from Start Menu or Desktop shortcut

---

## 🚀 Building the Windows Installer

```bash
npm install
npm run build:win
```

The installer will be created in the `dist/` folder. This installer will:
- ✅ Install AURA Music Player
- ✅ Create desktop & Start Menu shortcuts
- ✅ Register as default player for music files (.mp3, .wav, .flac, .m4a, .aac)
- ✅ Allow custom installation directory

---

## 🎮 Usage

### Opening Music Files

| Method | Description |
|--------|-------------|
| **Drag & Drop** | Drag music files or folders into the player |
| **File Picker** | Click the upload area to browse and select files |
| **Command Line** | `aura-music-player "path\to\music.mp3"` |
| **File Association** | Double-click any music file (if set as default) |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` (Left Arrow) | Previous track |
| `→` (Right Arrow) | Next track |
| `↑` (Up Arrow) | Volume up |
| `↓` (Down Arrow) | Volume down |
| Mouse Wheel | Scroll through albums |

### Playback Controls

- **Shuffle** - Randomize play order
- **Repeat Off** - Play through queue once
- **Repeat All** - Loop the entire queue
- **Repeat One** - Loop the current track

---

## 🪟 Setting as Default Music Player

### Method 1: During Installation
Run the installer - it automatically registers file associations.

### Method 2: Windows Settings
1. Right-click any music file (e.g., `.mp3`)
2. Select **"Open with"** > **"Choose another app"**
3. Select **"AURA Music Player"**
4. Check **"Always use this app to open .mp3 files"**

### Method 3: Windows Default Apps
1. Press `Win + I` to open Settings
2. Go to **Apps** > **Default apps**
3. Scroll down and click **"Choose default apps by file type"**
4. Find `.mp3` and select **"AURA Music Player"**

---

## 🛠️ Development

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/aura-music-player.git
cd aura-music-player

# Install dependencies
npm install

# Run in development mode
npm start
```

### Build Commands

```bash
# Run in development mode
npm start

# Build for Windows
npm run build:win

# Build without packaging (for testing)
npm run build:dir
```

---

## 📁 Project Structure

```
MUSIC PLAYER/
├── main.js                # Electron main process
├── app.js                 # Renderer process (UI logic)
├── index.html             # Main UI layout
├── styles.css             # Styling & animations
├── startup.js             # Startup script
├── cli.js                 # CLI entry point for npm global install
├── package.json           # Package configuration
├── installer.nsh          # NSIS installer script
├── assets/                # Icons and assets
│   └── icon.ico          # App icon (required for build)
├── dist/                  # Build output (generated)
└── node_modules/          # Dependencies (generated)
```

---

## 🎨 Customization

### Adding an App Icon
Before building the Windows installer, add your custom icon:
1. Create a `128x128` or larger `.ico` file
2. Save it as `assets/icon.ico`

You can convert PNG to ICO using:
- Online tools: [icoconvert.com](https://icoconvert.com)
- Image editors: Photoshop, GIMP, etc.

---

## ⚠️ Troubleshooting

### "Electron not found" Error
```bash
npm install electron --save
```

### App Won't Start
1. Check that all dependencies are installed: `npm install`
2. Ensure you're in the correct directory
3. Try deleting `node_modules` and reinstalling

### File Associations Not Working
1. Run the installer as Administrator
2. Manually set default apps in Windows Settings
3. Check Registry entries in `HKCU\Software\Classes`

---

## 📝 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- [Electron](https://electronjs.org/) - Framework for building cross-platform desktop apps
- [jsmediatags](https://github.com/aadsm/jsmediatags) - ID3 tag parser for album artwork
- Inspired by Apple's CoverFlow interface

---

## 📧 Contact & Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/aura-music-player/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/aura-music-player/discussions)

---

<div align="center">
  <p>Made with ❤️ by the1frombeyond</p>
  <p>⭐ Star this repo if you like it!</p>
</div>

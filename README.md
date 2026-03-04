# QuickCopy 🚀

**Professional PDF Print Generator - PWA & Android App**

[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https://github.com/QuickCopy/QuickCopy)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful Progressive Web App (PWA) and Android application for generating professional PDF layouts for ID cards, vaccine cards, and documents optimized for duplex printing.

---

## ✨ Features

### 🎯 Core Functionality
- **ID Card Duplex Printing** - Generate 10 ID copies (5 front/back pairs) on two A4 pages
- **Vaccine Card Layout** - Create 2 vaccine card copies with correct placement
- **ID Photo Generator** - Create passport-style photos with background removal
- **10 Pairs Mode** - Generate 10 pairs of ID copies from single images
- **Late Birth Documents** - Specialized document layout tool

### 🌟 Technical Features
- ✅ **Progressive Web App (PWA)** - Install on any device
- ✅ **Android App Ready** - Built with Capacitor
- ✅ **Works Offline** - Service worker enabled
- ✅ **Auto-Updates** - Always fresh, no manual updates
- ✅ **Cross-Platform** - Works on Android, iOS, Windows, Mac
- ✅ **No Server Required** - Client-side PDF generation
- ✅ **Privacy First** - All processing happens locally

---

## 📱 Screenshots

<div align="center">
  <img src="public/screenshot-desktop.png" alt="Desktop View" width="45%">
  <img src="public/screenshot-mobile.png" alt="Mobile View" width="45%">
</div>

---

## 🚀 Quick Start

### Use the Live App

Visit **[your-app-url.vercel.app](https://your-app-url.vercel.app)** to use the app instantly!

Or install as PWA:
1. Visit the app in Chrome/Edge
2. Click the install icon in address bar
3. App installs like native software

### Build Locally

```bash
# Clone the repository
git clone https://github.com/QuickCopy/QuickCopy.git
cd QuickCopy

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: Radix UI + Tailwind CSS
- **PDF Generation**: pdf-lib
- **Background Removal**: @imgly/background-removal
- **PWA**: vite-plugin-pwa + Workbox
- **Mobile**: Capacitor (Android)
- **Deployment**: Vercel

---

## 📦 Deployment Options

### Option 1: Deploy to Vercel (Recommended)

Click the "Deploy to Vercel" button above or:

1. Go to [vercel.com](https://vercel.com)
2. Import this GitHub repository
3. Click Deploy

Your app will be live in 2 minutes at `https://quickcopy-[id].vercel.app`

### Option 2: Build Android APK

```bash
# Build web app
npm run build

# Sync to Android
npm run cap:sync

# Open in Android Studio
npm run cap:open

# Then: Build → Build APK
```

See [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 💻 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run android:build` | Build web + sync to Android |
| `npm run cap:open` | Open Android Studio |
| `npm run cap:sync` | Sync web assets to Android |

---

## 📂 Project Structure

```
QuickCopy/
├── src/
│   ├── components/      # React components
│   │   ├── ui/         # UI components
│   │   ├── id-copy-full-page.tsx
│   │   ├── id-copy-ten-pairs.tsx
│   │   └── late-birth.tsx
│   ├── pages/          # Page components
│   ├── lib/            # Utilities
│   ├── App.tsx         # Main app component
│   ├── router.tsx      # Routing configuration
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── android/            # Native Android project
├── dist/               # Production build output
└── package.json        # Dependencies
```

---

## 🎯 Use Cases

### For Users:
- **ID Card Copies** - Perfect for visa applications, official documents
- **Vaccine Cards** - Travel requirements, school enrollment
- **Passport Photos** - DIY ID photos with professional backgrounds
- **Document Duplication** - Clean, organized layouts

### For Developers:
- **PWA Example** - Learn modern PWA development
- **Client-Side PDF** - No server PDF generation
- **Capacitor Integration** - Web to mobile conversion
- **Vite + React** - Modern frontend stack

---

## 🔧 Configuration

### PWA Settings

Located in `vite.config.ts`:
- App name: QuickCopy
- Theme color: #4F46E5
- Display mode: Standalone
- Offline support: Enabled
- Auto-update: Enabled

### Android Settings

Located in `capacitor.config.ts`:
- App ID: com.quickcopy.app
- App Name: QuickCopy
- Web Directory: dist

---

## 🌟 Key Technologies

### Why PWA?
- **Instant Access** - No app store required
- **Always Updated** - Users get latest version automatically
- **Cross-Platform** - One codebase for all devices
- **Offline Capable** - Works without internet
- **Installable** - Feels like native app

### Why Capacitor?
- **Native Access** - Full device API access
- **Web Standards** - Use existing web skills
- **Single Codebase** - Share code between platforms
- **App Store Ready** - Publish to Google Play

---

## 📚 Documentation

- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete Vercel deployment guide
- **[PWA_DEPLOYMENT_GUIDE.md](./PWA_DEPLOYMENT_GUIDE.md)** - PWA setup and testing
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Android APK building
- **[README_DEPLOYMENT.md](./README_DEPLOYMENT.md)** - Deployment overview
- **[QUICK_START.md](./QUICK_START.md)** - Quick start guide

---

## 🔐 Privacy & Security

- ✅ **100% Client-Side** - No data sent to servers
- ✅ **No Tracking** - No analytics by default
- ✅ **No Account Required** - Use immediately
- ✅ **Local Processing** - Images never leave device
- ✅ **HTTPS** - Secure connection when deployed

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**QuickCopy Team**

GitHub: [@QuickCopy](https://github.com/QuickCopy)

---

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) - Next gen frontend tooling
- [React](https://react.dev/) - The library for web and native user interfaces
- [Capacitor](https://capacitorjs.com/) - Cross-platform app runtime
- [pdf-lib](https://pdf-lib.js.org/) - PDF creation and modification
- [Radix UI](https://www.radix-ui.com/) - Unstyled UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 📬 Support

If you have any questions or need help:

- 📖 Read the [documentation](./docs/)
- 🐛 Report bugs via [GitHub Issues](https://github.com/QuickCopy/QuickCopy/issues)
- 💬 Ask questions in [Discussions](https://github.com/QuickCopy/QuickCopy/discussions)

---

## 🎯 Roadmap

- [ ] iOS App Support
- [ ] More document templates
- [ ] Cloud storage integration
- [ ] Batch processing
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Custom themes

---

<div align="center">

**Made with ❤️ using React + Vite + Capacitor**

[Back to top](#quickcopy-)

</div>

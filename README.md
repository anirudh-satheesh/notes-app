# Notes App

A lightweight, fast, and feature-rich personal notes application built with vanilla JavaScript and Tailwind CSS. Works seamlessly on desktop and mobile, with full PWA support for offline access and installability.

## 🌟 Features

- **Cloud Sync** - Automatic synchronization with Puter cloud storage
- **Offline Support** - Service Worker enables full offline functionality
- **Categories** - Organize notes into custom categories
- **Search** - Fast full-text search across all notes
- **Progressive Web App (PWA)** - Install as a native app on any device
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Unsaved Changes Indicator** - Visual feedback when notes have pending changes
- **Save Status Updates** - Real-time feedback on save progress
- **Delete Confirmation** - Prevent accidental note deletion with confirmation dialog
- **Enhanced Empty States** - Helpful UI when no notes exist
- **Cross-Device Sync** - Editor syncs seamlessly between desktop and mobile views

## 📱 Progressive Web App (PWA)

This app is a fully-functional Progressive Web App. You can:

### Install as a Native App
- **Desktop**: Click the install button in your browser's address bar (Chrome, Edge, Firefox)
- **Mobile**: Tap "Add to Home Screen" or "Install App" from your browser menu
- **Works without internet** - All functionality available offline, syncs when connection returns

### Browser Support
- Chrome/Chromium (fully supported)
- Firefox (fully supported)
- Safari (limited PWA support)
- Edge (fully supported)

## 🚀 Quick Start

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/your-username/notes-app.git

# Navigate to the project directory
cd notes-app

# Start a local server (Python 3)
python3 -m http.server 8000

# Open in browser
# Visit: http://localhost:8000
```

### Using without cloning
Simply visit the deployed app directly in your browser @ <strive-notes.vercel.app>

## 🛠️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Tailwind CSS v4 (via CDN)
- **Storage**: Puter KV Storage (cloud) + Service Worker (offline)
- **PWA**: Service Worker for offline support and installability

## 📁 Project Structure

```
notes-app/
├── index.html              # Main HTML file with PWA metadata
├── manifest.json           # PWA manifest configuration
├── service-worker.js       # Offline support and caching
├── README.md               # This file
├── js/
│   ├── app.js              # Application entry point
│   ├── ui.js               # UI logic and rendering
│   ├── state.js            # Application state management
│   ├── storage.js          # Data persistence (Puter + Local)
│   ├── categories.js       # Category management and filtering
│   ├── puter.js            # Puter authentication
│   ├── utils.js            # Utility functions
│   └── toast.js            # Notification system
└── assets/
    └── icons/              # App icons (192x512px for PWA)
```

## 🔧 Installation & Development

### Prerequisites
- A modern web browser (Chrome, Firefox, Edge)
- Python 3 or any local web server
- Git (for cloning)

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/notes-app.git
   cd notes-app
   ```

2. **Start a local development server**
   ```bash
   python3 -m http.server 8000
   ```
   Or using other servers:
   ```bash
   # Node.js (http-server)
   npx http-server

   # Ruby
   ruby -run -ehttpd . -p8000
   ```

3. **Open in browser**
   - Navigate to `http://localhost:8000`
   - Click "Install" to add to your home screen/apps

## 💾 Data Storage

- **Primary**: Puter KV Storage (requires Puter account)
- **Fallback**: Browser Local Storage
- **Offline**: Service Worker caches app shell and enables offline access
- **Auto-sync**: Changes sync automatically when connection is restored

## ⌨️ Keyboard Shortcuts
- `Ctrl+S` / `Cmd+S` - Save current note
- `Ctrl+N` / `Cmd+N` - Create new note

## 🎨 User Interface Enhancements

### Visual Feedback
- **Unsaved Indicator**: Yellow dot appears when note has unsaved changes
- **Save Status**: Shows "Saving...", "Saved", or error messages
- **Toast Notifications**: Success and error messages appear as non-intrusive toasts

### Safety Features
- **Unsaved Changes Warning**: Browser prompt before leaving with unsaved work
- **Delete Confirmation**: Modal dialog requires confirmation before deleting notes
- **Back Button Warning**: Mobile back button warns about unsaved changes

### Empty States
- Context-aware empty state messages
- Visual icons (📝 for empty categories, 🔍 for search results)
- Helpful suggestions for users

## 🌐 Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome  | ✅ Full | Recommended |
| Firefox | ✅ Full | Full support |
| Edge    | ✅ Full | Full support |
| Safari  | ⚠️ Partial | Limited PWA features |

## 📄 License

This project is open source. Check LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Notes

- This app requires internet connection for initial load and cloud sync
- Notes are stored in your Puter account
- All data is encrypted in transit
- Offline mode works automatically after the first load

## 🐛 Troubleshooting

**App won't load**: 
- Check internet connection
- Clear browser cache
- Try a different browser

**Notes not syncing**:
- Check Puter authentication
- Verify internet connection
- Check browser console for errors

**PWA won't install**:
- Use a supported browser (Chrome, Firefox, Edge)
- Ensure HTTPS is used (or localhost for development)
- Clear app data and try again

---

**Made with ❤️ for note-taking enthusiasts**
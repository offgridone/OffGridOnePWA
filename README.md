# OffGridOne Control - Progressive Web App

A Progressive Web App (PWA) for managing and updating OffGridOne devices, recreated from the original Flutter application with full offline capability.

## Features

### Core Functionality
- **Device Management**: Connect to and manage OffGridOne devices via HTTP API
- **Update Application**: Upload and apply device updates from ZIP files
- **Real-time Progress**: Track update progress with detailed status information
- **Network Configuration**: Configure WiFi settings on remote devices
- **Offline Support**: Full offline capability with service worker caching

### User Interface
- **Material Design 3**: Modern, clean interface matching the original Flutter app
- **Teal Theme**: Consistent branding with original app color scheme
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Tab Navigation**: Easy access to Update Device and Instructions
- **Animated Splash Screen**: Professional app launch experience
- **Progress Tracking**: Real-time visual feedback for all operations

## Installation

### Quick Start
1. Open the PWA in a modern web browser (Chrome, Edge, Safari, Firefox)
2. The browser will prompt to "Install" or "Add to Home Screen"
3. Accept the prompt to install as a standalone app
4. Launch from your device's home screen or app menu

### Manual Installation
1. Clone or download this repository
2. Serve the files using any web server:
   ```bash
   # Using Python
   python -m http.server 8000

   # Using Node.js
   npx serve

   # Using PHP
   php -S localhost:8000
   ```
3. Open `http://localhost:8000` in your browser
4. Follow the installation prompts

### Production Deployment
Deploy to any static hosting service:
- **GitHub Pages**: Push to a gh-pages branch
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your repository
- **Firebase Hosting**: Use Firebase CLI
- **Any web server**: Upload files to your hosting

## File Structure

```
OffGridOnePWA/
├── index.html              # Main application HTML
├── styles.css              # Comprehensive styling (Material Design 3)
├── app.js                  # Application logic and functionality
├── manifest.json           # PWA manifest configuration
├── service-worker.js       # Offline capability and caching
├── README.md              # This file
└── assets/
    └── images/
        ├── appicon.png           # App launcher icon (512x512)
        ├── OffGridOne-horizontal.png  # Header logo
        └── splash.png            # Splash screen image
```

## Usage Guide

### 1. Connecting to Your Device

1. Power on your OffGridOne device
2. Ensure both devices are on the same network
3. Navigate to the **Update Device** tab
4. Tap the **Refresh** button to connect
5. Connection status will turn green when successful

**Connection Requirements:**
- Device must be running the management API at `management.offgridone.net`
- Both devices must be on the same network or VPN
- Port access must not be blocked by firewall

### 2. Selecting Update Files

1. Tap the **Select Update Files** button
2. Choose one or more ZIP files from your device
3. Files will appear in the **Pending Updates** list
4. Each update shows name, version, size, and date

**Update File Format:**
- Must be a ZIP archive
- Should contain `apply_update.json` metadata file
- Metadata specifies files, commands, and configuration

### 3. Applying Updates

1. Ensure device is connected (green status)
2. Tap the **Play** button on the update you want to apply
3. Review the update details and confirmation dialog
4. Confirm to start the update process
5. Monitor progress in the progress dialog
6. Wait for completion (do not disconnect)

**Update Process:**
1. Extract ZIP archive
2. Upload files to device
3. Delete old files (if specified)
4. Execute update commands
5. Configure web server (Caddy)
6. Add dashboard entry (Homer)
7. Enable service (if specified)
8. Register application

### 4. Network Configuration

1. Tap the **Settings** icon in the Update Device tab
2. Enter WiFi SSID (network name)
3. Enter WiFi password
4. Optionally check "Do Not Broadcast SSID" for hidden networks
5. Tap **Apply Settings**
6. Reconnect to the new network after applying

**Important Notes:**
- Device will restart to apply changes
- You will lose connection temporarily
- Reconnect to the new WiFi network
- Refresh connection in the app

### 5. Instructions Reference

The **Instructions** tab provides:
- Step-by-step usage guide
- Color-coded instruction cards
- Important notes and warnings
- Troubleshooting tips
- Hyperlinks to resources

## Technical Details

### API Endpoints

All API calls are made to `http://management.offgridone.net`:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Check device connection |
| `/installed-apps` | GET | Get device information and installed apps |
| `/upload` | POST | Upload single file |
| `/upload-multiple` | POST | Upload multiple files |
| `/execute` | POST | Execute command on device |
| `/delete` | POST | Delete file from device |
| `/caddy/add` | POST | Add Caddy web server entry |
| `/homer/add` | POST | Add Homer dashboard entry |
| `/service/enable` | POST | Enable system service |
| `/installed-apps/add` | POST | Register installed application |
| `/network/configure` | POST | Configure WiFi settings |

### Storage

The PWA uses browser storage for persistence:

**LocalStorage Keys:**
- `pending_updates`: List of selected update files
- `applied_updates`: List of applied updates with metadata

**Service Worker Cache:**
- Static assets (HTML, CSS, JS)
- Images and icons
- Offline page

### ZIP File Format

Update ZIP files should contain:

```
update.zip
├── apply_update.json    # Required metadata file
├── file1.bin           # Application files
├── file2.conf
└── ...
```

**apply_update.json Structure:**
```json
{
  "name": "Application Name",
  "version": "1.0.0",
  "icon": "📦",
  "new_files": [
    { "path": "/opt/app/file1.bin", "source": "file1.bin" }
  ],
  "old_files": ["/opt/app/old_file.bin"],
  "update_commands": ["systemctl restart app"],
  "caddy_config": {
    "domain": "app.offgridone.local",
    "port": 8080
  },
  "homer_config": {
    "name": "My App",
    "subtitle": "Application",
    "tag": "app",
    "url": "http://app.offgridone.local"
  },
  "service_name": "my-app"
}
```

### Browser Compatibility

**Fully Supported:**
- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- Opera 76+

**Features Required:**
- Service Workers
- IndexedDB
- Fetch API
- File API
- LocalStorage
- ES6+ JavaScript

### Offline Capabilities

The PWA works offline for:
- Viewing previously loaded pages
- Accessing selected update files
- Viewing applied update history
- Reading instructions

**Requires Online Connection:**
- Connecting to device
- Applying updates
- Downloading new update files

## Customization

### Changing Theme Colors

Edit `styles.css` variables:

```css
:root {
  --primary-color: #00897B;  /* Change primary color */
  --success-color: #4CAF50;  /* Success/applied state */
  --warning-color: #FF9800;  /* Warnings/pending state */
  /* ... more colors ... */
}
```

### Updating API Endpoint

Edit `app.js` constant:

```javascript
const API_BASE_URL = 'http://management.offgridone.net';
```

### Customizing Service Worker

Edit `service-worker.js` to change:
- Cache name and version
- Cached assets list
- Caching strategy

## Development

### Running Locally

```bash
# Start development server
python -m http.server 8000

# Open in browser
open http://localhost:8000
```

### Testing Offline

1. Open Chrome DevTools
2. Go to Application > Service Workers
3. Check "Offline" checkbox
4. Test functionality

### Debugging

**Chrome DevTools:**
- Application tab: Check service worker, storage, manifest
- Console: View logs and errors
- Network tab: Monitor API calls
- Sources tab: Debug JavaScript

**Common Issues:**
- Service worker not updating: Clear cache and reload
- Storage quota exceeded: Clear browser data
- CORS errors: Check API server configuration
- File upload fails: Check file size limits

## Security Considerations

**HTTPS Requirement:**
- Service workers require HTTPS in production
- Exception: localhost for development
- Use a valid SSL certificate for deployment

**API Security:**
- API endpoint uses HTTP (not HTTPS)
- Only use on trusted local networks
- Do not expose to public internet
- Consider VPN for remote access

**File Uploads:**
- Validate file types and sizes
- Scan uploaded files for malware
- Limit concurrent uploads
- Implement rate limiting

## Troubleshooting

### Can't Connect to Device

**Check:**
- Both devices on same network
- Management API is running
- Firewall not blocking connection
- Correct device IP/hostname

**Try:**
- Restart device
- Restart router
- Check network settings
- Ping device to verify connectivity

### Update Fails

**Check:**
- File is valid ZIP format
- Contains apply_update.json
- File not corrupted
- Sufficient storage on device

**Try:**
- Re-download update file
- Try a different update
- Check device logs
- Verify file permissions

### PWA Won't Install

**Check:**
- Using supported browser
- HTTPS enabled (production)
- Valid manifest.json
- Service worker registered

**Try:**
- Clear browser cache
- Use incognito mode
- Check console for errors
- Try different browser

## Credits

**Original Flutter App:**
- Located at: `C:\Users\p4thkiller\Desktop\OffGridOneControl`
- Maintained design and functionality parity

**PWA Recreation:**
- Recreated with HTML, CSS, and JavaScript
- Added offline capabilities via service worker
- Maintained Material Design 3 styling
- Preserved teal color scheme and branding

**Libraries Used:**
- [JSZip](https://stuk.github.io/jszip/) - ZIP file handling
- [Material Icons](https://fonts.google.com/icons) - Icon set

## License

This PWA is a recreation of the OffGridOne Control Flutter application for the purpose of providing offline-capable web access to device management functionality.

## Support

For issues or questions:
1. Check the **Instructions** tab in the app
2. Review the **Troubleshooting** section above
3. Consult device documentation
4. Contact OffGridOne support

---

**Version:** 1.0.0
**Last Updated:** 2025
**Compatibility:** Modern browsers with PWA support

// ===== Global State =====
const state = {
  isConnected: false,
  deviceInfo: null,
  pendingUpdates: [],
  appliedUpdates: [],
  currentTab: 'update-device'
};

// ===== Constants =====
const API_BASE_URL = 'http://management.offgridone.net';
const STORAGE_KEYS = {
  PENDING_UPDATES: 'pending_updates',
  APPLIED_UPDATES: 'applied_updates'
};

// ===== Utility Functions =====
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showSnackbar(message, type = 'info') {
  // Create snackbar element
  const snackbar = document.createElement('div');
  snackbar.className = `snackbar snackbar-${type}`;
  snackbar.textContent = message;
  snackbar.style.cssText = `
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    background-color: ${type === 'error' ? '#F44336' : type === 'success' ? '#4CAF50' : '#323232'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    animation: slideUp 300ms ease-out;
    max-width: 90%;
    text-align: center;
  `;

  document.body.appendChild(snackbar);

  setTimeout(() => {
    snackbar.style.animation = 'fadeOut 300ms ease-in';
    setTimeout(() => snackbar.remove(), 300);
  }, 3000);
}

// ===== API Service =====
class APIService {
  static async connect() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`, {
        method: 'GET',
        mode: 'cors'
      });

      if (response.ok) {
        await this.getDeviceInfo();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Connection error:', error);
      return false;
    }
  }

  static async getDeviceInfo() {
    try {
      const response = await fetch(`${API_BASE_URL}/installed-apps`, {
        method: 'GET',
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        state.deviceInfo = data;
        return data;
      }
      return null;
    } catch (error) {
      console.error('Get device info error:', error);
      return null;
    }
  }

  static async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete, file.name);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload`);
      xhr.send(formData);
    });
  }

  static async uploadMultipleFiles(files, onProgress) {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload-multiple`);
      xhr.send(formData);
    });
  }

  static async executeCommand(command) {
    try {
      const response = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      return response.ok;
    } catch (error) {
      console.error('Execute command error:', error);
      return false;
    }
  }

  static async deleteFile(filePath) {
    try {
      const response = await fetch(`${API_BASE_URL}/delete`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      return response.ok;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  static async addCaddyEntry(domain, port) {
    try {
      const response = await fetch(`${API_BASE_URL}/caddy/add`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, port })
      });
      return response.ok;
    } catch (error) {
      console.error('Add Caddy entry error:', error);
      return false;
    }
  }

  static async addHomerEntry(entry) {
    try {
      const response = await fetch(`${API_BASE_URL}/homer/add`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return response.ok;
    } catch (error) {
      console.error('Add Homer entry error:', error);
      return false;
    }
  }

  static async enableService(serviceName) {
    try {
      const response = await fetch(`${API_BASE_URL}/service/enable`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service: serviceName })
      });
      return response.ok;
    } catch (error) {
      console.error('Enable service error:', error);
      return false;
    }
  }

  static async addOrUpdateInstalledApp(appData) {
    try {
      const response = await fetch(`${API_BASE_URL}/installed-apps/add`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appData)
      });
      return response.ok;
    } catch (error) {
      console.error('Add/Update installed app error:', error);
      return false;
    }
  }

  static async configureNetwork(ssid, password, hideSsid) {
    try {
      const response = await fetch(`${API_BASE_URL}/network/configure`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password, hide_ssid: hideSsid })
      });
      return response.ok;
    } catch (error) {
      console.error('Configure network error:', error);
      return false;
    }
  }
}

// ===== Storage Service =====
class StorageService {
  static savePendingUpdates(updates) {
    try {
      localStorage.setItem(STORAGE_KEYS.PENDING_UPDATES, JSON.stringify(updates));
    } catch (error) {
      console.error('Save pending updates error:', error);
    }
  }

  static loadPendingUpdates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PENDING_UPDATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Load pending updates error:', error);
      return [];
    }
  }

  static saveAppliedUpdates(updates) {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLIED_UPDATES, JSON.stringify(updates));
    } catch (error) {
      console.error('Save applied updates error:', error);
    }
  }

  static loadAppliedUpdates() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.APPLIED_UPDATES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Load applied updates error:', error);
      return [];
    }
  }

  static async extractUpdateMetadata(file) {
    try {
      // Load ZIP file using JSZip
      const zip = await JSZip.loadAsync(file);

      // Look for apply_update.json
      const metadataFile = zip.file('apply_update.json');

      if (!metadataFile) {
        console.warn('No apply_update.json found in ZIP, using defaults');
        return {
          name: file.name.replace('.zip', ''),
          version: '1.0.0',
          icon: '📦',
          fileSize: file.size,
          modifiedTime: new Date(file.lastModified).toISOString(),
          file: file,
          newFiles: [],
          oldFiles: [],
          updateCommands: []
        };
      }

      // Extract and parse metadata
      const metadataContent = await metadataFile.async('string');
      const metadata = JSON.parse(metadataContent);

      return {
        name: metadata.name || file.name.replace('.zip', ''),
        version: metadata.version || '1.0.0',
        icon: metadata.icon || '📦',
        fileSize: file.size,
        modifiedTime: new Date(file.lastModified).toISOString(),
        file: file,
        newFiles: metadata.new_files || metadata.newFiles || [],
        oldFiles: metadata.old_files || metadata.oldFiles || [],
        updateCommands: metadata.update_commands || metadata.updateCommands || [],
        caddyConfig: metadata.caddy_config || metadata.caddyConfig,
        homerConfig: metadata.homer_config || metadata.homerConfig,
        serviceName: metadata.service_name || metadata.serviceName,
        metadata: metadata
      };
    } catch (error) {
      console.error('Extract metadata error:', error);
      // Return basic info if ZIP parsing fails
      return {
        name: file.name.replace('.zip', ''),
        version: '1.0.0',
        icon: '📦',
        fileSize: file.size,
        modifiedTime: new Date(file.lastModified).toISOString(),
        file: file,
        newFiles: [],
        oldFiles: [],
        updateCommands: [],
        error: error.message
      };
    }
  }

  static markUpdateAsApplied(update) {
    const appliedUpdate = {
      ...update,
      appliedAt: new Date().toISOString(),
      isApplied: true
    };

    state.appliedUpdates.push(appliedUpdate);
    this.saveAppliedUpdates(state.appliedUpdates);

    // Remove from pending
    state.pendingUpdates = state.pendingUpdates.filter(u => u.name !== update.name);
    this.savePendingUpdates(state.pendingUpdates);
  }
}

// ===== UI Manager =====
class UIManager {
  static init() {
    this.setupSplashScreen();
    this.setupTabNavigation();
    this.setupUpdateDeviceTab();
    this.setupNetworkControl();
    this.loadStoredData();
  }

  static setupSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const appContainer = document.getElementById('app-container');

    setTimeout(() => {
      splashScreen.style.animation = 'fadeOut 500ms ease-out';
      setTimeout(() => {
        splashScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        setTimeout(() => appContainer.classList.add('show'), 10);
      }, 500);
    }, 2000);
  }

  static setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.dataset.tab;

        // Update button states
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update content visibility
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');

        state.currentTab = tabName;
      });
    });
  }

  static setupUpdateDeviceTab() {
    // Refresh connection button
    document.getElementById('refresh-connection-btn').addEventListener('click', async () => {
      await this.refreshConnection();
    });

    // Network control button
    document.getElementById('network-control-btn').addEventListener('click', () => {
      this.showNetworkControlModal();
    });

    // Select files button
    document.getElementById('select-files-btn').addEventListener('click', () => {
      document.getElementById('file-input').click();
    });

    // File input change
    document.getElementById('file-input').addEventListener('change', async (e) => {
      await this.handleFileSelection(e.target.files);
      e.target.value = ''; // Reset input
    });
  }

  static setupNetworkControl() {
    const modal = document.getElementById('network-control-modal');
    const closeButtons = modal.querySelectorAll('.close-modal-btn');
    const applyButton = document.getElementById('apply-network-btn');

    closeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    });

    modal.querySelector('.modal-overlay').addEventListener('click', () => {
      modal.classList.add('hidden');
    });

    applyButton.addEventListener('click', async () => {
      await this.applyNetworkSettings();
    });
  }

  static async loadStoredData() {
    state.pendingUpdates = StorageService.loadPendingUpdates();
    state.appliedUpdates = StorageService.loadAppliedUpdates();
    this.renderUpdates();
    await this.refreshConnection();
  }

  static async refreshConnection() {
    const statusBar = document.getElementById('connection-status');
    const statusIcon = statusBar.querySelector('.status-icon');
    const statusPrimary = statusBar.querySelector('.status-primary');
    const statusSecondary = statusBar.querySelector('.status-secondary');

    // Show connecting state
    statusIcon.textContent = 'sync';
    statusIcon.style.animation = 'spin 1s linear infinite';

    const connected = await APIService.connect();
    statusIcon.style.animation = '';

    if (connected) {
      state.isConnected = true;
      statusBar.classList.remove('disconnected');
      statusBar.classList.add('connected');
      statusIcon.textContent = 'check_circle';
      statusPrimary.textContent = 'Connected';
      statusSecondary.textContent = state.deviceInfo?.serverIdentifier || 'Device connected';
      showSnackbar('Successfully connected to device', 'success');

      // Refresh applied updates from device
      await this.syncAppliedUpdatesFromDevice();
    } else {
      state.isConnected = false;
      statusBar.classList.remove('connected');
      statusBar.classList.add('disconnected');
      statusIcon.textContent = 'warning';
      statusPrimary.textContent = 'Not Connected';
      statusSecondary.textContent = 'Tap refresh to connect';
      showSnackbar('Could not connect to device', 'error');
    }
  }

  static async syncAppliedUpdatesFromDevice() {
    if (!state.deviceInfo || !state.deviceInfo.apps) return;

    // Merge device apps with local applied updates
    const deviceApps = state.deviceInfo.apps.map(app => ({
      name: app.name,
      version: app.version,
      icon: app.icon || '📦',
      isApplied: true,
      appliedAt: app.installedAt || new Date().toISOString(),
      fileExists: false
    }));

    // Keep local applied updates that have files
    const localWithFiles = state.appliedUpdates.filter(u => u.file);

    // Merge without duplicates
    const mergedApplied = [...deviceApps];
    localWithFiles.forEach(local => {
      if (!mergedApplied.find(a => a.name === local.name)) {
        mergedApplied.push(local);
      }
    });

    state.appliedUpdates = mergedApplied;
    StorageService.saveAppliedUpdates(state.appliedUpdates);
    this.renderUpdates();
  }

  static async handleFileSelection(files) {
    if (!files || files.length === 0) return;

    const newUpdates = [];
    for (const file of files) {
      const metadata = await StorageService.extractUpdateMetadata(file);
      if (metadata) {
        newUpdates.push(metadata);
      }
    }

    state.pendingUpdates.push(...newUpdates);
    StorageService.savePendingUpdates(state.pendingUpdates);
    this.renderUpdates();
    showSnackbar(`Added ${newUpdates.length} update file(s)`, 'success');
  }

  static renderUpdates() {
    this.renderPendingUpdates();
    this.renderAppliedUpdates();
  }

  static renderPendingUpdates() {
    const container = document.getElementById('pending-updates-list');
    const countEl = document.getElementById('pending-count');
    countEl.textContent = state.pendingUpdates.length;

    if (state.pendingUpdates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">folder_open</span>
          <p>No pending updates</p>
          <p class="empty-state-hint">Select update files to get started</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.pendingUpdates.map((update, index) => `
      <div class="update-card" data-index="${index}">
        <div class="update-icon">${update.icon}</div>
        <div class="update-info">
          <div class="update-name">${update.name}</div>
          <div class="update-meta">
            <div class="update-meta-item">
              <span class="material-icons">info</span>
              <span>v${update.version}</span>
            </div>
            <div class="update-meta-item">
              <span class="material-icons">storage</span>
              <span>${formatBytes(update.fileSize)}</span>
            </div>
            <div class="update-meta-item">
              <span class="material-icons">schedule</span>
              <span>${formatDate(update.modifiedTime)}</span>
            </div>
          </div>
        </div>
        <div class="update-actions">
          <button class="update-action-btn play-btn" onclick="UIManager.showUpdateConfirmation(${index})" title="Apply Update">
            <span class="material-icons">play_arrow</span>
          </button>
          <button class="update-action-btn remove-btn" onclick="UIManager.removePendingUpdate(${index})" title="Remove">
            <span class="material-icons">remove_circle_outline</span>
          </button>
        </div>
      </div>
    `).join('');
  }

  static renderAppliedUpdates() {
    const container = document.getElementById('applied-updates-list');
    const countEl = document.getElementById('applied-count');
    countEl.textContent = state.appliedUpdates.length;

    if (state.appliedUpdates.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="material-icons">check_circle</span>
          <p>No applied updates</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.appliedUpdates.map((update, index) => `
      <div class="update-card">
        <div class="update-icon">${update.icon}</div>
        <div class="update-info">
          <div class="update-name">${update.name}</div>
          <div class="update-meta">
            <div class="update-meta-item">
              <span class="material-icons">info</span>
              <span>v${update.version}</span>
            </div>
            ${update.fileSize ? `
              <div class="update-meta-item">
                <span class="material-icons">storage</span>
                <span>${formatBytes(update.fileSize)}</span>
              </div>
            ` : ''}
            <div class="update-meta-item">
              <span class="material-icons">schedule</span>
              <span>${formatDate(update.appliedAt)}</span>
            </div>
          </div>
          <div style="margin-top: 8px;">
            <span class="status-badge applied">
              <span class="material-icons" style="font-size: 14px;">check_circle</span>
              Applied
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  static removePendingUpdate(index) {
    const update = state.pendingUpdates[index];

    this.showConfirmDialog(
      'Remove Update',
      `Are you sure you want to remove "${update.name}" from the pending list?`,
      () => {
        state.pendingUpdates.splice(index, 1);
        StorageService.savePendingUpdates(state.pendingUpdates);
        this.renderUpdates();
        showSnackbar('Update removed', 'info');
      }
    );
  }

  static showUpdateConfirmation(index) {
    const update = state.pendingUpdates[index];

    if (!state.isConnected) {
      this.showInfoDialog(
        'Connection Required',
        `You must be connected to a device to apply updates. Would you like to try connecting now?`,
        [
          {
            text: 'Cancel',
            action: () => {}
          },
          {
            text: 'Connect',
            primary: true,
            action: async () => {
              await this.refreshConnection();
            }
          }
        ]
      );
      return;
    }

    const confirmHtml = `
      <div class="info-box" style="background-color: var(--info-bg); border-color: var(--info-border); margin-bottom: 16px;">
        <div class="info-box-header">
          <span class="material-icons">info</span>
          <h3>Update Details</h3>
        </div>
        <div style="margin-top: 12px;">
          <p><strong>Name:</strong> ${update.name}</p>
          <p><strong>Version:</strong> ${update.version}</p>
          <p><strong>Size:</strong> ${formatBytes(update.fileSize)}</p>
        </div>
      </div>
      <p>This will upload and install the update on your device. The process may take several minutes.</p>
      <div class="info-box" style="background-color: var(--warning-bg); border-color: var(--warning-border); margin-top: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="material-icons" style="color: var(--warning-color);">warning</span>
          <p style="margin: 0;"><strong>Do not disconnect during the update process</strong></p>
        </div>
      </div>
    `;

    this.showConfirmDialog(
      'Confirm Update',
      confirmHtml,
      async () => {
        await this.applyUpdate(index);
      },
      true
    );
  }

  static async applyUpdate(index) {
    const update = state.pendingUpdates[index];

    try {
      // Show progress modal
      this.showProgressModal('Applying Update', 0, 'Preparing...');

      // Step 1: Extract ZIP file
      this.updateProgress(5, 'Extracting files...');
      const zip = await JSZip.loadAsync(update.file);

      // Get all files to upload (excluding metadata)
      const filesToUpload = [];
      const fileNames = Object.keys(zip.files).filter(name => {
        return !zip.files[name].dir && name !== 'apply_update.json';
      });

      this.updateProgress(10, `Found ${fileNames.length} files to upload`);

      // Extract files as Blobs
      for (let i = 0; i < fileNames.length; i++) {
        const fileName = fileNames[i];
        const fileData = await zip.files[fileName].async('blob');
        const file = new File([fileData], fileName, { type: 'application/octet-stream' });
        filesToUpload.push(file);

        const extractProgress = 10 + (i / fileNames.length) * 20;
        this.updateProgress(extractProgress, `Extracting ${fileName}...`);
      }

      // Step 2: Upload files to device
      if (filesToUpload.length > 0) {
        this.updateProgress(30, 'Uploading files to device...');

        await APIService.uploadMultipleFiles(filesToUpload, (progress) => {
          const uploadProgress = 30 + (progress * 0.4);
          this.updateProgress(uploadProgress, `Uploading... ${Math.round(progress)}%`);
        });
      }

      this.updateProgress(70, 'Files uploaded successfully');

      // Step 3: Delete old files if specified
      if (update.oldFiles && update.oldFiles.length > 0) {
        this.updateProgress(75, 'Removing old files...');
        for (const oldFile of update.oldFiles) {
          await APIService.deleteFile(oldFile);
        }
      }

      // Step 4: Execute update commands if specified
      if (update.updateCommands && update.updateCommands.length > 0) {
        this.updateProgress(80, 'Executing update commands...');
        for (const command of update.updateCommands) {
          await APIService.executeCommand(command);
        }
      }

      // Step 5: Configure Caddy if specified
      if (update.caddyConfig) {
        this.updateProgress(85, 'Configuring web server...');
        await APIService.addCaddyEntry(
          update.caddyConfig.domain || update.name,
          update.caddyConfig.port || 8080
        );
      }

      // Step 6: Add Homer dashboard entry if specified
      if (update.homerConfig) {
        this.updateProgress(88, 'Adding to dashboard...');
        await APIService.addHomerEntry(update.homerConfig);
      }

      // Step 7: Enable service if specified
      if (update.serviceName) {
        this.updateProgress(92, 'Enabling service...');
        await APIService.enableService(update.serviceName);
      }

      // Step 8: Register app in installed apps
      this.updateProgress(95, 'Registering application...');
      await APIService.addOrUpdateInstalledApp({
        name: update.name,
        version: update.version,
        icon: update.icon,
        installedAt: new Date().toISOString()
      });

      this.updateProgress(100, 'Update complete!');

      // Mark as applied
      StorageService.markUpdateAsApplied(update);
      state.pendingUpdates = StorageService.loadPendingUpdates();
      state.appliedUpdates = StorageService.loadAppliedUpdates();

      setTimeout(() => {
        this.hideProgressModal();
        this.renderUpdates();
        showSnackbar('Update applied successfully!', 'success');
      }, 500);

    } catch (error) {
      this.hideProgressModal();
      this.showErrorDialog('Update Failed', error.message || 'An error occurred while applying the update');
      console.error('Apply update error:', error);
    }
  }

  static showNetworkControlModal() {
    const modal = document.getElementById('network-control-modal');
    const ssidInput = document.getElementById('wifi-ssid');

    // Pre-populate SSID if available
    if (state.deviceInfo?.ssid) {
      ssidInput.value = state.deviceInfo.ssid;
    }

    modal.classList.remove('hidden');
  }

  static async applyNetworkSettings() {
    const ssid = document.getElementById('wifi-ssid').value.trim();
    const password = document.getElementById('wifi-password').value;
    const hideSsid = document.getElementById('broadcast-ssid').checked;

    if (!ssid) {
      showSnackbar('SSID cannot be empty', 'error');
      return;
    }

    if (!state.isConnected) {
      showSnackbar('Please connect to device first', 'error');
      return;
    }

    try {
      this.showProgressModal('Applying Network Settings', 50, 'Configuring...');

      const success = await APIService.configureNetwork(ssid, password, hideSsid);

      this.hideProgressModal();
      document.getElementById('network-control-modal').classList.add('hidden');

      if (success) {
        this.showInfoDialog(
          'Settings Applied',
          `
            <p>Network settings have been applied successfully.</p>
            <div class="info-box" style="background-color: var(--info-bg); border-color: var(--info-border); margin-top: 16px;">
              <div style="display: flex; align-items: flex-start; gap: 8px;">
                <span class="material-icons" style="color: var(--info-color);">info</span>
                <div>
                  <p style="margin: 0;"><strong>Next Steps:</strong></p>
                  <ol style="margin: 8px 0 0 0; padding-left: 20px;">
                    <li>Reconnect to the new WiFi network: <strong>${ssid}</strong></li>
                    <li>Refresh the connection in the app</li>
                    <li>If you experience problems, restart your device</li>
                  </ol>
                </div>
              </div>
            </div>
          `,
          [{ text: 'OK', primary: true, action: () => {} }]
        );
      } else {
        throw new Error('Failed to apply network settings');
      }
    } catch (error) {
      this.hideProgressModal();
      this.showErrorDialog('Network Configuration Failed', error.message);
    }
  }

  // ===== Modal Management =====
  static showConfirmDialog(title, message, onConfirm, isHtml = false) {
    const modal = document.getElementById('generic-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = title;

    if (isHtml) {
      modalBody.innerHTML = message;
    } else {
      modalBody.textContent = message;
    }

    modalFooter.innerHTML = `
      <button class="secondary-button close-modal-btn">Cancel</button>
      <button class="primary-button" id="confirm-btn">Confirm</button>
    `;

    modal.classList.remove('hidden');

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    modal.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.onclick = closeModal;
    });

    modal.querySelector('.modal-overlay').onclick = closeModal;

    document.getElementById('confirm-btn').onclick = () => {
      closeModal();
      if (onConfirm) onConfirm();
    };
  }

  static showInfoDialog(title, message, actions = []) {
    const modal = document.getElementById('generic-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');

    modalTitle.textContent = title;
    modalBody.innerHTML = message;

    if (actions.length === 0) {
      actions = [{ text: 'OK', primary: true, action: () => {} }];
    }

    modalFooter.innerHTML = actions.map((action, i) => `
      <button class="${action.primary ? 'primary-button' : 'secondary-button'}" id="action-btn-${i}">
        ${action.text}
      </button>
    `).join('');

    modal.classList.remove('hidden');

    const closeModal = () => {
      modal.classList.add('hidden');
    };

    modal.querySelectorAll('.close-modal-btn').forEach(btn => {
      btn.onclick = closeModal;
    });

    modal.querySelector('.modal-overlay').onclick = closeModal;

    actions.forEach((action, i) => {
      document.getElementById(`action-btn-${i}`).onclick = () => {
        closeModal();
        if (action.action) action.action();
      };
    });
  }

  static showErrorDialog(title, message) {
    this.showInfoDialog(
      title,
      `
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <span class="material-icons" style="color: var(--error-color); font-size: 48px;">error</span>
          <div style="flex: 1;">
            <p style="color: var(--error-color); font-weight: 600; margin-bottom: 8px;">An error occurred</p>
            <p style="color: var(--text-primary);">${message}</p>
          </div>
        </div>
      `
    );
  }

  static showProgressModal(title, progress, detail) {
    const modal = document.getElementById('progress-modal');
    const modalTitle = document.getElementById('progress-title');
    const progressFill = document.getElementById('progress-bar-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressDetail = document.getElementById('progress-detail');

    modalTitle.textContent = title;
    progressFill.style.width = `${progress}%`;
    progressPercentage.textContent = `${Math.round(progress)}%`;
    progressDetail.textContent = detail;

    modal.classList.remove('hidden');
  }

  static updateProgress(progress, detail) {
    const progressFill = document.getElementById('progress-bar-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressDetail = document.getElementById('progress-detail');

    progressFill.style.width = `${progress}%`;
    progressPercentage.textContent = `${Math.round(progress)}%`;
    progressDetail.textContent = detail;
  }

  static hideProgressModal() {
    document.getElementById('progress-modal').classList.add('hidden');
  }
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
  UIManager.init();
});

// Add fadeOut animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;
document.head.appendChild(style);

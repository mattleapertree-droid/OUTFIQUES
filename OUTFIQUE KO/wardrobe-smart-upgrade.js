<<<<<<< HEAD
/**
 * Wardrobe Smart Upgrade Module
 * Adds camera capture, smart hints, and intelligent clothing generation
 */

class WardrobeSmartUpgrade {
  constructor(app) {
    this.app = app;
    this.videoStream = null;
    this.canvas = null;
    this.video = null;
    this.cameraActive = false;
    this.init();
  }

  init() {
    this.injectCameraUI();
    this.setupEventListeners();
    this.patchGenerateMethod();
  }

  injectCameraUI() {
    const generationPanel = document.querySelector('.generation-panel');
    if (!generationPanel) return;

    // Create camera capture section
    const cameraSection = document.createElement('div');
    cameraSection.className = 'smart-camera-section';
    cameraSection.innerHTML = `
      <div class="camera-container" id="cameraContainer" style="display: none;">
        <video id="smartCameraVideo" autoplay playsinline muted style="
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          background: #000;
          margin-bottom: 10px;
        "></video>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button id="captureBtn" class="btn-primary" style="flex: 1;">📸 Capture</button>
          <button id="closeCameraBtn" class="btn-secondary" style="flex: 1;">✕ Close</button>
        </div>
      </div>

      <div class="camera-preview" id="capturePreview" style="display: none; margin-bottom: 15px;">
        <img id="capturedImage" style="
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          border: 2px solid #667eea;
          margin-bottom: 10px;
        " />
        <div style="display: flex; gap: 10px;">
          <button id="confirmCaptureBtn" class="btn-primary" style="flex: 1;">✓ Save Item</button>
          <button id="retakeCaptureBtn" class="btn-secondary" style="flex: 1;">↻ Retake</button>
        </div>
      </div>

      <button id="openCameraBtn" class="btn-primary" style="width: 100%; margin-bottom: 15px;">
        📷 Capture from Camera
      </button>
    `;

    // Insert after category selector
    const categoryGroup = generationPanel.querySelector('.form-group');
    if (categoryGroup) {
      categoryGroup.parentNode.insertBefore(cameraSection, categoryGroup.nextSibling);
    } else {
      generationPanel.insertBefore(cameraSection, generationPanel.firstChild);
    }
  }

  setupEventListeners() {
    document.getElementById('openCameraBtn')?.addEventListener('click', () => this.openCamera());
    document.getElementById('closeCameraBtn')?.addEventListener('click', () => this.closeCamera());
    document.getElementById('captureBtn')?.addEventListener('click', () => this.captureFrame());
    document.getElementById('confirmCaptureBtn')?.addEventListener('click', () => this.saveCapture());
    document.getElementById('retakeCaptureBtn')?.addEventListener('click', () => this.retakeCapture());
  }

  async openCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.video = document.getElementById('smartCameraVideo');
      this.video.srcObject = this.videoStream;
      this.cameraActive = true;

      document.getElementById('cameraContainer').style.display = 'block';
      document.getElementById('openCameraBtn').style.display = 'none';
      document.getElementById('capturePreview').style.display = 'none';

      console.log('Camera opened');
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Please allow camera permissions.');
    }
  }

  closeCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.cameraActive = false;
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('openCameraBtn').style.display = 'block';
  }

  captureFrame() {
    if (!this.video) return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);

    const imageData = this.canvas.toDataURL('image/png');
    document.getElementById('capturedImage').src = imageData;
    document.getElementById('capturePreview').style.display = 'block';
  }

  async saveCapture() {
    const imageData = document.getElementById('capturedImage').src;
    const category = document.getElementById('category')?.value || 'shirt';
    const style = document.getElementById('style')?.value || 'captured';
    const description = document.getElementById('description')?.value || `Captured ${category}`;

    try {
      const response = await this.app.apiRequest('/api/capture-smart', 'POST', {
        imageData,
        category,
        style,
        description
      });

      if (response.success) {
        alert(`✓ ${category.charAt(0).toUpperCase() + category.slice(1)} captured and saved!`);
        this.closeCamera();
        document.getElementById('capturePreview').style.display = 'none';
        document.getElementById('openCameraBtn').style.display = 'block';

        // Refresh wardrobe display
        if (this.app && this.app.loadWardrobe) {
          await this.app.loadWardrobe();
        }
      } else {
        alert('Error saving capture: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Capture save error:', error);
      alert('Failed to save captured item');
    }
  }

  retakeCapture() {
    document.getElementById('capturePreview').style.display = 'none';
    document.getElementById('cameraContainer').style.display = 'block';
  }

  patchGenerateMethod() {
    if (!this.app || !this.app.generateItem) return;

    const originalGenerate = this.app.generateItem.bind(this.app);

    this.app.generateItem = async function() {
      const category = document.getElementById('category')?.value;
      if (!category) {
        alert('Please select a category');
        return;
      }

      // Fetch hints from server
      try {
        const hintsResponse = await fetch('/api/generation-hints', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const hintsData = await hintsResponse.json();

        if (hintsData.success && hintsData.hints) {
          const hints = hintsData.hints[category];
          if (hints && hints.__all && hints.__all.length > 0) {
            // Enhance description with hints
            const originalDesc = document.getElementById('description')?.value || '';
            const styleKey = document.getElementById('style')?.value || 'default';
            const styleHints = hints[styleKey] || [];
            const allHints = hints.__all || [];

            const enhancedDesc = [
              originalDesc,
              ...styleHints.slice(0, 2),
              ...allHints.slice(0, 2)
            ].filter(Boolean).join(', ');

            document.getElementById('description').value = enhancedDesc;
            console.log('Enhanced generation prompt with wardrobe hints');
          }
        }
      } catch (error) {
        console.log('Could not fetch hints, continuing with original prompt');
      }

      // Call original generate method
      return originalGenerate();
    };
  }
}

// Initialize when app is ready
document.addEventListener('DOMContentLoaded', () => {
  const checkAppReady = setInterval(() => {
    if (window.app && !window.smartUpgradeInitialized) {
      new WardrobeSmartUpgrade(window.app);
      window.smartUpgradeInitialized = true;
      clearInterval(checkAppReady);
      console.log('✓ Smart Upgrade Module initialized');
    }
  }, 100);

  // Fallback timeout - only initialize if not already done
  setTimeout(() => {
    if (window.app && !window.smartUpgradeInitialized) {
      new WardrobeSmartUpgrade(window.app);
      window.smartUpgradeInitialized = true;
    }
  }, 3000);
});
=======
/**
 * Wardrobe Smart Upgrade Module
 * Adds camera capture, smart hints, and intelligent clothing generation
 */

class WardrobeSmartUpgrade {
  constructor(app) {
    this.app = app;
    this.videoStream = null;
    this.canvas = null;
    this.video = null;
    this.cameraActive = false;
    this.init();
  }

  init() {
    this.injectCameraUI();
    this.setupEventListeners();
    this.patchGenerateMethod();
  }

  injectCameraUI() {
    const generationPanel = document.querySelector('.generation-panel');
    if (!generationPanel) return;

    // Create camera capture section
    const cameraSection = document.createElement('div');
    cameraSection.className = 'smart-camera-section';
    cameraSection.innerHTML = `
      <div class="camera-container" id="cameraContainer" style="display: none;">
        <video id="smartCameraVideo" autoplay playsinline muted style="
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          background: #000;
          margin-bottom: 10px;
        "></video>
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button id="captureBtn" class="btn-primary" style="flex: 1;">📸 Capture</button>
          <button id="closeCameraBtn" class="btn-secondary" style="flex: 1;">✕ Close</button>
        </div>
      </div>

      <div class="camera-preview" id="capturePreview" style="display: none; margin-bottom: 15px;">
        <img id="capturedImage" style="
          width: 100%;
          max-width: 300px;
          border-radius: 8px;
          border: 2px solid #667eea;
          margin-bottom: 10px;
        " />
        <div style="display: flex; gap: 10px;">
          <button id="confirmCaptureBtn" class="btn-primary" style="flex: 1;">✓ Save Item</button>
          <button id="retakeCaptureBtn" class="btn-secondary" style="flex: 1;">↻ Retake</button>
        </div>
      </div>

      <button id="openCameraBtn" class="btn-primary" style="width: 100%; margin-bottom: 15px;">
        📷 Capture from Camera
      </button>
    `;

    // Insert after category selector
    const categoryGroup = generationPanel.querySelector('.form-group');
    if (categoryGroup) {
      categoryGroup.parentNode.insertBefore(cameraSection, categoryGroup.nextSibling);
    } else {
      generationPanel.insertBefore(cameraSection, generationPanel.firstChild);
    }
  }

  setupEventListeners() {
    document.getElementById('openCameraBtn')?.addEventListener('click', () => this.openCamera());
    document.getElementById('closeCameraBtn')?.addEventListener('click', () => this.closeCamera());
    document.getElementById('captureBtn')?.addEventListener('click', () => this.captureFrame());
    document.getElementById('confirmCaptureBtn')?.addEventListener('click', () => this.saveCapture());
    document.getElementById('retakeCaptureBtn')?.addEventListener('click', () => this.retakeCapture());
  }

  async openCamera() {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      this.video = document.getElementById('smartCameraVideo');
      this.video.srcObject = this.videoStream;
      this.cameraActive = true;

      document.getElementById('cameraContainer').style.display = 'block';
      document.getElementById('openCameraBtn').style.display = 'none';
      document.getElementById('capturePreview').style.display = 'none';

      console.log('Camera opened');
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Please allow camera permissions.');
    }
  }

  closeCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
    }
    this.cameraActive = false;
    document.getElementById('cameraContainer').style.display = 'none';
    document.getElementById('openCameraBtn').style.display = 'block';
  }

  captureFrame() {
    if (!this.video) return;

    this.canvas = document.createElement('canvas');
    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(this.video, 0, 0);

    const imageData = this.canvas.toDataURL('image/png');
    document.getElementById('capturedImage').src = imageData;
    document.getElementById('capturePreview').style.display = 'block';
  }

  async saveCapture() {
    const imageData = document.getElementById('capturedImage').src;
    const category = document.getElementById('category')?.value || 'shirt';
    const style = document.getElementById('style')?.value || 'captured';
    const description = document.getElementById('description')?.value || `Captured ${category}`;

    try {
      const response = await this.app.apiRequest('/api/capture-smart', 'POST', {
        imageData,
        category,
        style,
        description
      });

      if (response.success) {
        alert(`✓ ${category.charAt(0).toUpperCase() + category.slice(1)} captured and saved!`);
        this.closeCamera();
        document.getElementById('capturePreview').style.display = 'none';
        document.getElementById('openCameraBtn').style.display = 'block';

        // Refresh wardrobe display
        if (this.app && this.app.loadWardrobe) {
          await this.app.loadWardrobe();
        }
      } else {
        alert('Error saving capture: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Capture save error:', error);
      alert('Failed to save captured item');
    }
  }

  retakeCapture() {
    document.getElementById('capturePreview').style.display = 'none';
    document.getElementById('cameraContainer').style.display = 'block';
  }

  patchGenerateMethod() {
    if (!this.app || !this.app.generateItem) return;

    const originalGenerate = this.app.generateItem.bind(this.app);

    this.app.generateItem = async function() {
      const category = document.getElementById('category')?.value;
      if (!category) {
        alert('Please select a category');
        return;
      }

      // Fetch hints from server
      try {
        const hintsResponse = await fetch('/api/generation-hints', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const hintsData = await hintsResponse.json();

        if (hintsData.success && hintsData.hints) {
          const hints = hintsData.hints[category];
          if (hints && hints.__all && hints.__all.length > 0) {
            // Enhance description with hints
            const originalDesc = document.getElementById('description')?.value || '';
            const styleKey = document.getElementById('style')?.value || 'default';
            const styleHints = hints[styleKey] || [];
            const allHints = hints.__all || [];

            const enhancedDesc = [
              originalDesc,
              ...styleHints.slice(0, 2),
              ...allHints.slice(0, 2)
            ].filter(Boolean).join(', ');

            document.getElementById('description').value = enhancedDesc;
            console.log('Enhanced generation prompt with wardrobe hints');
          }
        }
      } catch (error) {
        console.log('Could not fetch hints, continuing with original prompt');
      }

      // Call original generate method
      return originalGenerate();
    };
  }
}

// Initialize when app is ready
document.addEventListener('DOMContentLoaded', () => {
  const checkAppReady = setInterval(() => {
    if (window.app && !window.smartUpgradeInitialized) {
      new WardrobeSmartUpgrade(window.app);
      window.smartUpgradeInitialized = true;
      clearInterval(checkAppReady);
      console.log('✓ Smart Upgrade Module initialized');
    }
  }, 100);

  // Fallback timeout - only initialize if not already done
  setTimeout(() => {
    if (window.app && !window.smartUpgradeInitialized) {
      new WardrobeSmartUpgrade(window.app);
      window.smartUpgradeInitialized = true;
    }
  }, 3000);
});
>>>>>>> 087a644171feeb1047d5803ee270c8f322f60b8a

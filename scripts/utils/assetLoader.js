/**
 * Asset Loader - Loads and manages game images
 */

export class AssetLoader {
  constructor() {
    this.assets = {};
    this.loaded = false;
    this.loadingPromises = [];
  }

  /**
   * Load a single image
   * @param {string} key - Unique identifier for the asset
   * @param {string} path - Path to the image file
   */
  loadImage(key, path) {
    const promise = new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.assets[key] = img;
        console.log(`✅ Loaded: ${key} (${path})`);
        resolve(img);
      };

      img.onerror = () => {
        console.error(`❌ Failed to load: ${key} (${path})`);
        reject(new Error(`Failed to load image: ${path}`));
      };

      img.src = path;
    });

    this.loadingPromises.push(promise);
    return promise;
  }

  /**
   * Load multiple images at once
   * @param {Object} assetMap - Object with key: path pairs
   */
  loadImages(assetMap) {
    Object.entries(assetMap).forEach(([key, path]) => {
      this.loadImage(key, path);
    });
  }

  /**
   * Wait for all assets to load
   * @returns {Promise} Resolves when all assets are loaded
   */
  async waitForAll() {
    try {
      await Promise.all(this.loadingPromises);
      this.loaded = true;
      console.log(`🎨 All ${this.loadingPromises.length} assets loaded successfully!`);
      return true;
    } catch (error) {
      console.error('Failed to load some assets:', error);
      return false;
    }
  }

  /**
   * Get a loaded asset
   * @param {string} key - Asset identifier
   * @returns {HTMLImageElement|null}
   */
  get(key) {
    return this.assets[key] || null;
  }

  /**
   * Check if asset exists
   * @param {string} key - Asset identifier
   * @returns {boolean}
   */
  has(key) {
    return key in this.assets;
  }

  /**
   * Get all loaded assets
   * @returns {Object}
   */
  getAll() {
    return this.assets;
  }

  /**
   * Create a rocket sprite programmatically
   * @returns {HTMLCanvasElement}
   */
  createRocketSprite() {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw beautiful modern rocket
    ctx.save();
    ctx.translate(100, 150);
    
    // Main body - sleek silver/white gradient
    const bodyGradient = ctx.createLinearGradient(-30, -80, 30, 80);
    bodyGradient.addColorStop(0, '#f0f0f5');
    bodyGradient.addColorStop(0.3, '#e0e5f0');
    bodyGradient.addColorStop(0.7, '#c0c8d8');
    bodyGradient.addColorStop(1, '#a0a8b8');
    
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.moveTo(0, -100);
    ctx.bezierCurveTo(25, -80, 35, -40, 35, 50);
    ctx.lineTo(35, 70);
    ctx.lineTo(-35, 70);
    ctx.lineTo(-35, 50);
    ctx.bezierCurveTo(-35, -40, -25, -80, 0, -100);
    ctx.closePath();
    ctx.fill();
    
    // Body shading for 3D effect
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(-15, -90);
    ctx.bezierCurveTo(-10, -70, -10, -30, -10, 60);
    ctx.lineTo(-20, 60);
    ctx.lineTo(-20, 50);
    ctx.bezierCurveTo(-20, -40, -18, -80, -15, -90);
    ctx.closePath();
    ctx.fill();
    
    // Cockpit window - deep blue with reflection
    const windowGradient = ctx.createRadialGradient(-5, -50, 5, 0, -45, 25);
    windowGradient.addColorStop(0, '#66aaff');
    windowGradient.addColorStop(0.5, '#4488dd');
    windowGradient.addColorStop(1, '#2266bb');
    
    ctx.fillStyle = windowGradient;
    ctx.beginPath();
    ctx.ellipse(0, -45, 22, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Window highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.ellipse(-8, -55, 10, 12, -0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Red stripe
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-35, 10, 70, 12);
    
    // Engine nozzle at bottom
    const nozzleGradient = ctx.createLinearGradient(0, 70, 0, 90);
    nozzleGradient.addColorStop(0, '#555555');
    nozzleGradient.addColorStop(1, '#222222');
    
    ctx.fillStyle = nozzleGradient;
    ctx.beginPath();
    ctx.moveTo(-30, 70);
    ctx.lineTo(-20, 90);
    ctx.lineTo(20, 90);
    ctx.lineTo(30, 70);
    ctx.closePath();
    ctx.fill();
    
    // Fins/Wings
    const finGradient = ctx.createLinearGradient(0, 40, 0, 80);
    finGradient.addColorStop(0, '#c74c44');
    finGradient.addColorStop(1, '#a73c34');
    
    ctx.fillStyle = finGradient;
    
    // Left fin
    ctx.beginPath();
    ctx.moveTo(-35, 40);
    ctx.lineTo(-70, 50);
    ctx.lineTo(-70, 75);
    ctx.lineTo(-35, 70);
    ctx.closePath();
    ctx.fill();
    
    // Right fin
    ctx.beginPath();
    ctx.moveTo(35, 40);
    ctx.lineTo(70, 50);
    ctx.lineTo(70, 75);
    ctx.lineTo(35, 70);
    ctx.closePath();
    ctx.fill();
    
    // Fin highlights
    ctx.fillStyle = 'rgba(255, 100, 100, 0.3)';
    ctx.beginPath();
    ctx.moveTo(-35, 42);
    ctx.lineTo(-65, 52);
    ctx.lineTo(-65, 60);
    ctx.lineTo(-35, 50);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(35, 42);
    ctx.lineTo(65, 52);
    ctx.lineTo(65, 60);
    ctx.lineTo(35, 50);
    ctx.closePath();
    ctx.fill();
    
    // Details - rivets/panels
    ctx.fillStyle = '#8890a0';
    for (let y = -30; y < 60; y += 20) {
      ctx.beginPath();
      ctx.arc(-25, y, 2, 0, Math.PI * 2);
      ctx.arc(25, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    
    this.assets['rocketSprite'] = canvas;
    console.log('✅ Generated beautiful rocket sprite!');
    return canvas;
  }
}

// Create singleton instance
export const assetLoader = new AssetLoader();
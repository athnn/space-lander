/**
 * Pixel Art Generator - Creates simple pixel art programmatically
 * These can be replaced with actual image files later
 */

/**
 * Create a simple pixel art lander sprite
 */
export function createLanderSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');

  // Disable image smoothing for pixel art
  ctx.imageSmoothingEnabled = false;

  // Main body (silver/gray)
  ctx.fillStyle = '#c0c0c0';
  ctx.fillRect(12, 8, 8, 12);

  // Cockpit window (blue)
  ctx.fillStyle = '#4080ff';
  ctx.fillRect(14, 10, 4, 4);

  // Engine nozzle (dark gray)
  ctx.fillStyle = '#606060';
  ctx.fillRect(14, 20, 4, 3);

  // Landing legs (left)
  ctx.fillStyle = '#808080';
  ctx.fillRect(8, 18, 4, 2);
  ctx.fillRect(8, 20, 2, 6);

  // Landing legs (right)
  ctx.fillRect(20, 18, 4, 2);
  ctx.fillRect(22, 20, 2, 6);

  // Side thrusters
  ctx.fillStyle = '#909090';
  ctx.fillRect(10, 14, 2, 2);
  ctx.fillRect(20, 14, 2, 2);

  // Highlights
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(13, 9, 1, 1);
  ctx.fillRect(15, 11, 1, 1);

  return canvas;
}

/**
 * Create explosion animation frames
 */
export function createExplosionSprites() {
  const frames = [];
  const colors = ['#ff6600', '#ffaa00', '#ffff00', '#ff3300'];

  for (let frame = 0; frame < 4; frame++) {
    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    const size = 8 + frame * 4;
    const particles = 6 + frame * 2;

    // Draw explosion particles
    for (let i = 0; i < particles; i++) {
      const angle = (Math.PI * 2 * i) / particles;
      const dist = 4 + frame * 4;
      const x = 24 + Math.cos(angle) * dist;
      const y = 24 + Math.sin(angle) * dist;
      const particleSize = 3 - frame;

      ctx.fillStyle = colors[frame % colors.length];
      ctx.fillRect(x - particleSize, y - particleSize, particleSize * 2, particleSize * 2);
    }

    // Center bright spot
    ctx.fillStyle = colors[3];
    ctx.fillRect(22, 22, 4, 4);

    frames.push(canvas);
  }

  return frames;
}

/**
 * Create a star background texture
 */
export function createStarBackground(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark space background
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#000510');
  gradient.addColorStop(1, '#000208');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add distant stars
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() > 0.7 ? 2 : 1;
    ctx.fillRect(x, y, size, size);
  }

  // Add some colored stars
  const starColors = ['#ffddaa', '#aaddff', '#ffaadd'];
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = starColors[Math.floor(Math.random() * starColors.length)];
    ctx.fillRect(x, y, 2, 2);
  }

  return canvas;
}

/**
 * Create particle sprites
 */
export function createParticleSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 8;
  canvas.height = 8;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Create a simple glowing particle
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(3, 3, 2, 2);
  ctx.fillStyle = '#ffaa00';
  ctx.fillRect(2, 2, 4, 4);
  ctx.fillStyle = '#ff6600';
  ctx.fillRect(1, 1, 6, 6);

  return canvas;
}

/**
 * Create terrain/moon surface texture
 */
export function createTerrainTexture(width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Moon surface color
  ctx.fillStyle = '#505060';
  ctx.fillRect(0, 0, width, height);

  // Add some texture/craters
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 1 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? '#404050' : '#606070';
    ctx.fillRect(x, y, size, size);
  }

  return canvas;
}

/**
 * Create dust particle sprite
 */
export function createDustSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = 6;
  canvas.height = 6;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Dusty brown particle
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(2, 2, 2, 2);
  ctx.fillStyle = '#6b5335';
  ctx.fillRect(1, 1, 4, 4);

  return canvas;
}
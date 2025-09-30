# Assets Folder

This folder is for storing pixel art and other game assets.

## Current Assets

The game currently uses **programmatically generated pixel art** created in `scripts/utils/pixelArt.js`.

## How to Add Your Own Pixel Art

### Option 1: Replace with Real Images

1. **Download pixel art** from:
   - **Kenney.nl** → https://kenney.nl/assets (Free!)
   - **OpenGameArt.org** → https://opengameart.org
   - **itch.io** → https://itch.io/game-assets/free

2. **Save images here** with these names:
   ```
   assets/lander.png       - Your spaceship sprite (32x32 or 64x64)
   assets/background.png   - Space background
   assets/explosion.png    - Explosion animation frames
   assets/particle.png     - Particle effect sprite
   assets/dust.png        - Dust particle sprite
   ```

3. **Update the code** in `scripts/main.js`:
   ```javascript
   // Replace this:
   landerSprite: createLanderSprite(),

   // With this:
   landerSprite: await loadImageFile('./assets/lander.png'),
   ```

### Option 2: Use the Asset Loader

The game has an `AssetLoader` class in `scripts/utils/assetLoader.js` ready to use:

```javascript
import { assetLoader } from './utils/assetLoader.js';

// Load your images
assetLoader.loadImages({
  'lander': './assets/lander.png',
  'background': './assets/background.png',
  'explosion': './assets/explosion.png'
});

// Wait for loading
await assetLoader.waitForAll();

// Use them
const landerSprite = assetLoader.get('lander');
```

## Recommended Sizes

- **Lander**: 32x32 or 64x64 pixels
- **Background**: Match your screen size or use tiling
- **Particles**: 8x8 or 16x16 pixels
- **Explosions**: 48x48 pixels (can be sprite sheet)

## Free Asset Recommendations

### Spaceship/Lander
- Search "pixel spaceship" on Kenney.nl
- Look for top-down or side view sprites

### Space Background
- Search "space background pixel" on OpenGameArt
- Starfield textures work great

### Effects
- Search "explosion pixel art" on itch.io
- Particle packs from Kenney.nl

## License Notes

Always check the license of any assets you download:
- **CC0 / Public Domain** - Use freely
- **CC-BY** - Give credit to the artist
- **MIT** - Include license file

Current built-in sprites are created by this game and are free to use!
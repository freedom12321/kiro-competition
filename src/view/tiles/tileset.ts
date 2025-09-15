// Minimal embedded isometric diamond textures as SVG data URIs
// floorTile: a 64x32 diamond with subtle gradient
// wallCap: a 64x16 rectangle with gradient (used for top wall caps)

export const floorTileDataURI = (() => {
  const svg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' width='64' height='32' viewBox='0 0 64 32'>
    <defs>
      <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
        <stop offset='0' stop-color='#152a4a'/>
        <stop offset='1' stop-color='#0e1c37'/>
      </linearGradient>
      <linearGradient id='h' x1='0' y1='0' x2='1' y2='0'>
        <stop offset='0' stop-color='#23406e' stop-opacity='0.35'/>
        <stop offset='1' stop-color='#0b1529' stop-opacity='0'/>
      </linearGradient>
    </defs>
    <polygon points='32,0 64,16 32,32 0,16' fill='url(#g)' stroke='#1e2c4d' stroke-width='1'/>
    <polyline points='0,16 32,0 64,16' fill='none' stroke='url(#h)' stroke-width='1'/>
    <polyline points='0,16 32,32 64,16' fill='none' stroke='#0b1529' stroke-opacity='0.25' stroke-width='1'/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
})();

export const wallCapDataURI = (() => {
  const svg = `<?xml version='1.0' encoding='UTF-8'?>
  <svg xmlns='http://www.w3.org/2000/svg' width='64' height='16' viewBox='0 0 64 16'>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1a2b50'/>
      <stop offset='1' stop-color='#142344'/>
    </linearGradient>
    <rect x='0' y='0' width='64' height='16' fill='url(#w)'/>
  </svg>`;
  return 'data:image/svg+xml;base64,' + btoa(svg);
})();

// Attempt to load external PNG tileset (e.g., Kenney) if present under ./kenney/
// Returns { floor?: Texture, wallCap?: Texture } with fallbacks to embedded SVG textures.
import { Texture } from 'pixi.js';

export async function loadExternalTileset(): Promise<{ floor: Texture; wallCap: Texture }> {
  try {
    // Prefer a config JSON if present
    const cfgMods = import.meta.glob('./kenney/*.json', { eager: true }) as Record<string, any>;
    let floorFromCfg: string | undefined;
    let wallFromCfg: string | undefined;
    for (const p in cfgMods) {
      const data = (cfgMods as any)[p].default || (cfgMods as any)[p];
      if (data?.floors?.length) floorFromCfg = data.floors[0];
      if (data?.walls?.length) wallFromCfg = data.walls[0];
    }

    const mods = import.meta.glob('./kenney/*.{png,PNG}', { eager: true }) as Record<string, any>;
    let floorUrl: string | undefined;
    let wallUrl: string | undefined;
    for (const p in mods) {
      const key = p.toLowerCase();
      const url = (mods as any)[p].default || (mods as any)[p];
      if (!floorUrl && key.includes('floor')) floorUrl = url;
      if (!wallUrl && (key.includes('wall') || key.includes('cap'))) wallUrl = url;
    }
    const floor = await Texture.fromURL(floorFromCfg || floorUrl || floorTileDataURI);
    const wallCap = await Texture.fromURL(wallFromCfg || wallUrl || wallCapDataURI);
    return { floor, wallCap };
  } catch {
    const floor = await Texture.fromURL(floorTileDataURI);
    const wallCap = await Texture.fromURL(wallCapDataURI);
    return { floor, wallCap };
  }
}

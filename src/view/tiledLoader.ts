// Very small helper to load a bundled Tiled JSON map
import example from '@/view/maps/example_map.json';

export type TiledMap = any;

export function loadExampleTiledMap(): TiledMap {
  return example as TiledMap;
}

export function extractLayer(map: TiledMap, name: string) {
  if (!map || !map.layers) return null;
  return map.layers.find((l: any) => l.name === name) || null;
}


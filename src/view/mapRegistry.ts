// Load all json maps in src/view/maps using Vite glob
// Consumers can build a picker UI from this list.
export type MapEntry = { key: string; name: string; data: any };

export function listMaps(): MapEntry[] {
  const modules = import.meta.glob('./maps/*.json', { eager: true }) as Record<string, any>;
  const out: MapEntry[] = [];
  for (const path in modules) {
    const key = path.split('/').pop() || path;
    const name = key.replace(/\.json$/, '').replace(/_/g, ' ');
    out.push({ key, name, data: (modules as any)[path].default || (modules as any)[path] });
  }
  return out;
}


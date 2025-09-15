import { Application, Container, Graphics, Text, TextStyle, Sprite, Texture, Rectangle, AnimatedSprite } from 'pixi.js';
import { WorldState, DeviceRuntime } from '@/types/core';
import { floorTileDataURI, wallCapDataURI, loadExternalTileset } from '@/view/tiles/tileset';

export class PixiScene {
  private app: Application | null = null;
  private root: Container | null = null;
  private world: Container | null = null; // pannable/zoomable container
  private roomLayers: Record<string, Container> = {};
  private deviceLayers: Record<string, Container> = {};
  private humanLayer: Container | null = null;
  private humanTarget: { x: number; y: number } | null = null;
  private humanPath: { x: number; y: number }[] = [];
  private humanPathIndex = 0;
  private hovered: string | null = null;
  private isPanning = false;
  private panStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private lastExplainHash: Record<string, string> = {};
  private lastExplainAt: Record<string, number> = {};
  private miniMap: Container | null = null;
  private renderMode: 'flat' | 'iso' = 'flat';
  private mapSource: 'procedural' | 'tiled' = 'procedural';
  private tileStyle: 'vector' | 'textured' = 'vector';
  private snapRoamToTiled = true;
  private theme: 'classic' | 'pixel' = 'classic';
  private recentEvents: any[] = [];
  private isoTile = { w: 64, h: 32 };
  private tiledMap: any = null;
  private tiledRooms: { name: string; x: number; y: number; width: number; height: number }[] = [];
  private tiledDoors: { from: string; to: string; x: number; y: number }[] = [];
  private floorTexture: Texture | null = null;
  private wallCapTexture: Texture | null = null;
  private transientLayer: Container | null = null;
  private onSelect: ((sel: { type: 'device'|'human'; id?: string }) => void) | null = null;
  private bubbleTexture: Texture | null = null;
  private humanAnim: AnimatedSprite | null = null;
  private humanBase: any | null = null;
  private humanAtlas: any | null = null;
  private gaTilesBase: any | null = null;
  private gaFloorTile: Texture | null = null;

  async init(canvas: HTMLCanvasElement, width = 800, height = 600): Promise<void> {
    this.app = new Application();
    await this.app.init({ canvas, width, height, background: '#0b1020', antialias: false, resolution: Math.min(1.5, window.devicePixelRatio || 1) });
    this.root = this.app.stage;
    this.reset();
    // Load external tileset if present; fallback to embedded
    try {
      const ext = await loadExternalTileset();
      this.floorTexture = ext.floor; this.wallCapTexture = ext.wallCap;
    } catch {
      this.floorTexture = await Texture.fromURL(floorTileDataURI);
      this.wallCapTexture = await Texture.fromURL(wallCapDataURI);
    }
    // Load bubble texture and human sprite assets
    try { this.bubbleTexture = await Texture.fromURL('/assets/bubbles/bubble_v2.png'); } catch { this.bubbleTexture = null; }
    try {
      const full = await Texture.fromURL('/assets/characters/isabella.png');
      this.humanBase = full.baseTexture;
      const res = await fetch('/assets/characters/atlas.json');
      this.humanAtlas = await res.json();
    } catch { /* optional */ }
    // Load GA tileset and derive a nice floor sub-tile (32x32 at top-left)
    try {
      const tset = await Texture.fromURL('/assets/ga/tilesets/CuteRPG_Village_C02.png');
      this.gaTilesBase = tset.baseTexture;
      // pick a 32x32 region as floor and scale to iso diamond
      const sub = new Texture({ baseTexture: this.gaTilesBase, frame: new Rectangle(0, 0, 32, 32) });
      this.gaFloorTile = sub;
    } catch { /* optional */ }

    // Setup pan/zoom
    this.root.eventMode = 'static';
    this.root.on('pointerdown', (e: any) => {
      this.isPanning = true;
      this.panStart = { x: e.global.x, y: e.global.y };
      this.worldStart = { x: this.world!.x, y: this.world!.y };
    });
    this.root.on('pointerup', () => { this.isPanning = false; });
    this.root.on('pointerupoutside', () => { this.isPanning = false; });
    this.root.on('pointermove', (e: any) => {
      if (!this.isPanning || !this.world) return;
      const dx = e.global.x - this.panStart.x;
      const dy = e.global.y - this.panStart.y;
      this.world.x = this.worldStart.x + dx;
      this.world.y = this.worldStart.y + dy;
    });

    // Mouse wheel zoom
    (canvas.parentElement || canvas).addEventListener('wheel', (ev: WheelEvent) => {
      if (!this.world) return;
      ev.preventDefault();
      const oldScale = this.world.scale.x;
      const dir = ev.deltaY > 0 ? -1 : 1;
      const next = Math.max(0.6, Math.min(2.5, oldScale + dir * 0.1));
      this.world.scale.set(next);
    }, { passive: false });

    // Resize to parent size for crispness
    const onResize = () => {
      if (!this.app) return;
      const parent = canvas.parentElement as HTMLElement;
      const w = parent?.clientWidth || width;
      const h = parent?.clientHeight || height;
      this.app.renderer.resize(w, h);
    };
    window.addEventListener('resize', onResize);
  }

  update(world: WorldState): void {
    if (!this.root || !this.app) return;
    if (!this.world) return;
    // keep a reference for resize redraws and access to recent events for bubbles
    (window as any).__aihab_lastWorld = world;
    this.recentEvents = world.eventLog.slice(-40);

    // Draw rooms either as bands (flat) or iso tiles
    const roomIds = Object.keys(world.rooms);
    const mapH = Math.max(this.app.renderer.height, 900);
    const bandH = mapH / Math.max(1, roomIds.length);
    this.ensureRoomLayers(world, roomIds, bandH);

    // Update devices
    const deviceList = Object.values(world.devices);
    this.updateDevices(deviceList);

    // Update minimap (top-right)
    this.updateMiniMap(world);

    // Update human avatar movement between rooms in a simple 2D pixel style
    this.updateHuman(world, bandH);

    // Show recent links/actions as lines and impact popups
    this.updateActionOverlays(world);
  }

  setOnSelect(handler: (sel: { type: 'device'|'human'; id?: string }) => void) {
    this.onSelect = handler;
  }

  destroy(): void {
    try {
      // Be defensive: remove children without deep destroy to avoid null derefs from Pixi internals
      if (this.root) {
        try { this.root.removeChildren(); } catch { /* noop */ }
      }
      if (this.app) {
        try { (this.app.renderer as any)?.destroy?.(); } catch { /* noop */ }
      }
    } finally {
      this.app = null;
      this.root = null;
      this.roomLayers = {};
      this.deviceLayers = {};
    }
  }

  private ensureRoomLayers(world: WorldState, roomIds: string[], bandH: number) {
    if (!this.root || !this.app || !this.world) return;
    const width = Math.max(this.app.renderer.width, 1200);
    // Harm flash intensity by room from recent events
    const now = (world as any).timeSec;
    const recent = (world as any).eventLog.slice(-50).filter((e: any) => e.kind === 'human_impact' && e.data?.impact === 'harm');
    const harmIntensity: Record<string, number> = {};
    recent.forEach((e: any) => {
      const age = Math.max(0, Math.min(1, 1 - (now - e.at) / 30));
      harmIntensity[e.room] = Math.max(harmIntensity[e.room] || 0, age);
    });

    roomIds.forEach((id, idx) => {
      let layer = this.roomLayers[id];
      if (!layer) {
        layer = new Container();
        this.world!.addChild(layer);
        this.roomLayers[id] = layer;
      }
      layer.removeChildren();

      const g = new Graphics();
      const roomY = idx * bandH;
      // Slightly higher contrast for visibility
      const color = idx % 2 === 0 ? 0x112446 : 0x0d1b36;
      if (this.mapSource === 'tiled' && this.tiledMap) {
        // draw from tiled rooms object layer
        const roomsLayer = (this.tiledMap.layers || []).find((l: any) => l.name === 'rooms');
        if (roomsLayer && roomsLayer.objects) {
          roomsLayer.objects.forEach((obj: any, i: number) => {
            if (obj.type !== 'room') return;
            const roomG = new Graphics();
            roomG.rect(obj.x, obj.y + 8, obj.width, obj.height - 8).fill({ color });
            const wall = new Graphics();
            wall.rect(obj.x, obj.y, obj.width, 8).fill({ color: 0x152241 });
            wall.rect(obj.x, obj.y + 8, 8, obj.height - 8).fill({ color: 0x13203e });
            layer.addChild(roomG); layer.addChild(wall);
            const label = new Text({ text: obj.name.replace('_', ' '), style: new TextStyle({ fill: '#b7c1ff', fontSize: 14 }) });
            label.x = obj.x + 8; label.y = obj.y + 6;
            layer.addChild(label);
          });
          // also draw props
          const props = (this.tiledMap.layers || []).find((l: any) => l.name === 'props');
          if (props && props.objects) {
            props.objects.forEach((p: any) => {
              const c = this.drawPropFromTiled(p);
              c.x = p.x; c.y = p.y; c.zIndex = p.y;
              this.world!.addChild(c);
            });
          }
          return; // tiled handled
        }
      }

      if (this.renderMode === 'flat') {
        g.rect(0, roomY + 8, width, bandH - 8).fill({ color });
        if (this.theme === 'pixel') {
          // café-like plank stripes for pixel theme
          const stripes = new Graphics();
          const step = 14;
          for (let sy = roomY + 8; sy < roomY + bandH; sy += step) {
            stripes.rect(0, sy, width, 2).fill({ color: 0x0a152b, alpha: 0.35 });
          }
          layer.addChild(stripes);
        }
      } else {
        // iso floor: vector or image-based textured tiles
        const cols = Math.ceil(width / this.isoTile.w) + 2;
        const rows = Math.ceil((bandH - 8) / (this.isoTile.h / 2)) + 2;
        for (let r = 0; r < rows; r++) {
          for (let cidx = -1; cidx < cols; cidx++) {
            const cx = cidx * this.isoTile.w + (r % 2 ? this.isoTile.w / 2 : 0);
            const cy = roomY + 8 + r * (this.isoTile.h / 2);
            if (this.tileStyle === 'textured' && (this.floorTexture || this.gaFloorTile)) {
              const tex = this.gaFloorTile || this.floorTexture!;
              const sp = new Sprite(tex);
              sp.x = cx; sp.y = cy; sp.width = this.isoTile.w; sp.height = this.isoTile.h;
              layer.addChild(sp);
            } else {
              const tile = new Graphics();
              tile.poly([0, this.isoTile.h / 2, this.isoTile.w / 2, 0, this.isoTile.w, this.isoTile.h / 2, this.isoTile.w / 2, this.isoTile.h])
                .fill({ color: (r + cidx) % 2 ? 0x12203f : 0x0e1a35, alpha: 1 });
              tile.x = cx; tile.y = cy; layer.addChild(tile);
            }
          }
        }
      }

      // 2.5D wall edges (top and left)
      const wall = new Graphics();
      if (this.tileStyle === 'textured' && this.wallCapTexture) {
        // tile the wall cap using sprite strips
        for (let x = 0; x < width; x += 64) {
          const cap = new Sprite(this.wallCapTexture);
          cap.x = x; cap.y = roomY; cap.width = 64; cap.height = 8; layer.addChild(cap);
        }
      } else {
        wall.rect(0, roomY, width, 8).fill({ color: 0x152241 });
      }
      wall.rect(0, roomY + 8, 8, bandH - 8).fill({ color: 0x13203e }); // left wall

      // subtle grid for 2D-game feel
      if (this.renderMode === 'flat') {
        const grid = new Graphics();
        grid.lineStyle({ width: 1, color: 0x1f2a44, alpha: 0.5 });
        const tile = 48;
        for (let x = 0; x <= width; x += tile) {
          grid.moveTo(x, roomY).lineTo(x, roomY + bandH);
        }
        for (let y = roomY; y <= roomY + bandH; y += tile) {
          grid.moveTo(0, y).lineTo(width, y);
        }
        layer.addChild(g);
        layer.addChild(wall);
        layer.addChild(grid);
      } else {
        layer.addChild(g);
        layer.addChild(wall);
      }

      const label = new Text({
        text: id.replace('_', ' '),
        style: { fill: '#c7d2fe', fontSize: 18, fontFamily: 'sans-serif' }
      });
      label.x = 14; label.y = roomY + 8;
      layer.addChild(label);

      // Harm flash overlay
      const intensity = harmIntensity[id] || 0;
      if (intensity > 0.01) {
        const flash = new Graphics();
        flash.rect(0, roomY + 8, width, bandH - 8).fill({ color: 0xef4444, alpha: 0.12 + intensity * 0.25 });
        layer.addChild(flash);
      }
    });
  }

  private updateDevices(devices: DeviceRuntime[]) {
    if (!this.app || !this.world) return;
    const width = Math.max(this.app.renderer.width, 1200);
    const height = Math.max(this.app.renderer.height, 900);

    const seen = new Set<string>();

    devices.forEach(d => {
      seen.add(d.id);
      let c = this.deviceLayers[d.id];
      if (!c) {
        c = new Container();
        c.eventMode = 'static';
        c.cursor = 'pointer';
        this.world!.addChild(c);
        this.deviceLayers[d.id] = c;

        // Hover handlers
        c.on('pointerover', () => { this.hovered = d.id; });
        c.on('pointerout', () => { if (this.hovered === d.id) this.hovered = null; });
        c.on('pointerdown', () => { this.onSelect && this.onSelect({ type: 'device', id: d.id }); });
      }
      c.removeChildren();

      // Clamp positions into canvas
      const x = Math.max(16, Math.min(width - 16, (d.x || 100)));
      const y = Math.max(16, Math.min(height - 16, (d.y || 100)));

      // Device sprite (faux 2.5D)
      c.addChild(this.drawDeviceSprite(d));

      // status badge
      const badge = new Graphics();
      const statusColor = d.status === 'acting' ? 0x4CAF50 : d.status === 'conflict' ? 0xF44336 : d.status === 'safe' ? 0x2196F3 : 0x9E9E9E;
      badge.circle(10, -10, 4).fill(statusColor);
      c.addChild(badge);

      // Speech bubble from last plan or most recent event for this device
      let explainRaw = d.last?.explain || (d.last?.messages_to?.[0]?.content) || '';
      // Prefer a compact icon/message from recent events (device_action or device_message)
      const e = this.recentEvents.slice().reverse().find(ev => (ev.deviceId === d.id) && (ev.kind === 'device_action' || ev.kind === 'device_message' || ev.kind === 'human_impact'));
      if (e) {
        if (e.kind === 'device_message') explainRaw = `to ${e.data?.to}: ${e.data?.content || ''}`;
        else if (e.kind === 'device_action') explainRaw = e.data?.name || e.data?.action?.name || '...';
        else if (e.kind === 'human_impact') explainRaw = (e.data?.impact === 'help' ? '🙂' : e.data?.impact === 'harm' ? '⚠️' : '…') + ` ${e.data?.metric || ''}`;
      }
      const explain = explainRaw ? `${explainRaw}` : '';
      const showBubble = explain && (d.status === 'acting' || this.hovered === d.id);
      if (showBubble) {
        const hash = explain.slice(0, 64);
        if (this.lastExplainHash[d.id] !== hash) {
          this.lastExplainHash[d.id] = hash;
          this.lastExplainAt[d.id] = performance.now();
        }
        const ageMs = performance.now() - (this.lastExplainAt[d.id] || 0);
        const alpha = Math.max(0, Math.min(1, 1 - ageMs / 2400)); // fade out ~2.4s

        const bubbleText = explain.length > 100 ? explain.slice(0, 97) + '…' : explain;
        const text = new Text({ text: bubbleText, style: new TextStyle({ fill: '#e5e7eb', fontSize: 12, wordWrap: true, wordWrapWidth: 200, fontFamily: 'sans-serif' }) });
        // avoid overlap: offset by device hash
        const off = (d.id.charCodeAt(d.id.length - 1) % 3) * 12;
        text.x = 18; text.y = -42 - off;

        const pad = 8;
        const w = Math.min(280, Math.max(20, text.width + pad * 2));
        const h = text.height + pad * 2;
        if (this.theme === 'pixel' && this.bubbleTexture) {
          const sp = new Sprite(this.bubbleTexture);
          sp.x = 6; sp.y = -54 - off; sp.width = Math.max(80, w + 28); sp.height = Math.max(40, h + 18);
          sp.alpha = alpha;
          text.style.fill = '#0f172a';
          text.x = 16; text.y = -48 - off;
          text.alpha = alpha;
          c.addChild(sp); c.addChild(text);
        } else {
          const bg = new Graphics();
          // Dark bubble fallback
          bg.roundRect(14, -46 - off, w, h, 6).fill({ color: 0x111827, alpha }).stroke({ width: 1, color: 0x334155, alpha: 0.8 * alpha });
          bg.moveTo(14 + 12, -46 - off + h).lineTo(14 + 22, -46 - off + h).lineTo(14 + 18, -46 - off + h + 8).fill({ color: 0x111827, alpha });
          bg.alpha = alpha; text.alpha = alpha; c.addChild(bg); c.addChild(text);
        }
      }

      // Device label
      // initials chip above (pixel feel)
      const initials = (d.spec.name || 'D').split(/\s+/).map(s => s[0]).join('').slice(0,2).toUpperCase();
      const chip = new Graphics(); chip.roundRect(-10, -26, 20, 12, 3).fill(0x0b1020).stroke({ width: 1, color: 0x334155, alpha: 0.9 });
      const t = new Text({ text: initials, style: new TextStyle({ fill: '#cbd5e1', fontSize: 9 }) }); t.x = -8; t.y = -24;
      c.addChild(chip); c.addChild(t);
      const label = new Text({ text: d.spec.name, style: new TextStyle({ fill: '#94a3b8', fontSize: 10 }) });
      label.x = -Math.min(60, label.width / 2); label.y = 16; c.addChild(label);

      // Gentle roaming within room band
      const target = (d as any).defaults?.wanderTarget || this.pickWanderTarget(d, width, height);
      const vx = (target.x - x) * 0.05;
      const vy = (target.y - y) * 0.05;
      const nx = x + vx;
      const ny = y + vy;
      c.x = Math.round(nx);
      c.y = Math.round(ny);
      // Depth sorting: higher y on top
      (c as any).zIndex = ny;
      if (Math.hypot(target.x - nx, target.y - ny) < 8) {
        (d as any).defaults = (d as any).defaults || {};
        (d as any).defaults.wanderTarget = this.pickWanderTarget(d, width, height);
      }
    });

    // Remove stale devices (defensive against nulls)
    Object.keys(this.deviceLayers).forEach(id => {
      if (!seen.has(id)) {
        const g = this.deviceLayers[id];
        try {
          if (g?.parent) { g.parent.removeChild(g); }
          if (typeof (g as any)?.destroy === 'function') { (g as any).destroy(); }
        } catch { /* noop */ }
        delete this.deviceLayers[id];
      }
    });
  }

  private updateHuman(world: WorldState, bandH: number) {
    if (!this.app || !this.world) return;
    const width = Math.max(this.app.renderer.width, 1200);
    const height = Math.max(this.app.renderer.height, 900);

    // Determine target room based on time of day (same logic as SmartHomeBoard)
    const hour = Math.floor((world.timeSec / 60) % 24);
    const humanRoom = ((): 'living_room' | 'kitchen' | 'bedroom' => {
      if (hour >= 6 && hour < 9) return 'kitchen';
      if (hour >= 21 || hour < 6) return 'bedroom';
      return 'living_room';
    })();

    // Create human layer if not exists
    if (!this.humanLayer) {
      this.humanLayer = new Container();
      this.world.addChild(this.humanLayer);
      this.humanLayer.eventMode = 'static';
      this.humanLayer.cursor = 'pointer';
      this.humanLayer.on('pointerdown', () => { this.onSelect && this.onSelect({ type: 'human' }); });
    }
    // Clear for redraw
    this.humanLayer.removeChildren();

    // Current position (persist on container)
    const carrier = this.humanLayer as any;
    const currentX: number = typeof carrier.x === 'number' ? carrier.x : 60;
    const currentY: number = typeof carrier.y === 'number' ? carrier.y : bandH / 2;

    // Compute target center for target room
    // Determine target point based on tiled doors graph if available
    const roomIndex = ['living_room', 'kitchen', 'bedroom'].indexOf(humanRoom);
    const centerY = roomIndex >= 0 ? roomIndex * (Math.max(height, 900) / 3) + bandH / 2 : bandH / 2;
    let tx = Math.min(220, width * 0.2);
    let ty = centerY;

    if (this.mapSource === 'tiled' && this.tiledRooms.length) {
      const currentRoom = this.roomNameAtY((this.humanLayer?.y ?? centerY), bandH);
      if (currentRoom !== humanRoom && this.tiledDoors.length) {
        // Build room graph
        const graph: Record<string, { to: string; x: number; y: number }[]> = {};
        this.tiledDoors.forEach(d => {
          graph[d.from] = graph[d.from] || []; graph[d.from].push({ to: d.to, x: d.x, y: d.y });
          graph[d.to] = graph[d.to] || []; graph[d.to].push({ to: d.from, x: d.x, y: d.y });
        });
        // BFS over rooms
        const queue: string[] = [currentRoom];
        const prev: Record<string, string | null> = { [currentRoom]: null };
        while (queue.length) {
          const r = queue.shift()!;
          if (r === humanRoom) break;
          (graph[r] || []).forEach(n => {
            if (!(n.to in prev)) { prev[n.to] = r; queue.push(n.to); }
          });
        }
        if (humanRoom in prev) {
          // Reconstruct room sequence
          const seq: string[] = [];
          let cur: string | null = humanRoom;
          while (cur) { seq.push(cur); cur = prev[cur] || null; }
          seq.reverse();
          // Build path points: door points between rooms
          const points: { x: number; y: number }[] = [];
          let from = currentRoom;
          for (let i = 1; i < seq.length; i++) {
            const to = seq[i];
            const door = this.tiledDoors.find(d => (d.from === from && d.to === to) || (d.from === to && d.to === from));
            if (door) points.push({ x: door.x, y: door.y });
            from = to;
          }
          // End at target room center
          const targetRoomRect = this.tiledRooms.find(r => r.name === humanRoom);
          if (targetRoomRect) points.push({ x: targetRoomRect.x + targetRoomRect.width * 0.4, y: targetRoomRect.y + targetRoomRect.height * 0.5 });
          this.humanPath = points;
          this.humanPathIndex = 0;
        }
      }

      if (this.humanPath && this.humanPath.length) {
        const p = this.humanPath[Math.min(this.humanPathIndex, this.humanPath.length - 1)];
        tx = p.x; ty = p.y;
        const at = this.humanLayer ? Math.hypot((this.humanLayer.x || 0) - tx, (this.humanLayer.y || 0) - ty) : 0;
        if (at < 12 && this.humanPathIndex < this.humanPath.length - 1) {
          this.humanPathIndex++;
        }
      } else {
        // fallback center of room
        const targetRoomRect = this.tiledRooms.find(r => r.name === humanRoom);
        if (targetRoomRect) { tx = targetRoomRect.x + 80; ty = targetRoomRect.y + targetRoomRect.height / 2; }
      }
    }
    const nx = currentX + (tx - currentX) * 0.06;
    const ny = currentY + (ty - currentY) * 0.06;
    this.humanLayer.x = Math.round(nx);
    this.humanLayer.y = Math.round(ny);
    (this.humanLayer as any).zIndex = ny + 1;

    // Draw animated character using atlas if available; fallback to vector
    if (this.humanAtlas && this.humanBase) {
      if (!this.humanAnim) {
        // Build textures from atlas frames
        const makeTex = (f: any) => new Texture({ baseTexture: this.humanBase!, frame: new Rectangle(f.frame.x, f.frame.y, f.frame.w, f.frame.h) });
        const frames = this.humanAtlas.frames as any[];
        const up = frames.filter(f=> f.filename.startsWith('up-walk')).map(makeTex);
        const down = frames.filter(f=> f.filename.startsWith('down-walk')).map(makeTex);
        const left = frames.filter(f=> f.filename.startsWith('left-walk')).map(makeTex);
        const right = frames.filter(f=> f.filename.startsWith('right-walk')).map(makeTex);
        const anim = new AnimatedSprite(down.length ? down : frames.slice(0,1).map(makeTex));
        anim.animationSpeed = 0.15; anim.anchor.set(0.5, 0.5); this.humanAnim = anim; this.humanLayer.addChild(anim);
        (this as any).__humanAnims = { up, down, left, right };
      }
      // choose direction based on velocity
      const vx = tx - nx; const vy = ty - ny;
      const dirs = (this as any).__humanAnims;
      let seq = dirs.down;
      if (Math.abs(vx) > Math.abs(vy)) seq = vx > 0 ? dirs.right : dirs.left; else seq = vy > 0 ? dirs.down : dirs.up;
      if (seq && seq.length) { this.humanAnim!.textures = seq; if (!this.humanAnim!.playing) this.humanAnim!.play(); }
    } else {
      const body = new Graphics();
      body.ellipse(0, 12, 10, 4).fill({ color: 0x000000, alpha: 0.25 });
      body.roundRect(-4, -16, 8, 8, 2).fill(0xffe0bd);
      body.roundRect(-6, -8, 12, 12, 2).fill(0x3b82f6);
      body.rect(-6, 4, 5, 6).fill(0x1f2937); body.rect(1, 4, 5, 6).fill(0x1f2937);
      this.humanLayer.addChild(body);
    }
    const label = new Text({ text: 'Human', style: new TextStyle({ fill: '#cbd5e1', fontSize: 10 }) });
    label.x = -12; label.y = -22; this.humanLayer.addChild(label);
  }

  private roomNameAtY(y: number, bandH: number): 'living_room'|'kitchen'|'bedroom' {
    const idx = Math.floor((y - 8) / bandH);
    return (['living_room','kitchen','bedroom'][Math.max(0, Math.min(2, idx))] as any);
  }

  private pickWanderTarget(d: DeviceRuntime, width: number, height: number) {
    if (this.mapSource === 'tiled' && this.snapRoamToTiled && this.tiledRooms.length) {
      const room = this.tiledRooms.find(r => r.name === d.room) || this.tiledRooms[0];
      if (room) {
        const pad = 24;
        const x0 = room.x + pad, x1 = room.x + room.width - pad;
        const y0 = room.y + pad, y1 = room.y + room.height - pad;
        return { x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0) };
      }
    }
    const roomIndex = this.roomIndex(d);
    const bandH = Math.max(height, 900) / 3; // 3 rooms layout default
    const y0 = roomIndex * bandH + 24;
    const y1 = (roomIndex + 1) * bandH - 24;
    const x0 = 24; const x1 = width - 24;
    return { x: x0 + Math.random() * (x1 - x0), y: y0 + Math.random() * (y1 - y0) };
  }

  private roomIndex(d: DeviceRuntime): number {
    const order = ['living_room', 'kitchen', 'bedroom'];
    const idx = order.indexOf(d.room as any);
    return idx >= 0 ? idx : 0;
  }

  private drawDeviceSprite(d: DeviceRuntime): Container {
    const name = d.spec.name.toLowerCase();
    const c = new Container();
    const base = new Graphics();
    // shadow ellipse
    base.ellipse(0, 10, 16, 6).fill({ color: 0x000000, alpha: 0.25 });
    c.addChild(base);

    if (name.includes('sofa') || name.includes('chair')) {
      const body = new Graphics();
      body.roundRect(-18, -10, 36, 16, 6).fill(0x3ba36b).stroke({ width: 2, color: 0x2a6e4b, alpha: 0.8 });
      const back = new Graphics();
      back.roundRect(-18, -20, 36, 10, 6).fill(0x2e8255).stroke({ width: 2, color: 0x245f41, alpha: 0.8 });
      c.addChild(back); c.addChild(body);
    } else if (name.includes('lamp') || name.includes('light')) {
      const stand = new Graphics();
      stand.rect(-1, -14, 2, 16).fill(0x91785f);
      const head = new Graphics();
      head.roundRect(-8, -22, 16, 10, 4).fill(0xffe48a).stroke({ width: 2, color: 0xc7a747, alpha: 0.9 });
      // light cone
      const cone = new Graphics();
      cone.moveTo(0, -12).lineTo(20, 8).lineTo(-20, 8).fill({ color: 0xfff3bf, alpha: 0.08 });
      c.addChild(cone); c.addChild(stand); c.addChild(head);
    } else if (name.includes('ac') || name.includes('thermostat')) {
      const box = new Graphics();
      box.roundRect(-16, -12, 32, 20, 4).fill(0xc3d4e9).stroke({ width: 2, color: 0x7a98b8, alpha: 0.9 });
      const grill = new Graphics();
      grill.lineStyle({ width: 1, color: 0x7a98b8, alpha: 0.7 });
      for (let i = -12; i <= 6; i += 4) { grill.moveTo(-14, i).lineTo(14, i); }
      c.addChild(box); c.addChild(grill);
    } else if (name.includes('tv') || name.includes('screen')) {
      const stand = new Graphics();
      stand.rect(-3, 6, 6, 6).fill(0x4b5563);
      const base = new Graphics();
      base.roundRect(-16, 10, 32, 6, 3).fill(0x374151);
      const panel = new Graphics();
      panel.roundRect(-28, -18, 56, 28, 4).fill(0x111827).stroke({ width: 2, color: 0x1f2937 });
      const glow = new Graphics();
      glow.rect(-24, -14, 48, 20).fill({ color: 0x22d3ee, alpha: 0.05 });
      c.addChild(panel); c.addChild(glow); c.addChild(stand); c.addChild(base);
    } else if (name.includes('speaker')) {
      const box = new Graphics();
      box.roundRect(-10, -16, 20, 30, 3).fill(0x1f2937).stroke({ width: 2, color: 0x334155 });
      const woofer = new Graphics();
      woofer.circle(0, -4, 6).fill(0x0ea5e9);
      const tweeter = new Graphics();
      tweeter.circle(0, -12, 3).fill(0x93c5fd);
      c.addChild(box); c.addChild(woofer); c.addChild(tweeter);
    } else if (name.includes('plant')) {
      const pot = new Graphics();
      pot.roundRect(-6, 2, 12, 8, 2).fill(0xa16207).stroke({ width: 2, color: 0x854d0e });
      const leaf = new Graphics();
      leaf.ellipse(0, -6, 10, 12).fill(0x16a34a);
      const leaf2 = new Graphics();
      leaf2.ellipse(-6, -8, 6, 10).fill(0x22c55e);
      const leaf3 = new Graphics();
      leaf3.ellipse(6, -8, 6, 10).fill(0x22c55e);
      c.addChild(leaf); c.addChild(leaf2); c.addChild(leaf3); c.addChild(pot);
    } else if (name.includes('fridge')) {
      const body = new Graphics();
      body.roundRect(-12, -18, 24, 36, 4).fill(0xe2e8f0).stroke({ width: 2, color: 0x94a3b8 });
      const handle = new Graphics();
      handle.rect(6, -8, 2, 12).fill(0x64748b);
      c.addChild(body); c.addChild(handle);
    } else if (name.includes('coffee')) {
      const mug = new Graphics();
      mug.roundRect(-8, -6, 16, 12, 3).fill(0x6b7280).stroke({ width: 2, color: 0x4b5563 });
      const handle = new Graphics();
      handle.circle(10, 0, 4).stroke({ width: 2, color: 0x4b5563 });
      c.addChild(mug); c.addChild(handle);
    } else if (name.includes('camera') || name.includes('door')) {
      const body = new Graphics();
      body.roundRect(-14, -10, 28, 18, 4).fill(0x1f2937).stroke({ width: 2, color: 0x334155 });
      const lens = new Graphics();
      lens.circle(0, -1, 5).fill(0x38bdf8);
      c.addChild(body); c.addChild(lens);
    } else if (name.includes('blinds') || name.includes('shade')) {
      const slab = new Graphics();
      for (let y = -14; y <= 8; y += 6) {
        const bar = new Graphics(); bar.rect(-16, y, 32, 4).fill(0xd1d5db); c.addChild(bar);
      }
      c.addChild(slab);
    } else if (name.includes('sprinkler')) {
      const head = new Graphics(); head.circle(0, 0, 4).fill(0x2563eb); c.addChild(head);
      const spray = new Graphics(); spray.lineStyle({ width: 1, color: 0x93c5fd, alpha: 0.9 })
        .moveTo(0,0).lineTo(10, -6).moveTo(0,0).lineTo(12,0).moveTo(0,0).lineTo(10,6);
      c.addChild(spray);
    } else if (name.includes('washer') || name.includes('washing')) {
      const box = new Graphics(); box.roundRect(-12, -12, 24, 24, 3).fill(0xe5e7eb).stroke({ width:2, color:0x9ca3af});
      const drum = new Graphics(); drum.circle(0,0,7).fill(0x93c5fd); c.addChild(box); c.addChild(drum);
    } else if (name.includes('dryer')) {
      const box = new Graphics(); box.roundRect(-12, -12, 24, 24, 3).fill(0xfde68a).stroke({ width:2, color:0xf59e0b});
      const drum = new Graphics(); drum.circle(0,0,7).fill(0xfbbf24); c.addChild(box); c.addChild(drum);
    } else if (name.includes('mirror')) {
      const frm = new Graphics(); frm.roundRect(-10,-16,20,32,6).stroke({ width: 2, color:0x64748b});
      const gls = new Graphics(); gls.roundRect(-8,-14,16,28,4).fill(0xbfdbfe); c.addChild(frm); c.addChild(gls);
    } else if (name.includes('wardrobe') || name.includes('closet')) {
      const body = new Graphics(); body.roundRect(-14,-18,28,36,2).fill(0x92400e).stroke({ width:2, color:0x78350f});
      const door = new Graphics(); door.rect(-2,-18,2,36).fill(0x78350f); c.addChild(body); c.addChild(door);
    } else {
      const dot = new Graphics();
      dot.circle(0, 0, 12).fill(this.colorForDevice(d)).stroke({ width: 2, color: 0x0b1020, alpha: 0.8 });
      c.addChild(dot);
    }
    return c;
  }

  private updateMiniMap(world: WorldState) {
    if (!this.miniMap || !this.app) return;
    this.miniMap.removeChildren();
    const w = 180, h = 120;
    const pad = 10;
    const x = this.app.renderer.width - w - pad;
    const y = pad;
    const bg = new Graphics();
    bg.roundRect(x, y, w, h, 8).fill({ color: 0x0b1020, alpha: 0.7 }).stroke({ width: 1, color: 0x223052, alpha: 0.8 });
    this.miniMap.addChild(bg);

    const rooms = Object.keys(world.rooms);
    const bandH = (h - 20) / Math.max(1, rooms.length);
    rooms.forEach((room, idx) => {
      const ry = y + 10 + idx * bandH;
      const r = new Graphics();
      r.rect(x + 10, ry, w - 20, bandH - 6).fill({ color: 0x152241, alpha: 0.8 });
      this.miniMap!.addChild(r);
      const label = new Text({ text: room.replace('_', ' '), style: new TextStyle({ fill: '#9fb4ff', fontSize: 9 }) });
      label.x = x + 14; label.y = ry + 2; this.miniMap!.addChild(label);
    });

    const width = Math.max(this.app.renderer.width, 1200);
    const height = Math.max(this.app.renderer.height, 900);
    const scaleX = (w - 20) / width;
    const scaleY = (h - 20) / height;
    Object.values(world.devices).forEach(d => {
      const roomIdx = this.roomIndex(d);
      const ry = y + 10 + roomIdx * bandH;
      const px = x + 10 + (Math.max(16, Math.min(width - 16, d.x || 100)) * scaleX);
      const py = ry + 8 + (Math.max(16, Math.min(bandH - 24, (d.y || 100) % (height / 3))) * scaleY);
      const dot = new Graphics();
      dot.circle(px, py, 2.5).fill(0x7dd3fc);
      this.miniMap!.addChild(dot);
    });
  }

  private drawPropFromTiled(obj: any): Container {
    const container = new Container();
    const type = (obj.type || '').toLowerCase();
    if (this.gaTilesBase) {
      // pick a pseudo-random 32x32 tile based on type to add variety
      const hash = Array.from(type).reduce((a,c)=> a + c.charCodeAt(0), 0);
      const cols = Math.floor(this.gaTilesBase.width / 32) || 1;
      const rows = Math.floor(this.gaTilesBase.height / 32) || 1;
      const idx = hash % (cols * rows);
      const tx = (idx % cols) * 32;
      const ty = Math.floor(idx / cols) * 32;
      const tex = new Texture({ baseTexture: this.gaTilesBase, frame: new Rectangle(tx, ty, 32, 32) });
      const sp = new Sprite(tex);
      sp.anchor.set(0.5, 0.9);
      container.addChild(sp);
    } else {
      // fallback: reuse device sprite shapes for props
      const fakeDevice: any = { spec: { name: type }, room: 'living_room' };
      const sprite = this.drawDeviceSprite(fakeDevice);
      container.addChild(sprite);
    }
    return container;
  }

  setRenderOptions(opts: { mode?: 'flat' | 'iso'; mapSource?: 'procedural' | 'tiled'; tileStyle?: 'vector' | 'textured'; snapRoamToTiled?: boolean, theme?: 'classic' | 'pixel' }) {
    if (opts.mode) this.renderMode = opts.mode;
    if (opts.mapSource) this.mapSource = opts.mapSource;
    if (opts.tileStyle) this.tileStyle = opts.tileStyle;
    if (typeof opts.snapRoamToTiled === 'boolean') this.snapRoamToTiled = opts.snapRoamToTiled;
    if (opts.theme) this.theme = opts.theme;
  }

  setTiledMap(map: any) {
    this.tiledMap = map;
    const roomsLayer = (map?.layers || []).find((l: any) => l.name === 'rooms');
    this.tiledRooms = roomsLayer?.objects?.map((o: any) => ({ name: o.name, x: o.x, y: o.y, width: o.width, height: o.height })) || [];
    const doorsLayer = (map?.layers || []).find((l: any) => l.name === 'doors');
    this.tiledDoors = (doorsLayer?.objects || []).filter((o: any) => (o.type || '').toLowerCase() === 'door').map((o: any) => {
      const props = (o.properties || []).reduce((acc: any, p: any) => (acc[p.name] = p.value, acc), {});
      return { from: props.from || 'living_room', to: props.to || 'kitchen', x: o.x + (o.width||0)/2, y: o.y + (o.height||0)/2 };
    });
  }

  reset() {
    if (!this.root) return;
    this.root.removeChildren();
    this.world = new Container();
    this.world.sortableChildren = true;
    this.root.addChild(this.world);
    this.transientLayer = new Container();
    this.root.addChild(this.transientLayer);
    this.miniMap = new Container();
    this.root.addChild(this.miniMap);
    this.roomLayers = {};
    this.deviceLayers = {};
    if (this.world) { this.world.x = 0; this.world.y = 0; this.world.scale.set(1); }
  }

  private updateActionOverlays(world: any) {
    if (!this.world || !this.transientLayer) return;
    this.transientLayer.removeChildren();
    const now = world.timeSec;

    // Helper to get global position of a device container
    const posOf = (id: string) => {
      const c = this.deviceLayers[id];
      if (!c) return null;
      return { x: (c.parent?.x || 0) + c.x, y: (c.parent?.y || 0) + c.y };
    };

    // Get human position
    const humanPos = this.humanLayer ? { x: (this.humanLayer.parent?.x || 0) + this.humanLayer.x, y: (this.humanLayer.parent?.y || 0) + this.humanLayer.y } : null;

    // Lines from device → human for recent comms and actions
    world.eventLog.slice(-30).forEach((e: any, i: number) => {
      if (!humanPos) return;
      if (now - e.at > 25) return; // only last ~25s
      if (e.kind !== 'device_message' && e.kind !== 'device_action') return;
      const p = posOf(e.deviceId);
      if (!p) return;
      const g = new Graphics();
      const alpha = Math.max(0.2, 1 - (now - e.at) / 25);
      g.lineStyle({ width: 2, color: 0x60a5fa, alpha });
      g.moveTo(p.x, p.y).lineTo(humanPos.x, humanPos.y);
      this.transientLayer!.addChild(g);
    });

    // Impact popups near human
    const impacts = world.eventLog.slice(-20).filter((e: any) => e.kind === 'human_impact' && now - e.at <= 25);
    impacts.forEach((e: any, idx: number) => {
      if (!humanPos) return;
      const color = e.data?.impact === 'help' ? 0x22c55e : 0xef4444;
      const text = new Text({ text: `${e.data?.impact === 'help' ? '+' : '-'} ${e.data?.metric}`,
        style: new TextStyle({ fill: e.data?.impact === 'help' ? '#86efac' : '#fecaca', fontSize: 12 }) });
      const bg = new Graphics();
      const off = 18 + (idx % 3) * 14;
      const w = Math.max(40, text.width + 10);
      const h = text.height + 6;
      bg.roundRect(humanPos.x - w/2, humanPos.y - off - h, w, h, 6).fill({ color: 0x111827, alpha: 0.9 }).stroke({ width: 1, color });
      text.x = humanPos.x - w/2 + 5; text.y = humanPos.y - off - h + 3;
      this.transientLayer!.addChild(bg);
      this.transientLayer!.addChild(text);
    });
  }

  center() {
    if (!this.world) return;
    this.world.x = 0;
    this.world.y = 0;
    this.world.scale.set(1);
  }

  private colorForDevice(d: DeviceRuntime): number {
    const name = d.spec.name.toLowerCase();
    if (name.includes('ac') || name.includes('thermostat')) return 0x2196F3;
    if (name.includes('lamp') || name.includes('light')) return 0xFFEB3B;
    if (name.includes('sofa') || name.includes('chair')) return 0x8BC34A;
    return 0x9C27B0;
  }
}

export default PixiScene;

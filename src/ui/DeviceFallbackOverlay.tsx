import React, { useLayoutEffect, useRef, useState } from 'react';
import { useWorldStore } from '@/sim/worldStore';
import { getDeviceIcon } from '@/sim/deviceLoader';

function initials(name: string){
  return (name||'D').split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase();
}

export default function DeviceFallbackOverlay({ visible }: { visible: boolean }){
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const world = useWorldStore();
  useLayoutEffect(() => {
    const el = ref.current?.parentElement as HTMLElement;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth||800, h: el.clientHeight||600 });
    update();
    const ro = new ResizeObserver(update); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!visible) return null;

  const rooms = ['living_room','kitchen','bedroom'] as const;
  const bandH = size.h / rooms.length;

  const posFor = (room: string, x: number, y: number) => {
    const idx = rooms.indexOf(room as any);
    const yy = idx >=0 ? (idx*bandH + bandH/2) : (bandH/2);
    return { left: Math.max(16, Math.min(size.w-40, x||100)), top: Math.max(16, Math.min(size.h-40, yy + ((y||0)%40 - 20))) };
  };

  return (
    <div ref={ref} style={{ position:'absolute', inset:0, pointerEvents:'none', zIndex: 9 }}>
      {Object.values(world.devices).map((d:any) => {
        const p = posFor(d.room, d.x, d.y);
        return (
          <div key={d.id} style={{ position:'absolute', transform:`translate(${p.left}px, ${p.top}px)`, display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:24, height:24, borderRadius:8, background:'white', color:'#0f172a', fontSize:16, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.35)' }}>{getDeviceIcon(d)}</div>
            <div style={{ background:'rgba(15,23,42,0.85)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:6, padding:'2px 6px', fontSize:12 }}>{d.spec.name}</div>
          </div>
        );
      })}
    </div>
  );
}

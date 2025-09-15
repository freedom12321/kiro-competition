import React, { useMemo, useState } from 'react';
import './DevicePalette.css';
import { useWorldStore } from '@/sim/worldStore';
import { generateSpecFromNL } from '@/agents/specGenerator';

type Item = { label: string; icon: string; seed: string };
const items: Item[] = [
  { label:'Sofa', icon:'🛋️', seed:'a comfy smart sofa that adjusts firmness' },
  { label:'Lamp', icon:'💡', seed:'a smart lamp that adapts brightness and color' },
  { label:'AC', icon:'❄️', seed:'an AC that keeps temperature safe and comfy' },
  { label:'TV', icon:'📺', seed:'a smart tv that coordinates lighting and sound' },
  { label:'Speaker', icon:'🔊', seed:'a smart speaker with adaptive volume' },
  { label:'Plant', icon:'🪴', seed:'a plant care monitor that tracks moisture' },
  { label:'Fridge', icon:'🧊', seed:'a smart fridge monitoring door and temperature' },
  { label:'Coffee', icon:'☕', seed:'a coffee maker that brews at the right time' },
  { label:'Door Camera', icon:'📷', seed:'a door camera that alerts on visitors' },
  { label:'Blinds', icon:'🪟', seed:'smart blinds that adjust openness to light' },
  { label:'Sprinkler', icon:'🚿', seed:'a garden sprinkler coordinating with weather' },
  { label:'Washer', icon:'🌀', seed:'a washing machine that runs at smart times' },
  { label:'Dryer', icon:'🔥', seed:'a dryer coordinating with the washer' },
  { label:'Dishwasher', icon:'🍽️', seed:'a dishwasher optimizing cycles and noise' },
  { label:'Oven', icon:'🍳', seed:'a smart oven that preheats safely' },
  { label:'Thermostat', icon:'🌡️', seed:'a thermostat that sets smart temperature' },
  { label:'Vacuum', icon:'🧹', seed:'a robot vacuum that cleans quietly' }
];

export default function DevicePalette({ visible, onClose }: { visible: boolean; onClose: ()=>void }){
  const add = useWorldStore(s=> s.addDevice);
  const [selected, setSelected] = useState<Item | null>(null);
  const [room, setRoom] = useState<'living_room'|'kitchen'|'bedroom'>('living_room');
  const [desc, setDesc] = useState('');
  if (!visible) return null;

  const commit = async () => {
    const idea = desc || selected?.seed || 'a helpful smart device';
    const spec = await generateSpecFromNL(idea);
    if (selected) spec.name = selected.label;
    (spec as any).room = room;
    add({
      id: spec.id,
      spec,
      room: room as any,
      memory: { summary: 'Just created', prefs: {} },
      status: 'idle', x: Math.random()*200+50, y: Math.random()*200+50
    } as any);
    onClose(); setSelected(null); setDesc('');
  };

  return (
    <div className="palette-overlay" onClick={onClose}>
      <div className="palette-panel" onClick={e=>e.stopPropagation()}>
        <div className="palette-header">
          <h3 style={{ margin:0 }}>Add Device</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
        <div className="palette-grid">
          {items.map(it => (
            <div key={it.label} className="palette-item" onClick={()=> setSelected(it)} style={selected?.label===it.label?{ borderColor:'#60a5fa', boxShadow:'0 0 0 2px rgba(96,165,250,0.25) inset'}:undefined}>
              <div className="palette-emoji">{it.icon}</div>
              <div style={{ fontSize:12, fontWeight:700 }}>{it.label}</div>
            </div>
          ))}
        </div>
        <div className="palette-form">
          <label>Room
            <select value={room} onChange={e=> setRoom(e.target.value as any)}>
              <option value="living_room">living_room</option>
              <option value="kitchen">kitchen</option>
              <option value="bedroom">bedroom</option>
            </select>
          </label>
          <textarea placeholder="Describe what it should do (optional)" value={desc} onChange={e=> setDesc(e.target.value)} />
        </div>
        <div className="palette-footer">
          <button onClick={commit} style={{ padding:'8px 12px', borderRadius:8, border:'1px solid #e5e7eb', background:'#eef2ff' }}>Create</button>
        </div>
      </div>
    </div>
  );
}


import React, { useState } from 'react';
import { useWorldStore } from '@/sim/worldStore';
import { generateSpecFromNL } from '@/agents/specGenerator';
import './DeviceIconSidebar.css';

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

export default function DeviceIconSidebar(){
  const add = useWorldStore(s=> s.addDevice);
  const [selected, setSelected] = useState<Item | null>(null);
  const [room, setRoom] = useState<'living_room'|'kitchen'|'bedroom'>('living_room');
  const [desc, setDesc] = useState('');
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    try {
      setBusy(true);
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
      // Reset only description to let user add multiple quickly
      setDesc('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="dis-container">
      <div className="dis-header">
        <span>Add Devices</span>
        {selected && <span className="dis-selected">{selected.icon} {selected.label}</span>}
      </div>
      <div className="dis-grid">
        {items.map(it => (
          <button
            key={it.label}
            className={`dis-item ${selected?.label===it.label ? 'is-selected' : ''}`}
            onClick={()=> setSelected(it)}
            title={it.label}
          >
            <span className="dis-emoji">{it.icon}</span>
            <span className="dis-label">{it.label}</span>
          </button>
        ))}
      </div>
      <div className="dis-form">
        <label className="dis-room">Room
          <select value={room} onChange={e=> setRoom(e.target.value as any)}>
            <option value="living_room">living_room</option>
            <option value="kitchen">kitchen</option>
            <option value="bedroom">bedroom</option>
          </select>
        </label>
        <textarea
          placeholder="Describe what it should do (optional)"
          value={desc}
          onChange={e=> setDesc(e.target.value)}
        />
        <button className="dis-create" onClick={commit} disabled={busy}>
          {busy ? 'Creating…' : 'Create'}
        </button>
      </div>
    </div>
  );
}


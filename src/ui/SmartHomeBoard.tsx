import React, { useMemo } from 'react';
import { useWorldStore } from '@/sim/worldStore';
import { getLLMEnabled } from '@/agents/llmClient';
import './SmartHomeBoard.css';

type RoomKey = 'living_room'|'kitchen'|'bedroom';

const ROOM_COLORS: Record<RoomKey, string> = {
  living_room: '#4CAF50',
  kitchen: '#FF9800',
  bedroom: '#9C27B0'
};

function iconFor(name: string) {
  const s = name.toLowerCase();
  if (s.includes('sofa') || s.includes('couch')) return '🛋️';
  if (s.includes('lamp') || s.includes('light')) return '💡';
  if (s.includes('ac') || s.includes('thermo') || s.includes('air')) return '❄️';
  if (s.includes('tv') || s.includes('screen')) return '📺';
  if (s.includes('speaker')) return '🔊';
  if (s.includes('plant')) return '🪴';
  if (s.includes('fridge')) return '🧊';
  if (s.includes('coffee') || s.includes('maker')) return '☕';
  if (s.includes('camera') || s.includes('door')) return '📷';
  if (s.includes('blinds')) return '🪟';
  if (s.includes('sprinkler')) return '🚿';
  if (s.includes('washer') || s.includes('washing')) return '🌀';
  if (s.includes('dryer')) return '🔥';
  if (s.includes('mirror')) return '🪞';
  if (s.includes('wardrobe') || s.includes('closet')) return '👕';
  return '🤖';
}

const roomOrder: RoomKey[] = ['living_room', 'kitchen', 'bedroom'];

export default function SmartHomeBoard({ visible }: { visible: boolean }){
  const state = useWorldStore();
  const devices = Object.values(state.devices);
  const events = state.eventLog.slice(-40);
  const [linkMode, setLinkMode] = React.useState(false);
  const [linkSource, setLinkSource] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);

  const byRoom = useMemo(() => {
    const map: Record<RoomKey, { name: string; id: string }[]> = {
      living_room: [], kitchen: [], bedroom: []
    } as any;
    devices.forEach(d => {
      const room = (d.room as RoomKey) || 'living_room';
      map[room].push({ name: d.spec.name, id: d.id });
    });
    return map;
  }, [devices.length]);

  const connections = useMemo(() => {
    // simple within-room connections from device_message events
    const conns: { room: RoomKey; from: string; to: string }[] = [];
    events.forEach(e => {
      if (e.kind === 'device_message') {
        const from = e.deviceId || '';
        const toName = (e.data?.to || '').toLowerCase();
        const fromDev = state.devices[from];
        const toDev = Object.values(state.devices).find(d => d.spec.name.toLowerCase() === toName);
        if (fromDev && toDev && fromDev.room === toDev.room) {
          conns.push({ room: fromDev.room as RoomKey, from: fromDev.id, to: toDev.id });
        }
      }
    });
    return conns;
  }, [events.length, devices.length]);

  const moveDevice = (deviceId: string, toRoom: RoomKey) => {
    const dev = state.devices[deviceId]; if (!dev) return;
    // shallow immutable update to respect Zustand store
    useWorldStore.setState((prev) => ({
      ...prev,
      devices: {
        ...prev.devices,
        [deviceId]: { ...prev.devices[deviceId], room: toRoom }
      }
    }));
  };

  const roomHeat: Record<RoomKey, number> = useMemo(() => {
    const now = state.timeSec; const heat: any = { living_room:0, kitchen:0, bedroom:0 };
    state.eventLog.slice(-200).forEach(e => { if (e.kind==='rule_fired' && now - e.at <= 300) (heat as any)[e.room] = ((heat as any)[e.room]||0)+1; });
    return heat;
  }, [state.eventLog.length, state.timeSec]);

  const roomConflict: Record<RoomKey, boolean> = useMemo(() => {
    const now = state.timeSec; const m: any = { living_room:false, kitchen:false, bedroom:false };
    state.eventLog.slice(-60).forEach(e => { if (e.kind.includes('conflict') && now - e.at <= 60) m[e.room] = true; });
    return m;
  }, [state.eventLog.length, state.timeSec]);

  // Human room based on time of day
  const humanRoom: RoomKey = useMemo(() => {
    const hour = Math.floor((state.timeSec / 60) % 24);
    if (hour >= 6 && hour < 9) return 'kitchen';
    if (hour >= 21 || hour < 6) return 'bedroom';
    return 'living_room';
  }, [state.timeSec]);

  if (!visible) return null;

  // Build cross-room lines to human (device actions to human)
  const humanFlows = useMemo(() => {
    const now = state.timeSec;
    return state.eventLog.slice(-40).filter(e => e.kind === 'device_action' && now - e.at <= 60).map(e => e.deviceId);
  }, [state.eventLog.length, state.timeSec]);

  return (
    <div className="shb-container" id="shb-root">
      <div className="shb-header-row">
        <div className="shb-title">🏠 Smart Home Layout & Device Connections</div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=> setLinkMode(m=>!m)} style={{ padding:'6px 10px', borderRadius:8, border:'1px solid #e2e8f0', background: linkMode?'#cffafe':'white' }}>
            {linkMode ? 'Link: ON' : 'Link'}
          </button>
          <div className="shb-human-chip" title={getLLMEnabled() ? 'LLM enabled' : 'LLM disabled'}>
            <span className="name">🧑 Human</span>
            <span style={{ fontSize:10, background:getLLMEnabled()?'#dcfce7':'#fee2e2', color:getLLMEnabled()?'#166534':'#991b1b', padding:'2px 6px', borderRadius:999 }}>{getLLMEnabled() ? 'LLM ON' : 'LLM OFF'}</span>
          </div>
        </div>
      </div>
      <div className="shb-grid">
        {roomOrder.map((room) => (
          <div key={room} className={`shb-room ${roomConflict[room] ? 'conflict' : ''}`}
               onDragOver={(e)=>e.preventDefault()}
               onDrop={(e)=>{
                 const id = e.dataTransfer?.getData('text/plain');
                 if (id) moveDevice(id, room);
               }}>
            <div className="shb-room-header" style={{ background: ROOM_COLORS[room], display:'flex', justifyContent:'space-between' }}>
              <span>{room.replace('_',' ')}</span>
              <span style={{ fontSize:12, opacity:0.9 }}>🔥 {roomHeat[room]||0}</span>
            </div>
            <div className="shb-items">
              {humanRoom === room && (
                <div className="shb-item" id="shb-human-current" style={{ gridColumn:'1 / span 1' }}>
                  <div className="shb-emoji">🧑</div>
                  <div className="shb-label">Human</div>
                </div>
              )}
              {byRoom[room].map((d, idx) => (
                <div key={d.id} className={`shb-item active ${linkSource===d.id?'active-link':''}`} id={`shb-${d.id}`}
                     draggable onDragStart={(e)=> e.dataTransfer?.setData('text/plain', d.id)}
                     onMouseEnter={()=> setHovered(d.id)} onMouseLeave={()=> setHovered(m=> m===d.id? null: m)}
                     onClick={() => {
                       if (!linkMode) return;
                       if (!linkSource) { setLinkSource(d.id); return; }
                       if (linkSource === d.id) { setLinkSource(null); return; }
                       const srcDev = state.devices[linkSource];
                       const tgtDev = state.devices[d.id];
                       if (srcDev && tgtDev) {
                         useWorldStore.setState(prev => ({
                           ...prev,
                           eventLog: [...prev.eventLog, {
                             at: prev.timeSec,
                             room: srcDev.room as any,
                             deviceId: linkSource,
                             kind: 'device_message',
                             data: { from: srcDev.spec.name, to: tgtDev.spec.name, content: 'Link: simulated message' },
                             description: `${srcDev.spec.name} → ${tgtDev.spec.name}`
                           }]
                         }));
                       }
                       setLinkSource(null);
                     }}>
                  <div className="shb-emoji">{iconFor(d.name)}</div>
                  <div className="shb-label">{d.name}</div>
                  <div style={{ position:'absolute', top:6, right:6, fontSize:10, background:'#e2e8f0', borderRadius:8, padding:'2px 6px' }}>
                    {events.filter(e => (e.deviceId===d.id) || (e.kind==='device_message' && e.data?.to?.toLowerCase()===d.name.toLowerCase())).length}
                  </div>
                  {/* Tooltip with last messages/actions */}
                  {hovered===d.id && (
                    <div style={{ position:'absolute', left:'100%', top:0, marginLeft:8, zIndex:50, background:'#0f172a', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:8, maxWidth:220 }}>
                      <div style={{ fontWeight:800, fontSize:12, marginBottom:4 }}>Recent</div>
                      {(state.eventLog
                        .slice(-30)
                        .filter(e => (e.deviceId===d.id && (e.kind==='device_action' || e.kind==='device_message')) || (e.kind==='device_message' && (e.data?.to||'').toLowerCase()===d.name.toLowerCase()))
                        .slice(-5)
                        .reverse()
                      ).map((e,i)=> (
                        <div key={i} style={{ fontSize:12, opacity:0.95, marginBottom:2 }}>
                          {e.kind==='device_message' ? (
                            <span>🔗 {e.data?.from} → {e.data?.to}: {e.data?.content}</span>
                          ) : (
                            <span>⚡ {(state.devices[e.deviceId||'']?.spec.name)||'Device'}: {e.data?.action?.name || e.description || 'action'}</span>
                          )}
                        </div>
                      ))}
                      {state.eventLog.length===0 && <div style={{ fontSize:12, opacity:0.7 }}>No activity yet</div>}
                    </div>
                  )}
                </div>
              ))}
              {/* fillers to keep grid aligned */}
              {Array.from({length: Math.max(0, 9 - byRoom[room].length)}).map((_,i)=> (
                <div key={`f-${i}`} className="shb-item">
                  <div className="shb-label">*</div>
                </div>
              ))}
            </div>
            {/* Connection lines within room: naive layout connecting centers of first few items */}
            {connections.filter(c => c.room === room).map((c, i) => {
              const a = document.getElementById(`shb-${c.from}`);
              const b = document.getElementById(`shb-${c.to}`);
              if (!a || !b) return null;
              const ra = a.getBoundingClientRect();
              const rb = b.getBoundingClientRect();
              const parent = (a.closest('.shb-room') as HTMLElement).getBoundingClientRect();
              const x1 = ra.left + ra.width/2 - parent.left;
              const y1 = ra.top + ra.height/2 - parent.top;
              const x2 = rb.left + rb.width/2 - parent.left;
              const y2 = rb.top + rb.height/2 - parent.top;
              const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy);
              const angle = Math.atan2(dy, dx) * 180 / Math.PI;
              const style: React.CSSProperties = {
                width: `${len}px`,
                transform: `translate(${x1}px, ${y1}px) rotate(${angle}deg)`,
                transformOrigin: '0 50%'
              };
              return <div key={`ln-${room}-${i}`} className="shb-line dash" style={style}/>;
            })}
          </div>
        ))}
      </div>
      {/* Global lines to human (from any room) */}
      <div className="shb-lines-root">
        {humanFlows.map((devId, idx) => {
          const a = document.getElementById(`shb-${devId}`);
          const human = document.getElementById('shb-human-current');
          const root = document.getElementById('shb-root');
          if (!a || !human || !root) return null;
          const ra = a.getBoundingClientRect();
          const rb = human.getBoundingClientRect();
          const pr = root.getBoundingClientRect();
          const x1 = ra.left + ra.width/2 - pr.left;
          const y1 = ra.top + ra.height/2 - pr.top;
          const x2 = rb.left + rb.width/2 - pr.left;
          const y2 = rb.top + rb.height/2 - pr.top;
          const dx = x2 - x1; const dy = y2 - y1; const len = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx) * 180 / Math.PI;
          const style: React.CSSProperties = {
            position:'absolute', left:0, top:0,
            width: `${len}px`, height:'3px',
            transform: `translate(${x1}px, ${y1}px) rotate(${angle}deg)`,
            transformOrigin: '0 50%'
          };
          return <div key={`hf-${idx}`} className="shb-line dash" style={style}/>;
        })}
      </div>

      {/* Bottom log strip with last events */}
      <div className="shb-log">
        {state.eventLog.slice(-10).reverse().map((e,i)=> (
          <div key={`log-${i}`} className="shb-log-item">
            <span className="t">{e.at}s</span>
            <span className="kind">{e.kind.replace(/_/g,' ')}</span>
            <span>-</span>
            <span>{e.description || e.data?.explain || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

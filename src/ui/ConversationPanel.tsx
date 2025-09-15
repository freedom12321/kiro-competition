import React, { useMemo, useState } from 'react';
import { useWorldStore } from '@/sim/worldStore';

type Filter = { type: 'all' | 'human' | 'device'; id?: string };

export default function ConversationPanel({ selected }: { selected: Filter }){
  const state = useWorldStore();
  const [limit, setLimit] = useState(20);

  const items = useMemo(() => {
    const base = state.eventLog.filter(e => e.kind === 'device_message' || e.kind === 'device_action' || e.kind === 'human_impact');
    const filtered = base.filter(e => {
      if (selected.type === 'all') return true;
      if (selected.type === 'human') return e.kind === 'human_impact' || e.kind === 'device_action';
      if (selected.type === 'device') return e.deviceId === selected.id || (e.kind === 'device_message' && state.devices[e.deviceId || '']?.id === selected.id);
      return true;
    });
    return filtered.slice(-limit).reverse();
  }, [state.eventLog.length, selected, limit]);

  return (
    <div className="conv-panel">
      <div className="conv-header">
        <div className="conv-title">Dialogue</div>
        <div style={{ display:'flex', gap:6 }}>
          <button className="conv-btn" onClick={()=> setLimit(l => Math.min(100, l + 10))}>More</button>
          <button className="conv-btn" onClick={()=> setLimit(20)}>Reset</button>
        </div>
      </div>
      <div className="conv-body">
        {items.map((e,i)=> {
          const dev = state.devices[e.deviceId || ''];
          const name = dev?.spec?.name || 'Device';
          const init = (selected.type === 'human' || e.kind==='human_impact') ? 'HU' : (name.split(/\s+/).map(s=>s[0]).join('').slice(0,2).toUpperCase());
          const bubble = e.kind === 'device_message' ? `${e.data?.from || name}: ${e.data?.content || ''}`
                        : e.kind === 'human_impact' ? `${name} ${e.data?.impact === 'help' ? 'helped' : e.data?.impact === 'harm' ? 'harmed' : 'changed'} ${e.data?.metric} (${e.data?.delta?.toFixed?.(2) ?? e.data?.delta})`
                        : `${name}: ${e.data?.action?.name || e.description || 'acted'}`;
          const tone = e.kind === 'human_impact' ? (e.data?.impact === 'help' ? 'help' : e.data?.impact === 'harm' ? 'harm' : 'neutral') : 'neutral';
          return (
            <div key={i} className={`conv-row tone-${tone}`}>
              <div className="conv-chip">{init}</div>
              <div className="conv-bubble">{bubble}</div>
              <div className="conv-time">{e.at}s</div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="conv-empty">No dialogue yet. Start the simulation.</div>
        )}
      </div>
    </div>
  );
}


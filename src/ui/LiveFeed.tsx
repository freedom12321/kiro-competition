import React, { useMemo } from 'react';
import { useWorldStore } from '@/sim/worldStore';
import './LiveFeed.css';

export default function LiveFeed(){
  const state = useWorldStore();
  const items = useMemo(() => {
    return state.eventLog
      .filter(e => e.kind === 'device_message' || e.kind === 'device_action' || (e.kind === 'human_impact' && e.data?.impact !== 'neutral'))
      .slice(-16)
      .reverse();
  }, [state.eventLog.length]);

  if (items.length === 0) return null;

  return (
    <div className="livefeed">
      <div className="livefeed-title">Live Feed</div>
      <div className="livefeed-items">
        {items.map((e, i) => {
          if (e.kind === 'device_message'){
            const from = state.devices[e.deviceId || '']?.spec?.name || 'Device';
            const to = e.data?.to || 'Device';
            const content = e.data?.content || '';
            return (
              <div key={i} className="lf-row">
                <span className="lf-ico">🔗</span>
                <span className="lf-text"><b>{from}</b> → <b>{to}</b>: {content}</span>
                <span className="lf-time">{e.at}s</span>
              </div>
            );
          }
          if (e.kind === 'device_action'){
            const dev = state.devices[e.deviceId || ''];
            const name = dev?.spec?.name || 'Device';
            const act = e.data?.action || e.description || 'action';
            const human = '🧑 Human';
            return (
              <div key={i} className="lf-row">
                <span className="lf-ico">⚡</span>
                <span className="lf-text"><b>{name}</b> acted ({act}) near <b>{human}</b></span>
                <span className="lf-time">{e.at}s</span>
              </div>
            );
          }
          if (e.kind === 'human_impact'){
            const dev = state.devices[e.deviceId || ''];
            const name = dev?.spec?.name || 'Device';
            const impact = e.data?.impact === 'help' ? '💚 Help' : '💥 Harm';
            const metric = e.data?.metric || 'state';
            const delta = e.data?.delta != null ? Number(e.data.delta).toFixed(2) : '';
            return (
              <div key={i} className="lf-row">
                <span className="lf-ico">{e.data?.impact === 'help' ? '💚' : '💥'}</span>
                <span className="lf-text">{impact}: <b>{name}</b> → {metric} {delta}</span>
                <span className="lf-time">{e.at}s</span>
              </div>
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

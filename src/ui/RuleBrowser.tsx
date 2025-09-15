import React, { useMemo } from 'react';
import { useWorldStore } from '@/sim/worldStore';
import { RulePack, WorldEvent } from '@/types/core';

interface RuleBrowserProps {
  visible: boolean;
  onClose: () => void;
}

const RuleBrowser: React.FC<RuleBrowserProps> = ({ visible, onClose }) => {
  const state = useWorldStore();
  const setPackActive = useWorldStore(s => s.setRulePackActive);
  const toggleRuleActive = useWorldStore(s => s.toggleRuleActive);

  const packs = state.policies.rule_packs || [];
  const [newRuleTarget, setNewRuleTarget] = React.useState('lumens');
  const [newRuleDelta, setNewRuleDelta] = React.useState(0.2);
  const [newRulePriority, setNewRulePriority] = React.useState(0.5);

  const firingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const now = state.timeSec;
    state.eventLog
      .slice(-200)
      .filter((e: WorldEvent) => e.kind === 'rule_fired' && now - e.at <= 300)
      .forEach(e => {
        const id = e.data?.ruleId || e.data?.rule || 'unknown';
        counts[id] = (counts[id] || 0) + 1;
      });
    return counts;
  }, [state.eventLog.length, state.timeSec]);

  const roomHeat = useMemo(() => {
    const heat: Record<string, number> = {};
    const now = state.timeSec;
    state.eventLog
      .slice(-200)
      .filter((e: WorldEvent) => e.kind === 'rule_fired' && now - e.at <= 300)
      .forEach(e => {
        const room = (e.room as string) || 'unknown';
        heat[room] = (heat[room] || 0) + 1;
      });
    return heat;
  }, [state.eventLog.length, state.timeSec]);

  if (!visible) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>📜 Rule Browser</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {packs.length === 0 && (
          <div style={styles.empty}>No rule packs loaded.</div>
        )}

        {packs.map((pack: RulePack) => (
          <div key={pack.id} style={styles.pack}>
            <div style={styles.packHeader}>
              <div>
                <div style={styles.packName}>{pack.name}</div>
                <div style={styles.packMeta}>{pack.environment} • {pack.rules.length} rules</div>
              </div>
              <label style={styles.toggle}>
                <input
                  type="checkbox"
                  checked={pack.active !== false}
                  onChange={(e) => setPackActive(pack.id, e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>

            <div style={styles.rules}>
              {pack.rules.map(rule => (
                <div key={rule.id} style={styles.ruleRow}>
                  <label style={styles.ruleToggle}>
                    <input
                      type="checkbox"
                      checked={rule.active !== false}
                      onChange={() => toggleRuleActive(pack.id, rule.id)}
                    />
                    <span>{rule.id}</span>
                  </label>
                  <div style={styles.ruleMeta}>
                    <span>{rule.hard ? '🛡️ hard' : '🎚️ soft'} • w={rule.priority}</span>
                    <span> • fired: {firingCounts[rule.id] || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Quick add simple soft rule to first active pack */}
        {packs.length > 0 && (
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Quick Add Rule</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span>target</span>
              <input style={styles.input as any} value={newRuleTarget} onChange={(e) => setNewRuleTarget(e.target.value)} />
              <span>delta</span>
              <input style={styles.input as any} type="number" value={newRuleDelta} onChange={(e) => setNewRuleDelta(parseFloat(e.target.value))} />
              <span>priority</span>
              <input style={styles.input as any} type="number" value={newRulePriority} onChange={(e) => setNewRulePriority(parseFloat(e.target.value))} />
              <button style={styles.button as any} onClick={() => {
                const pack = packs.find(p => p.active !== false) || packs[0];
                const id = `rule.quick.${Date.now()}`;
                pack.rules.push({
                  id,
                  scope: 'room',
                  priority: newRulePriority,
                  hard: false,
                  then: { target: newRuleTarget, delta: newRuleDelta },
                  explain: 'User-authored quick rule',
                  active: true
                } as any);
                // Force state update
                useWorldStore.setState({ policies: { ...state.policies, rule_packs: [...packs] } });
              }}>➕ Add</button>
            </div>
          </div>
        )}

        {/* Simple room heatmap */}
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Heatmap (rule firings, last 5m)</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {Object.keys(state.rooms).map(room => {
              const count = roomHeat[room] || 0;
              const intensity = Math.min(1, count / 10);
              const bg = `rgba(59,130,246,${0.15 + intensity * 0.6})`;
              return (
                <div key={room} style={{ padding: '6px 10px', borderRadius: 8, background: bg, border: '1px solid rgba(255,255,255,0.1)' }}>
                  {room.replace('_', ' ')}: {count}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  panel: {
    width: '800px', maxHeight: '80vh', overflow: 'auto', background: '#0f172a',
    color: 'white', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    padding: 16, border: '1px solid rgba(255,255,255,0.1)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  closeBtn: { background: 'transparent', color: 'white', border: 'none', fontSize: 20, cursor: 'pointer' },
  empty: { padding: 16, opacity: 0.8 },
  pack: { border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, margin: '12px 0' },
  packHeader: { display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(255,255,255,0.05)' },
  packName: { fontWeight: 600 },
  packMeta: { opacity: 0.7, fontSize: 12 },
  toggle: { display: 'flex', alignItems: 'center', gap: 8 },
  rules: { padding: 8 },
  ruleRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  ruleToggle: { display: 'flex', alignItems: 'center', gap: 8 },
  ruleMeta: { opacity: 0.8, fontSize: 12 }
};

export default RuleBrowser;

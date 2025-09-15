import React, { useEffect, useMemo, useState } from 'react';
import { useWorldStore } from '@/sim/worldStore';

const LS_KEY = 'aihabitat_policies';

function loadPolicies() {
  try { const raw = localStorage.getItem(LS_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function savePolicies(policies: any) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(policies)); } catch { /* ignore */ }
}

interface GovernancePanelProps {
  visible: boolean;
  onClose: () => void;
}

const GovernancePanel: React.FC<GovernancePanelProps> = ({ visible, onClose }) => {
  const state = useWorldStore();
  const setState = useWorldStore.setState;
  const [localPriorities, setLocalPriorities] = useState<string[]>(state.policies.priority_order);
  const [commsPairs, setCommsPairs] = useState<[string, string][]>(state.policies.comms?.allow || []);
  const [directorOn, setDirectorOn] = useState<boolean>(!(state.policies as any).director_off);
  const [harmSensitivity, setHarmSensitivity] = useState<number>((state.policies as any).harm_sensitivity ?? 0.6);
  const [softWeights, setSoftWeights] = useState<Record<string, number>>({
    safety: 1.0,
    comfort: 0.7,
    efficiency: 0.5,
    privacy: 0.4,
    ...(state.policies.soft_weights || {})
  });

  useEffect(() => {
    if (!visible) return;
    const saved = loadPolicies();
    if (saved) {
      setLocalPriorities(saved.priority_order || state.policies.priority_order);
      setCommsPairs(saved.comms?.allow || state.policies.comms?.allow || []);
    }
  }, [visible]);

  if (!visible) return null;

  const move = (idx: number, dir: -1 | 1) => {
    const arr = [...localPriorities];
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    setLocalPriorities(arr);
  };

  const save = () => {
    const nextPolicies = {
      ...state.policies,
      priority_order: localPriorities,
      comms: { allow: commsPairs },
      director_off: !directorOn,
      soft_weights: softWeights,
      harm_sensitivity: harmSensitivity
    };
    setState({ policies: nextPolicies });
    savePolicies(nextPolicies);
    onClose();
  };

  const addPair = () => setCommsPairs(p => [...p, ['device_a', 'device_b']]);
  const updatePair = (i: number, col: 0 | 1, val: string) => {
    setCommsPairs(p => p.map((pair, idx) => idx === i ? (col === 0 ? [val, pair[1]] as [string, string] : [pair[0], val] as [string, string]) : pair));
  };
  const removePair = (i: number) => setCommsPairs(p => p.filter((_, idx) => idx !== i));

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>⚖️ Governance</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.section}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={directorOn} onChange={(e) => setDirectorOn(e.target.checked)} />
            <span>Enable Director (inject mild events when calm)</span>
          </label>
        </div>

        <div style={styles.section}>
          <h3>Harm Sensitivity</h3>
          <div style={styles.row}>
            <div style={styles.pill}>Human harm detection</div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={harmSensitivity}
              onChange={(e) => setHarmSensitivity(parseFloat(e.target.value))}
            />
            <div style={{ width: 40, textAlign: 'right', opacity: 0.85 }}>{harmSensitivity.toFixed(2)}</div>
          </div>
        </div>

        <div style={styles.section}>
          <h3>Policy Softness (weights)</h3>
          {Object.keys(softWeights).map(k => (
            <div key={k} style={styles.row}>
              <div style={styles.pill}>{k}</div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={softWeights[k]}
                onChange={(e) => setSoftWeights(sw => ({ ...sw, [k]: parseFloat(e.target.value) }))}
              />
              <div style={{ width: 40, textAlign: 'right', opacity: 0.85 }}>{softWeights[k].toFixed(2)}</div>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <h3>Priority Order (drag to reorder)</h3>
          <div>
            {localPriorities.map((p, i) => (
              <div key={p}
                   style={{ ...styles.row, cursor: 'grab' }}
                   draggable
                   onDragStart={(e) => { e.dataTransfer?.setData('text/plain', String(i)); }}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => {
                      const from = Number(e.dataTransfer?.getData('text/plain'));
                      if (isNaN(from)) return;
                      const arr = [...localPriorities];
                      const [item] = arr.splice(from, 1);
                      arr.splice(i, 0, item);
                      setLocalPriorities(arr);
                   }}>
                <div style={styles.pill}>{p}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.section}>
          <h3>Comms Matrix (allowed pairs)</h3>
          {commsPairs.map((pair, i) => (
            <div key={i} style={styles.row}>
              <input style={styles.input} value={pair[0]} onChange={(e) => updatePair(i, 0, e.target.value)} />
              <span style={{ opacity: 0.6 }}>↔</span>
              <input style={styles.input} value={pair[1]} onChange={(e) => updatePair(i, 1, e.target.value)} />
              <button style={styles.btn} onClick={() => removePair(i)}>🗑</button>
            </div>
          ))}
          <button style={styles.button} onClick={addPair}>➕ Add Pair</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button style={styles.button} onClick={save}>💾 Save</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  panel: { width: 560, background: '#0f172a', color: 'white', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  closeBtn: { background: 'transparent', color: 'white', border: 'none', fontSize: 20, cursor: 'pointer' },
  section: { margin: '10px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  pill: { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: 999 },
  btn: { padding: '2px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' },
  input: { flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: 'white' },
  button: { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' }
};

export default GovernancePanel;

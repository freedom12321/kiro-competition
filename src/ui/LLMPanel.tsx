import React, { useEffect, useState } from 'react';
import { getLLMConfig, setLLMConfig, testLLMConnection, listAvailableModels, getLLMEnabled, setLLMEnabled } from '@/agents/llmClient';

interface LLMPanelProps {
  visible: boolean;
  onClose: () => void;
}

const LLMPanel: React.FC<LLMPanelProps> = ({ visible, onClose }) => {
  const initial = getLLMConfig();
  const [endpoint, setEndpoint] = useState(initial.endpoint.replace(/\/api\/generate$/, ''));
  const [model, setModel] = useState(initial.model);
  const [enabled, setEnabled] = useState(getLLMEnabled());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    if (!visible) return;
    listAvailableModels().then(setModels).catch(() => setModels([]));
  }, [visible]);

  if (!visible) return null;

  const saveConfig = () => {
    setLLMEnabled(enabled);
    setLLMConfig({
      endpoint: endpoint.endsWith('/api/generate') ? endpoint : `${endpoint.replace(/\/$/, '')}/api/generate`,
      model
    });
    setTestResult('Saved');
    setTimeout(() => setTestResult(null), 1200);
  };

  const doTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const ok = await testLLMConnection({ ...getLLMConfig(), endpoint: endpoint.endsWith('/api/generate') ? endpoint : `${endpoint.replace(/\/$/, '')}/api/generate`, model });
      setTestResult(ok ? 'Connection OK' : 'Connection failed');
    } catch (e) {
      setTestResult('Connection failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h2 style={{ margin: 0 }}>🧠 LLM Settings</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Enabled</label>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Ollama Host</label>
          <input style={styles.input} value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="http://localhost:11434" />
        </div>

        <div style={styles.row}>
          <label style={styles.label}>Model</label>
          <input style={styles.input} value={model} onChange={(e) => setModel(e.target.value)} list="llm-models" />
          <datalist id="llm-models">
            {models.map(m => <option key={m} value={m} />)}
          </datalist>
        </div>

        <div style={styles.actions}>
          <button onClick={saveConfig} style={styles.button}>💾 Save</button>
          <button onClick={doTest} style={styles.button} disabled={testing}>{testing ? 'Testing…' : '🔌 Test'}</button>
          {testResult && <span style={styles.result}>{testResult}</span>}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  panel: { width: 520, background: '#0f172a', color: 'white', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 16 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  closeBtn: { background: 'transparent', color: 'white', border: 'none', fontSize: 20, cursor: 'pointer' },
  row: { display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' },
  label: { width: 120, opacity: 0.8 },
  input: { flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: 'white' },
  actions: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 },
  button: { padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: 'white', cursor: 'pointer' },
  result: { marginLeft: 8, opacity: 0.85 }
};

export default LLMPanel;


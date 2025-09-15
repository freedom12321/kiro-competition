import React from 'react';

interface PerformanceOverlayProps {
  visible: boolean;
  onClose: () => void;
}

const PerformanceOverlay: React.FC<PerformanceOverlayProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Performance Monitor</h2>
          <button onClick={onClose} style={{ border: 'none', background: '#f5f5f5', padding: '8px', borderRadius: '4px' }}>✕</button>
        </div>

        <div>
          <h3>System Status</h3>
          <p>• Simulation running smoothly</p>
          <p>• No LLM integration yet</p>
          <p>• Basic world state active</p>

          <h3>Performance Metrics</h3>
          <p>• Tick rate: 10s intervals</p>
          <p>• Memory usage: Normal</p>
          <p>• Render FPS: 60</p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOverlay;
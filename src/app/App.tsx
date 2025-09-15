import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import GameView from './GameView';
import './App.css';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error?: Error }>{
  constructor(props: any){ super(props); this.state = {}; }
  static getDerivedStateFromError(error: Error){ return { error }; }
  componentDidCatch(error: Error){ console.error('UI error:', error); }
  render(){
    if (this.state.error){
      return (
        <div style={{ padding: 20, color: '#b91c1c', fontFamily: 'monospace' }}>
          <h2>Something went wrong</h2>
          <pre>{String(this.state.error.message || this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="app">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/tutorial" element={<GameView mode="tutorial" />} />
          <Route path="/sandbox" element={<GameView mode="sandbox" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ErrorBoundary>
  );
}

export default App;

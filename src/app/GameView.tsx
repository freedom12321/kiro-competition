import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useWorldStore } from '../sim/worldStore';
import DeviceCreationPanel from '../ui/DeviceCreationPanel.tsx';
import WhyCard from '../ui/WhyCard';
import LessonTooltip from '../ui/LessonTooltip';
import { LessonSystem, Lesson } from '../education/LessonSystem';
import PerformanceOverlay from '../ui/PerformanceOverlay';
import { getDeviceIcon, loadTutorialDevices } from '../sim/deviceLoader';
import { loadTutorialScenario } from '@/sim/scenarioLoader';
import './GameView.css';
import PixiScene from '@/view/PixiScene';
import LLMPanel from '@/ui/LLMPanel';
import GovernancePanel from '@/ui/GovernancePanel';
import RuleBrowser from '../ui/RuleBrowser';
import { loadExampleTiledMap } from '@/view/tiledLoader';
import { listMaps } from '@/view/mapRegistry';
import SmartHomeBoard from '@/ui/SmartHomeBoard';
import DeviceIconSidebar from '@/ui/DeviceIconSidebar';
import LiveFeed from '@/ui/LiveFeed';
import ConversationPanel from '@/ui/ConversationPanel';
import DeviceFallbackOverlay from '@/ui/DeviceFallbackOverlay';

interface GameViewProps {
  mode: 'tutorial' | 'sandbox';
}

const GameView: React.FC<GameViewProps> = ({ mode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldStore = useWorldStore();
  const addPerson = useWorldStore(s => (s as any).addPerson);
  const [showDeviceCreation, setShowDeviceCreation] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [activeLessons, setActiveLessons] = useState<Lesson[]>([]);
  const [showPerformanceOverlay, setShowPerformanceOverlay] = useState(false);
  const [showRuleBrowser, setShowRuleBrowser] = useState(false);
  const [showLLMPanel, setShowLLMPanel] = useState(false);
  const [showGov, setShowGov] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [seedInput, setSeedInput] = useState(worldStore.seed.toString());
  const [simMode, setSimMode] = useState(worldStore.mode);
  const [renderMode, setRenderMode] = useState<'flat'|'iso'>('iso');
  const [mapSource, setMapSource] = useState<'procedural'|'tiled'>('tiled');
  const [tileStyle, setTileStyle] = useState<'vector'|'textured'>('vector');
  const [uiTheme, setUiTheme] = useState<'classic'|'pixel'>('pixel');
  const [snapRoam, setSnapRoam] = useState<boolean>(true);
  const [boardMode, setBoardMode] = useState<boolean>(true);
  const [gaMode, setGaMode] = useState<boolean>(false);
  const maps = useMemo(() => listMaps(), []);
  const [mapKey, setMapKey] = useState<string>(maps[0]?.key || 'example_map.json');
  const activity = useMemo(() => {
    const hour = Math.floor((worldStore.timeSec / 60) % 24);
    if (hour >= 6 && hour < 9) return '☕ Morning routine (kitchen)';
    if (hour >= 9 && hour < 12) return '🧹 Light chores & setup';
    if (hour >= 12 && hour < 14) return '🍽️ Lunch time';
    if (hour >= 14 && hour < 18) return '🎧 Afternoon focus';
    if (hour >= 18 && hour < 21) return '🍳 Dinner & wind‑down';
    if (hour >= 21 || hour < 6) return '🌙 Quiet hours & sleep';
    return '🏡 Idle';
  }, [worldStore.timeSec]);
  const lessonSystemRef = useRef(new LessonSystem());
  const humanRoom = useMemo(() => {
    const hour = Math.floor((worldStore.timeSec / 60) % 24);
    if (hour >= 6 && hour < 9) return 'kitchen';
    if (hour >= 21 || hour < 6) return 'bedroom';
    return 'living_room';
  }, [worldStore.timeSec]);

  const sceneRef = useRef<PixiScene | null>(null);
  const [selected, setSelected] = useState<{ type: 'all'|'human'|'device', id?: string }>({ type:'all' });
  const [pixiReady, setPixiReady] = useState(false);

  useEffect(() => {
    // Initialize Pixi.js application when canvas is ready
    if (canvasRef.current && !sceneRef.current) {
      const scene = new PixiScene();
      sceneRef.current = scene;
      scene.init(canvasRef.current, 800, 600).then(() => {
        if (sceneRef.current) {
          setPixiReady(true);
          scene.update(worldStore);
          scene.center?.();
        }
      }).catch(() => setPixiReady(false));
      scene.setOnSelect((sel) => {
        if (sel.type === 'human') setSelected({ type: 'human' });
        if (sel.type === 'device') setSelected({ type: 'device', id: sel.id });
      });
    }
    return () => {
      setPixiReady(false);
      sceneRef.current?.destroy();
      sceneRef.current = null;
    };
  }, []);

  // Update scene when world changes
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.setRenderOptions({ mode: renderMode, mapSource, tileStyle, snapRoamToTiled: snapRoam, theme: uiTheme });
    if (mapSource === 'tiled') {
      const entry = maps.find(m => m.key === mapKey) || maps[0];
      const map = entry?.data || loadExampleTiledMap();
      scene.setTiledMap(map);
    }
    scene.update(worldStore);
    scene.center?.();
  }, [worldStore.eventLog.length, Object.keys(worldStore.devices).length, worldStore.timeSec, mapKey]);

  // Rebuild scene when render options change
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.reset();
    scene.setRenderOptions({ mode: renderMode, mapSource, tileStyle, snapRoamToTiled: snapRoam, theme: uiTheme });
    if (mapSource === 'tiled') {
      const entry = maps.find(m => m.key === mapKey) || maps[0];
      const map = entry?.data || loadExampleTiledMap();
      scene.setTiledMap(map);
    }
    scene.update(worldStore);
    scene.center?.();
  }, [renderMode, mapSource, tileStyle, snapRoam, mapKey]);

  // Auto-hide the Board once when pixel theme is selected so the 2D scene is visible
  useEffect(() => {
    if (uiTheme === 'pixel' && boardMode) {
      setBoardMode(false);
    }
  }, [uiTheme]);

  // Monitor world events for lesson generation
  useEffect(() => {
    if (worldStore.eventLog.length > 0) {
      const lessonSystem = lessonSystemRef.current;

      // Generate lessons from recent events
      const eventLessons = lessonSystem.generateLessonsFromEvents(worldStore.eventLog, worldStore);

      // Generate contextual lessons
      const contextLessons = lessonSystem.generateContextualLessons(worldStore);

      // Combine and update active lessons
      const newLessons = [...eventLessons, ...contextLessons];
      if (newLessons.length > 0) {
        setActiveLessons(prev => [...prev, ...newLessons]);
      }
    }
  }, [worldStore.eventLog.length, worldStore.health, worldStore.resources]);

  // Tutorial-specific lesson triggers
  useEffect(() => {
    if (mode === 'tutorial') {
      const lessonSystem = lessonSystemRef.current;

      // Simulate tutorial step progression based on world state
      // In a real implementation, this would be driven by tutorial system
      let currentStep = 1;
      if (worldStore.eventLog.some(e => e.kind === 'conflict_resolved')) {
        currentStep = 3;
      }
      if (worldStore.health > 0.7) {
        currentStep = 6;
      }

      const tutorialLesson = lessonSystem.getTutorialLesson(currentStep);
      if (tutorialLesson && !activeLessons.some(l => l.id === tutorialLesson.id)) {
        setActiveLessons(prev => [...prev, tutorialLesson]);
      }

      // Hint modal: suggest Comfort > Efficiency if many conflicts and order not set
      const conflicts = worldStore.eventLog.slice(-20).filter(e => e.kind.includes('conflict')).length;
      const order = worldStore.policies.priority_order || [];
      const comfortIdx = order.indexOf('comfort');
      const efficiencyIdx = order.indexOf('efficiency');
      if (conflicts >= 3 && comfortIdx > efficiencyIdx && efficiencyIdx !== -1 && comfortIdx !== -1) {
        // already correct, do nothing
      } else if (conflicts >= 3 && efficiencyIdx !== -1 && comfortIdx !== -1) {
        setShowHint(true);
      }
    }
  }, [mode, worldStore.eventLog.length, worldStore.health]);

  const handleStartSim = () => {
    worldStore.startSim();
  };

  const handlePauseSim = () => {
    worldStore.pauseSim();
  };

  const handleSpeedChange = (speed: 1 | 2 | 4) => {
    worldStore.setSpeed(speed);
  };

  const handleLoadTutorial = async () => {
    try {
      console.log('🎓 Loading tutorial scenario...');
      let devices = await loadTutorialScenario(worldStore);
      if (!devices || devices.length === 0) {
        console.warn('Tutorial scenario returned no devices, falling back to built-in specs');
        devices = await loadTutorialDevices();
      }

      // Add devices to world store
      devices.forEach(device => {
        worldStore.addDevice(device);
      });

      console.log(`✅ Tutorial loaded with ${devices.length} devices`);
      // Auto-start simulation after loading tutorial devices
      if (!worldStore.running) {
        worldStore.startSim();
      }
      // Center camera to show rooms/devices clearly
      sceneRef.current?.center?.();
    } catch (error) {
      console.error('Failed to load tutorial via scenario loader. Falling back to built-in devices.', error);
      try {
        const devices = await loadTutorialDevices();
        devices.forEach(device => worldStore.addDevice(device));
        if (!worldStore.running) worldStore.startSim();
      } catch (e2) {
        console.error('Built-in tutorial device load also failed:', e2);
      }
    }
  };

  const handleTestHeat = () => {
    worldStore.heat('living_room', 1.0);
  };

  const handleEventToggle = (eventKey: string) => {
    const newExpandedEvents = new Set(expandedEvents);
    if (newExpandedEvents.has(eventKey)) {
      newExpandedEvents.delete(eventKey);
    } else {
      newExpandedEvents.add(eventKey);
    }
    setExpandedEvents(newExpandedEvents);
  };

  const handleLessonClose = (lessonId: string) => {
    setActiveLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
  };

  return (
    <div className="game-view">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="game-title-small">AI Habitat</div>
        <div className="mode-indicator">{mode === 'tutorial' ? '📚 Tutorial' : '🛠️ Sandbox'}</div>
        <div className="uncertainty-banner" title="Stable basics + learning + noise + events + timing → emergence">
          🌀 Unpredictable by design
        </div>
        <div style={{ padding:'4px 10px', background:'#0f172a', color:'#c7d2fe', borderRadius:8, fontSize:12 }} title="Current household activity">
          Now: {activity}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, opacity: 0.85 }}>Seed</span>
          <input
            value={seedInput}
            onChange={(e) => setSeedInput(e.target.value)}
            style={{ width: 90 }}
          />
          <button className="performance-button" title="Apply seed" onClick={() => {
            const v = parseInt(seedInput, 10);
            if (!Number.isNaN(v)) {
              useWorldStore.setState(s => ({ ...s, seed: v }));
            }
          }}>↻</button>
          <select value={simMode} onChange={(e) => { setSimMode(e.target.value as any); useWorldStore.setState(s => ({ ...s, mode: e.target.value as any })); }}>
            <option value="open-ended">open-ended</option>
            <option value="seeded-replay">seeded-replay</option>
          </select>
          <select value={renderMode} onChange={(e) => setRenderMode(e.target.value as 'flat'|'iso')} title="Render mode">
            <option value="flat">flat</option>
            <option value="iso">iso</option>
          </select>
          <select value={mapSource} onChange={(e) => setMapSource(e.target.value as 'procedural'|'tiled')} title="Map source">
            <option value="procedural">procedural</option>
            <option value="tiled">tiled</option>
          </select>
          {mapSource === 'tiled' && (
            <select value={mapKey} onChange={(e)=> setMapKey(e.target.value)} title="Choose map">
              {maps.map(m => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select>
          )}
          <select value={uiTheme} onChange={(e)=> setUiTheme(e.target.value as any)} title="UI Theme">
            <option value="pixel">pixel</option>
            <option value="classic">classic</option>
          </select>
          {renderMode === 'iso' && (
            <select value={tileStyle} onChange={(e) => setTileStyle(e.target.value as 'vector'|'textured')} title="Tile style">
              <option value="vector">vector</option>
              <option value="textured">textured</option>
            </select>
          )}
          {mapSource === 'tiled' && (
            <label style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="Snap roaming to Tiled room bounds">
              <input type="checkbox" checked={snapRoam} onChange={(e) => setSnapRoam(e.target.checked)} /> snap roam
            </label>
          )}
          <button className="performance-button" title="Center view" onClick={() => sceneRef.current?.center?.()}>🎯 Center</button>
          <label style={{ display:'flex', alignItems:'center', gap:4 }} title="Switch to board layout">
            <input type="checkbox" checked={boardMode} onChange={(e)=> setBoardMode(e.target.checked)} /> Board
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:4 }} title="GA Mode: full 2D scene like Generative Agents">
            <input type="checkbox" checked={gaMode} onChange={(e)=> setGaMode(e.target.checked)} /> GA
          </label>
        </div>
        <button
          onClick={() => setShowRuleBrowser(true)}
          className="performance-button"
          title="Browse and toggle rule packs"
        >
          📜 Rules
        </button>
        <button
          onClick={() => setShowGov(true)}
          className="performance-button"
          title="Adjust priorities and comms"
        >
          ⚖️ Governance
        </button>
        <button
          onClick={() => setShowPerformanceOverlay(true)}
          className="performance-button"
          title="View performance metrics and LLM batching stats"
        >
          📊 Performance
        </button>
        <button
          onClick={() => setShowLLMPanel(true)}
          className="performance-button"
          title="Configure local LLM (Ollama)"
        >
          🧠 LLM
        </button>
        <div className="harmony-bar">
          <span>Harmony:</span>
          <div className="harmony-fill" style={{
            width: `${worldStore.health * 100}%`,
            backgroundColor: worldStore.health > 0.7 ? '#4CAF50' :
                           worldStore.health > 0.4 ? '#FF9800' : '#F44336'
          }}></div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`game-content ${gaMode ? 'ga-mode' : ''}`}>
        {/* Left Panel - Controls */}
        <div className="left-panel">
          <div className="simulation-controls">
            <h3>Simulation</h3>
            <button
              onClick={worldStore.running ? handlePauseSim : handleStartSim}
              className={`control-button ${worldStore.running ? 'pause' : 'play'}`}
            >
              {worldStore.running ? '⏸️ Pause' : '▶️ Play'}
            </button>

            <div className="speed-controls">
              <span>Speed:</span>
              {[1, 2, 4].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed as 1 | 2 | 4)}
                  className={`speed-button ${worldStore.speed === speed ? 'active' : ''}`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          <div className="room-status">
            <h3>Room Status</h3>
            {Object.entries(worldStore.rooms).map(([roomId, roomState]) => (
              <div key={roomId} className="room-info">
                <h4>{roomId.replace('_', ' ')}</h4>
                <div className="room-vars">
                  <div>🌡️ {roomState.temperature.toFixed(1)}°C</div>
                  <div>💡 {(roomState.lumens * 100).toFixed(0)}%</div>
                  <div>🔊 {(roomState.noise * 100).toFixed(0)}%</div>
                </div>
              </div>
            ))}
        </div>

        {/* Device Icon Sidebar for quick creation */}
        <div style={{ marginTop: 10 }}>
          <DeviceIconSidebar />
        </div>

          <div className="device-controls">
            <h3>Devices</h3>
            {mode === 'tutorial' && (
              <button
                onClick={handleLoadTutorial}
                className="tutorial-button"
                disabled={Object.keys(worldStore.devices).length > 0}
              >
                🎓 Load Tutorial
              </button>
            )}
            <button
              onClick={() => setShowDeviceCreation(true)}
              className="create-device-button"
            >
              ➕ Create Device
            </button>

            <div className="device-list">
              {Object.values(worldStore.devices).length === 0 ? (
                <div className="no-devices">
                  {mode === 'tutorial' ? 'Click "Load Tutorial" to start!' : 'No devices yet. Create one to begin!'}
                </div>
              ) : (
                Object.values(worldStore.devices).map((device) => (
                  <div key={device.id} className="device-item">
                    <div className="device-icon">{getDeviceIcon(device)}</div>
                    <div className="device-info">
                      <div className="device-name">{device.spec.name}</div>
                      <div className="device-room">{device.room.replace('_', ' ')}</div>
                      <div className={`device-status status-${device.status}`}>
                        {device.status === 'idle' ? '💤 idle' :
                         device.status === 'acting' ? '⚡ active' :
                         device.status === 'conflict' ? '⚔️ conflict' :
                         device.status === 'safe' ? '🛡️ safe' : device.status}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          <div style={{ marginTop: 16 }}>
            <h3>Residents</h3>
            <button
              onClick={() => {
                const id = 'person.isabella.' + Date.now();
                addPerson({ id, name: 'Isabella', room: 'living_room', x: 80, y: 120, sprite: '/assets/characters/isabella.png' } as any);
              }}
              className="create-device-button"
            >
              ➕ Add Isabella
            </button>
          </div>
          </div>

          <div className="test-controls">
            <h3>Test Actions</h3>
            <button onClick={handleTestHeat} className="test-button">
              🔥 Heat Living Room
            </button>
          </div>
        </div>

        {/* Center - Game Canvas */}
        <div className="game-canvas-container" style={{ position:'relative' }}>
          <canvas
            ref={canvasRef}
            className="game-canvas"
            width={800}
            height={600}
          />
          <div className="canvas-overlay">
            <div className="time-display">
              Time: {Math.floor(worldStore.timeSec / 60)}:{(worldStore.timeSec % 60).toString().padStart(2, '0')}
            </div>
            <div className="time-display" style={{ marginTop: 6 }}>
              🧑 Human: {humanRoom.replace('_', ' ')}
            </div>
          </div>
          {/* Always render lightweight DOM icons so devices are visible
              even if WebGL has trouble. Overlay is pointer-events:none. */}
          <DeviceFallbackOverlay
            visible={
              !pixiReady ||
              (typeof window !== 'undefined' && (window as any).__aihab_showOverlay) ||
              Object.keys(worldStore.devices).length > 0
            }
          />
          <LiveFeed />
          {boardMode && (
            <SmartHomeBoard visible={true} />
          )}
          {/* Conversation panel on the right, overlaying canvas like Generative Agents */}
          <div style={{ position:'absolute', right:10, top:96, width:'clamp(280px, 24vw, 340px)', zIndex:11 }}>
            <ConversationPanel selected={selected} />
          </div>
          {/* Bottom status bar */}
          <div style={{ position:'absolute', left:10, right:10, bottom:8, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', background:'rgba(11,16,32,0.7)', color:'#e5e7eb', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8, padding:'6px 10px', zIndex:11 }}>
            <div>Day {Math.floor(worldStore.timeSec/ (60*24)) + 1} • {humanRoom.replace('_',' ')} • Harmony {(worldStore.health*100).toFixed(0)}%</div>
            <div>Focus: {selected.type==='human' ? 'Human' : selected.type==='device' ? (worldStore.devices[selected.id!]?.spec.name || 'Device') : 'All'}</div>
          </div>
        </div>

        {/* Right Panel - Events & Why Cards */}
        <div className="right-panel">
          <div className="event-log">
            <h3>Why Events</h3>
            <div className="why-cards-container">
              {worldStore.eventLog.slice(-10).reverse().map((event, index) => {
                const eventKey = `${event.at}-${index}`;
                return (
                  <WhyCard
                    key={eventKey}
                    event={event}
                    isExpanded={expandedEvents.has(eventKey)}
                    onToggle={() => handleEventToggle(eventKey)}
                  />
                );
              })}
              {worldStore.eventLog.length === 0 && (
                <div className="no-events">
                  <p>No events yet. Start the simulation to see device interactions!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeviceCreation && (
        <DeviceCreationPanel onClose={() => setShowDeviceCreation(false)} />
      )}

      {/* Lesson Tooltips */}
      {activeLessons.map((lesson, idx) => (
        <LessonTooltip
          key={`${lesson.id}-${idx}`}
          message={lesson.message}
          type={lesson.type}
          position={lesson.position}
          duration={lesson.duration}
          onClose={() => handleLessonClose(lesson.id)}
        />
      ))}

      {/* Performance Overlay */}
      <PerformanceOverlay
        visible={showPerformanceOverlay}
        onClose={() => setShowPerformanceOverlay(false)}
      />
      <RuleBrowser
        visible={showRuleBrowser}
        onClose={() => setShowRuleBrowser(false)}
      />
      <LLMPanel
        visible={showLLMPanel}
        onClose={() => setShowLLMPanel(false)}
      />
      <GovernancePanel
        visible={showGov}
        onClose={() => setShowGov(false)}
      />

      {showHint && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ width: 520, background: '#0f172a', color: 'white', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>Try Comfort &gt; Efficiency</h3>
              <button onClick={() => setShowHint(false)} style={{ background: 'transparent', border: 'none', color: 'white', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>
            <p style={{ opacity: 0.9 }}>Conflicts suggest your devices are optimizing individually. Drag <b>Comfort</b> above <b>Efficiency</b> in Governance to encourage cooperation.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="performance-button" onClick={() => { setShowHint(false); setShowGov(true); }}>Open Governance</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameView;

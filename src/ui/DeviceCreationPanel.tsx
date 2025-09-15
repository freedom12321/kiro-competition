import React, { useState } from 'react';
import { generateSpecFromNL, saveDeviceSpec } from '../agents/specGenerator';
import { DeviceSpec, DeviceRuntime } from '../types/core';
import { useWorldStore } from '../sim/worldStore';
import './DeviceCreationPanel.css';

interface DeviceCreationPanelProps {
  onClose: () => void;
}

const DeviceCreationPanel: React.FC<DeviceCreationPanelProps> = ({ onClose }) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSpec, setGeneratedSpec] = useState<DeviceSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const worldStore = useWorldStore();

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError('Please describe your device');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const spec = await generateSpecFromNL(description);
      setGeneratedSpec(spec);
    } catch (err) {
      setError('Failed to generate device specification');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateDevice = () => {
    if (!generatedSpec) return;

    // Save spec to Kiro directory
    saveDeviceSpec(generatedSpec);

    // Create runtime device and add to world
    const deviceRuntime: DeviceRuntime = {
      id: generatedSpec.id,
      spec: generatedSpec,
      room: generatedSpec.room,
      memory: { summary: 'Just created', prefs: {} },
      status: 'idle',
      x: Math.random() * 200 + 50, // Random position in room
      y: Math.random() * 200 + 50,
      personalitySeed: Math.random(),
      planningPhase: Math.floor(Math.random() * 4)
    };

    worldStore.addDevice(deviceRuntime);

    // Reset and close
    setDescription('');
    setGeneratedSpec(null);
    onClose();
  };

  const handleModifySpec = (field: string, value: any) => {
    if (!generatedSpec) return;

    setGeneratedSpec({
      ...generatedSpec,
      [field]: value
    });
  };

  return (
    <div className="device-creation-overlay">
      <div className="device-creation-panel">
        <div className="panel-header">
          <h2>🛠️ Create Smart Device</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="panel-content">
          {!generatedSpec ? (
            <div className="description-section">
              <h3>Describe your device</h3>
              <p className="hint">
                Tell us what you want your smart device to do. Be as specific or creative as you like!
              </p>

              <textarea
                className="description-input"
                placeholder="e.g., A sofa that adjusts to my size and firmness preferences..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />

              <div className="example-prompts">
                <p>Examples:</p>
                <div className="example-buttons">
                  <button
                    className="example-button"
                    onClick={() => setDescription("A sofa that adjusts to my size and keeps me comfortable")}
                  >
                    Smart Sofa
                  </button>
                  <button
                    className="example-button"
                    onClick={() => setDescription("A lamp that changes color based on my mood and time of day")}
                  >
                    Emotion Lamp
                  </button>
                  <button
                    className="example-button"
                    onClick={() => setDescription("An AC that maintains perfect temperature while saving energy")}
                  >
                    Smart AC
                  </button>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button
                className="generate-button"
                onClick={handleGenerate}
                disabled={isGenerating || !description.trim()}
              >
                {isGenerating ? '🔄 Generating...' : '✨ Generate Device'}
              </button>
            </div>
          ) : (
            <div className="spec-review-section">
              <h3>Review Your Device</h3>
              <div className="spec-preview">
                <div className="spec-field">
                  <label>Name:</label>
                  <input
                    type="text"
                    value={generatedSpec.name}
                    onChange={(e) => handleModifySpec('name', e.target.value)}
                  />
                </div>

                <div className="spec-field">
                  <label>Room:</label>
                  <select
                    value={generatedSpec.room}
                    onChange={(e) => handleModifySpec('room', e.target.value)}
                  >
                    <option value="living_room">Living Room</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="bedroom">Bedroom</option>
                  </select>
                </div>

                <div className="spec-field">
                  <label>Personality:</label>
                  <input
                    type="text"
                    value={generatedSpec.personality}
                    onChange={(e) => handleModifySpec('personality', e.target.value)}
                  />
                </div>

                <div className="spec-section">
                  <h4>Goals:</h4>
                  {generatedSpec.goals.map((goal, index) => (
                    <div key={index} className="goal-item">
                      <span>{goal.name}</span>
                      <span className="goal-weight">{(goal.weight * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>

                <div className="spec-section">
                  <h4>Sensors:</h4>
                  <div className="sensor-list">
                    {generatedSpec.sensors.map((sensor, index) => (
                      <span key={index} className="sensor-tag">{sensor}</span>
                    ))}
                  </div>
                </div>

                <div className="spec-section">
                  <h4>Actions:</h4>
                  <div className="actuator-list">
                    {generatedSpec.actuators.map((actuator, index) => (
                      <span key={index} className="actuator-tag">{actuator}</span>
                    ))}
                  </div>
                </div>

                <div className="spec-section">
                  <h4>AI Instructions:</h4>
                  <textarea
                    className="llm-prompt-input"
                    value={generatedSpec.llm_prompt}
                    onChange={(e) => handleModifySpec('llm_prompt', e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="back-button"
                  onClick={() => setGeneratedSpec(null)}
                >
                  ← Back to Edit
                </button>
                <button
                  className="create-button"
                  onClick={handleCreateDevice}
                >
                  🚀 Create Device
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceCreationPanel;
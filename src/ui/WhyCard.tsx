import React from 'react';
import { WorldEvent } from '../types/core';
import './WhyCard.css';

interface WhyCardProps {
  event: WorldEvent;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const WhyCard: React.FC<WhyCardProps> = ({ event, isExpanded = false, onToggle }) => {
  const getEventIcon = (kind: string): string => {
    const iconMap: Record<string, string> = {
      'conflict_resolved': '⚡',
      'cooperation': '🤝',
      'rule_fired': '⚖️',
      'action': '🎯',
      'device_added': '➕',
      'device_removed': '➖',
      'temperature_change': '🌡️',
      'variable_change': '📊',
      'safety_alarm': '🚨',
      'director_event': '🎭',
      'tick': '⏰'
    };
    return iconMap[kind] || '📋';
  };

  const getEventTitle = (event: WorldEvent): string => {
    switch (event.kind) {
      case 'conflict_resolved':
      case 'conflict_resolution':
        return `Conflict Resolved: ${event.data?.winner} won`;
      case 'cooperation':
        return `Cooperation: ${event.data?.devices?.join(' + ')}`;
      case 'rule_fired':
        return `Rule Applied: ${event.data?.ruleId}`;
      case 'action':
        return `Device Action: ${event.data?.action}`;
      case 'device_added':
        return `New Device: ${event.data?.name}`;
      case 'temperature_change':
        return `Temperature ${event.data?.delta > 0 ? 'Increased' : 'Decreased'}`;
      case 'safety_alarm':
        return `Safety Alert: ${event.data?.alarm}`;
      case 'director_event':
        return `Environment: ${event.data?.type}`;
      default:
        return `Event: ${event.kind}`;
    }
  };

  const getEventExplanation = (event: WorldEvent): string => {
    switch (event.kind) {
      case 'conflict_resolved':
      case 'conflict_resolution':
        return event.data?.explanation || `${event.data?.winner} had higher utility score based on current policies`;
      case 'cooperation':
        return `Devices worked together, achieving better results than individual optimization`;
      case 'rule_fired':
        return event.data?.explain || `Rule activated based on current world conditions`;
      case 'action':
        return `Device performed action to achieve its goals while respecting constraints`;
      case 'temperature_change':
        return `Temperature changed by ${event.data?.delta?.toFixed(1)}°C to ${event.data?.new_temperature?.toFixed(1)}°C`;
      case 'safety_alarm':
        return `Safety limit exceeded - automatic intervention activated`;
      case 'director_event':
        return `Environmental change to maintain engagement and learning opportunities`;
      default:
        return `System event occurred during simulation`;
    }
  };

  const getPolicyReason = (event: WorldEvent): string | null => {
    if (event.kind === 'conflict_resolved' || event.kind === 'conflict_resolution') {
      return `Policy: ${event.data?.rule_applied || 'Priority-based resolution'}`;
    }
    if (event.kind === 'rule_fired') {
      return `Policy: Rule enforcement active`;
    }
    return null;
  };

  const getTradeOffs = (event: WorldEvent): Record<string, number> | null => {
    if (event.kind === 'action' && event.data?.deltas) {
      return event.data.deltas;
    }
    if (event.kind === 'conflict_resolved' || event.kind === 'conflict_resolution') {
      return event.data?.utility_scores || null;
    }
    return null;
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getSeverityClass = (event: WorldEvent): string => {
    if (event.kind === 'safety_alarm') return 'why-card-critical';
    if (event.kind === 'conflict_resolved') return 'why-card-warning';
    if (event.kind === 'cooperation') return 'why-card-success';
    return 'why-card-info';
  };

  return (
    <div
      className={`why-card ${getSeverityClass(event)} ${isExpanded ? 'expanded' : ''}`}
      onClick={onToggle}
    >
      <div className="why-card-header">
        <div className="why-card-icon">{getEventIcon(event.kind)}</div>
        <div className="why-card-main">
          <div className="why-card-title">{getEventTitle(event)}</div>
          <div className="why-card-time">{formatTime(event.at)}</div>
          <div className="why-card-room">{event.room}</div>
        </div>
        <div className="why-card-expand">
          {isExpanded ? '🔽' : '🔷'}
        </div>
      </div>

      <div className="why-card-content">
        <div className="why-card-section">
          <h4>What Happened</h4>
          <p>{getEventTitle(event)}</p>
        </div>

        <div className="why-card-section">
          <h4>Why</h4>
          <p>{getEventExplanation(event)}</p>
        </div>

        {getPolicyReason(event) && (
          <div className="why-card-section">
            <h4>Policy</h4>
            <p className="policy-reason">{getPolicyReason(event)}</p>
          </div>
        )}

        {getTradeOffs(event) && (
          <div className="why-card-section">
            <h4>Trade-offs</h4>
            <div className="trade-offs">
              {Object.entries(getTradeOffs(event)!).map(([key, value]) => (
                <div key={key} className="trade-off-item">
                  <span className="trade-off-key">{key}:</span>
                  <span className={`trade-off-value ${value > 0 ? 'positive' : value < 0 ? 'negative' : 'neutral'}`}>
                    {value > 0 ? '+' : ''}{typeof value === 'number' ? value.toFixed(2) : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational insights for learning */}
        {isExpanded && (
          <div className="why-card-section learning-insight">
            <h4>💡 Learning Insight</h4>
            <p>{getEducationalInsight(event)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

function getEducationalInsight(event: WorldEvent): string {
  switch (event.kind) {
    case 'conflict_resolved':
      return "This conflict shows how multiple AI agents can interfere with each other. Good governance rules help them coordinate instead of competing.";
    case 'cooperation':
      return "When devices work together, the result is often better than the sum of individual efforts. This is emergence in action!";
    case 'rule_fired':
      return "Rules create predictable behavior from complex systems. They're like traffic lights for AI agents.";
    case 'safety_alarm':
      return "Safety constraints are hard limits that can't be violated. They ensure AI optimization doesn't cause harm.";
    case 'director_event':
      return "The system injects variety to create learning opportunities. Real environments are never perfectly static.";
    default:
      return "Every action in a multi-agent system has ripple effects. Small changes can lead to big differences in outcomes.";
  }
}

export default WhyCard;

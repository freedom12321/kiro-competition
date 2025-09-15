import React, { useState, useEffect } from 'react';
import './LessonTooltip.css';

interface LessonTooltipProps {
  message: string;
  type: 'insight' | 'warning' | 'tip' | 'surprise';
  position?: { x: number; y: number };
  duration?: number;
  onClose?: () => void;
}

const LessonTooltip: React.FC<LessonTooltipProps> = ({
  message,
  type,
  position = { x: 50, y: 20 },
  duration = 4000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Start fade-in animation
    setTimeout(() => setIsAnimating(true), 100);

    // Auto-close after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  const getIcon = (type: string): string => {
    const icons = {
      insight: '💡',
      warning: '⚠️',
      tip: '🎯',
      surprise: '✨'
    };
    return icons[type] || '💡';
  };

  if (!isVisible) return null;

  return (
    <div
      className={`lesson-tooltip ${type} ${isAnimating ? 'visible' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`
      }}
    >
      <div className="lesson-header">
        <div className="lesson-icon">{getIcon(type)}</div>
        <div className="lesson-type">{type}</div>
        <button className="lesson-close" onClick={handleClose}>×</button>
      </div>
      <div className="lesson-message">{message}</div>
      <div className="lesson-progress">
        <div className="lesson-progress-bar" style={{ animationDuration: `${duration}ms` }}></div>
      </div>
    </div>
  );
};

export default LessonTooltip;
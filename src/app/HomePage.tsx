import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handlePlayTutorial = () => {
    navigate('/tutorial');
  };

  const handleFreeSandbox = () => {
    navigate('/sandbox');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', color: 'white', maxWidth: '800px' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 300, marginBottom: '10px' }}>
          AI Habitat
          <br />
          <span style={{ fontSize: '1.5rem', opacity: 0.9 }}>Harmony or Havoc?</span>
        </h1>

        <p style={{ fontSize: '1.2rem', margin: '40px auto', maxWidth: '600px' }}>
          A user-friendly sandbox where players create LLM-powered smart devices for homes, hospitals, and offices,
          then watch them cooperate or collide.
        </p>

        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', margin: '50px 0', flexWrap: 'wrap' }}>
          <button
            onClick={handlePlayTutorial}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1rem',
              padding: '20px 30px',
              borderRadius: '12px',
              minWidth: '200px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            📚 Play Tutorial
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Learn the basics</span>
          </button>

          <button
            onClick={handleFreeSandbox}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              fontSize: '1.1rem',
              padding: '20px 30px',
              borderRadius: '12px',
              minWidth: '200px',
              background: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.25)',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            🛠️ Free Sandbox
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>Create & experiment</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
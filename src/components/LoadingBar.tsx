import React from 'react';

interface LoadingBarProps {
  progress: number;
}

const LoadingBar: React.FC<LoadingBarProps> = ({ progress }) => {
  return (
    <div className="flex items-center gap-2">
      <div style={{
        width: '100%',
        height: '4px',
        backgroundColor: '#f0f0f0',
        borderRadius: '2px',
        margin: '10px 0',
        position: 'relative'
      }}>
        <div style={{
          width: `${progress}%`,
          height: '100%',
          backgroundColor: '#2196F3',
          borderRadius: '2px',
          transition: 'width 0.3s ease-in-out'
        }} />
      </div>
      <span style={{
        minWidth: '40px',
        fontSize: '14px',
        color: '#666'
      }}>
        {Math.round(progress)}%
      </span>
    </div>
  );
};

export default LoadingBar;
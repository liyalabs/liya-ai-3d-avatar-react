import React from 'react';
import { AvatarScene } from './AvatarScene';
import type { Viseme } from '../types';

interface Props {
  modelUrl?: string;
  isSpeaking: boolean;
  visemes: Viseme[];
  onClose: () => void;
}

export function AvatarModal({ modelUrl, isSpeaking, visemes, onClose }: Props) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden' }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1,
          background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
          borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16,
        }}>✕</button>
        <AvatarScene
          modelUrl={modelUrl}
          width={400}
          height={500}
          isSpeaking={isSpeaking}
          visemes={visemes}
        />
      </div>
    </div>
  );
}

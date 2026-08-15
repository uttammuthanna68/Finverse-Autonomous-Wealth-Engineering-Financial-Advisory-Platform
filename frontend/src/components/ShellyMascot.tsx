import React from 'react';

export type ShellyPose = 'confident' | 'happy' | 'explaining' | 'panicked' | 'thinking';

interface ShellyMascotProps {
  pose?: ShellyPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animateFloat?: boolean;
  className?: string;
}

const POSE_IMAGE_MAP: Record<ShellyPose, string> = {
  confident: '/assets/mascot/shelly_confident.png',
  happy: '/assets/mascot/shelly_happy.png',
  explaining: '/assets/mascot/shelly_explaining.png',
  panicked: '/assets/mascot/shelly_panicked.png',
  thinking: '/assets/mascot/shelly_thinking.png',
};

const SIZE_MAP = {
  sm: 'w-22 h-22 sm:w-24 sm:h-24',
  md: 'w-32 h-32 sm:w-36 sm:h-36',
  lg: 'w-48 h-48 sm:w-56 sm:h-56',
  xl: 'w-60 h-60 sm:w-72 sm:h-72',
};

export const ShellyMascot: React.FC<ShellyMascotProps> = ({
  pose = 'confident',
  size = 'md',
  animateFloat = true,
  className = '',
}) => {
  const imgSrc = POSE_IMAGE_MAP[pose] || POSE_IMAGE_MAP.confident;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const floatClass = animateFloat ? 'animate-float' : '';

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${floatClass} ${className}`}>
      <img
        src={imgSrc}
        alt={`Prof. Shelly (${pose})`}
        className={`${sizeClass} object-contain filter drop-shadow-lg select-none pointer-events-none transition-all duration-300 transform hover:scale-105`}
      />
    </div>
  );
};

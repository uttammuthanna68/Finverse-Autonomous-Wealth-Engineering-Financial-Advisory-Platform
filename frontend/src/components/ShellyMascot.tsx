import React from 'react';

export type ShellyPose = 'confident' | 'happy' | 'explaining' | 'panicked' | 'thinking';

interface ShellyMascotProps {
  pose?: ShellyPose;
  size?: 'sm' | 'md' | 'lg';
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
  sm: 'w-16 h-16',
  md: 'w-28 h-28',
  lg: 'w-40 h-40',
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
    <div className={`relative inline-block flex-shrink-0 ${floatClass} ${className}`}>
      <img
        src={imgSrc}
        alt={`Shelly the Wealthy Tortoise (${pose})`}
        className={`${sizeClass} object-contain filter drop-shadow-md select-none pointer-events-none transition-all`}
      />
    </div>
  );
};

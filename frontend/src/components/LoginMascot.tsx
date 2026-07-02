import React from 'react';
import { motion } from 'framer-motion';

interface LoginMascotProps {
  isPasswordFocused: boolean;
}

const LoginMascot: React.FC<LoginMascotProps> = ({ isPasswordFocused }) => {
  // Determine state of hands (idle when not focused, covering when focused)
  const handState = isPasswordFocused ? 'covering' : 'idle';

  // Left arm path morphing (shoulder is anchored at 45, 106)
  const leftArmVariants = {
    idle: { d: "M 45 106 Q 30 115 36 128" },
    covering: { d: "M 45 106 Q 32 82 52 62" }
  };

  // Right arm path morphing (shoulder is anchored at 105, 106)
  const rightArmVariants = {
    idle: { d: "M 105 106 Q 120 115 114 128" },
    covering: { d: "M 105 106 Q 118 82 98 62" }
  };

  // Left hand translation to cover left eye at (52, 62)
  const leftHandVariants = {
    idle: { x: 36, y: 128, rotate: 0 },
    covering: { x: 52, y: 62, rotate: 15 }
  };

  // Right hand translation to cover right eye at (98, 62)
  const rightHandVariants = {
    idle: { x: 114, y: 128, rotate: 0 },
    covering: { x: 98, y: 62, rotate: -15 }
  };

  return (
    <div className="relative w-24 h-24 mx-auto flex items-center justify-center select-none pointer-events-none -mt-16 mb-2">
      {/* Background shadow glow */}
      <div className="absolute w-16 h-3 bg-blue-500/10 blur-md rounded-full bottom-0.5" />

      {/* Main Mascot Motion Group */}
      <motion.div
        animate={{ y: isPasswordFocused ? [0, -3, 0] : [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: isPasswordFocused ? 2 : 4, ease: "easeInOut" }}
        className="w-full h-full relative"
      >
        <svg viewBox="0 0 150 150" className="w-full h-full overflow-visible">
          <defs>
            {/* 3D Spherical Head Radial Gradient */}
            <radialGradient id="head3D" cx="40%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="70%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#CBD5E1" />
            </radialGradient>

            {/* 3D Body/Torso Radial Gradient */}
            <radialGradient id="body3D" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E2E8F0" />
              <stop offset="100%" stopColor="#94A3B8" />
            </radialGradient>
            
            {/* Glowing Blue Gradient */}
            <linearGradient id="robotBlueAccent" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Glowing Halo Gradient */}
            <linearGradient id="haloBlue" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#0077FF" />
            </linearGradient>
            
            <filter id="glowEffect">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* HEADPHONES */}
          {/* Dark Grey Band */}
          <path d="M 20 52 A 56 56 0 0 1 130 52" fill="none" stroke="#334155" strokeWidth="5" strokeLinecap="round" />
          <path d="M 35 34 A 50 50 0 0 1 115 34" fill="none" stroke="#E2E8F0" strokeWidth="7" strokeLinecap="round" />

          {/* Left Ear Cup */}
          <rect x="10" y="46" width="16" height="38" rx="8" fill="url(#head3D)" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="22" y="50" width="4" height="30" rx="2" fill="#475569" />
          <rect x="7" y="56" width="4" height="18" rx="1" fill="#38BDF8" filter="url(#glowEffect)" />

          {/* Right Ear Cup */}
          <rect x="124" y="46" width="16" height="38" rx="8" fill="url(#head3D)" stroke="#CBD5E1" strokeWidth="1" />
          <rect x="124" y="50" width="4" height="30" rx="2" fill="#475569" />
          <rect x="139" y="56" width="4" height="18" rx="1" fill="#38BDF8" filter="url(#glowEffect)" />

          {/* ROBOT LEGS/FEET (Stubby Capsule Pods) */}
          {/* Left Foot */}
          <ellipse cx="48" cy="135" rx="15" ry="9" fill="url(#body3D)" stroke="#CBD5E1" strokeWidth="1" />
          <path d="M 36 134 Q 48 129 53 136" stroke="#0284C7" strokeWidth="2.2" fill="none" />
          
          {/* Right Foot */}
          <ellipse cx="102" cy="135" rx="15" ry="9" fill="url(#body3D)" stroke="#CBD5E1" strokeWidth="1" />
          <path d="M 114 134 Q 104 129 97 136" stroke="#0284C7" strokeWidth="2.2" fill="none" />

          {/* ROBOT BODY/TORSO (White/Grey with Side Panels) */}
          <rect x="46" y="96" width="58" height="42" rx="16" fill="url(#body3D)" stroke="#CBD5E1" strokeWidth="1.5" />
          {/* Dark Slate Side Recesses */}
          <path d="M 46 102 C 53 104, 53 124, 46 130" fill="#0F172A" />
          <path d="M 104 102 C 97 104, 97 124, 104 130" fill="#0F172A" />
          {/* Glowing Collar */}
          <ellipse cx="75" cy="97" rx="18" ry="3.5" fill="#38BDF8" filter="url(#glowEffect)" />
          {/* Center glowing blue vertical line */}
          <line x1="75" y1="104" x2="75" y2="128" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" filter="url(#glowEffect)" />
          <circle cx="75" cy="104" r="2.2" fill="#38BDF8" filter="url(#glowEffect)" />

          {/* ROBOT HEAD (Solid Glossy White, No Black Screen) */}
          <rect x="26" y="34" width="98" height="64" rx="22" fill="url(#head3D)" stroke="#E2E8F0" strokeWidth="1" filter="url(#glowEffect)" />
          
          {/* Forehead Halo Glowing Ring */}
          <path d="M 50 42 Q 75 30 100 42" fill="none" stroke="url(#haloBlue)" strokeWidth="3" strokeLinecap="round" filter="url(#glowEffect)" />

          {/* EYES CONTAINER (Embedded directly on the white head surface) */}
          {/* Open Eyes Group (Hidden on password focus) */}
          <motion.g
            animate={isPasswordFocused ? { opacity: 0, scale: 0.8 } : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            style={{ originX: '75px', originY: '62px' }}
          >
            {/* Left Eye Sockets & Pupil */}
            <circle cx="52" cy="62" r="17.5" fill="#E2E8F0" />
            <circle cx="52" cy="62" r="16.5" fill="none" stroke="#38BDF8" strokeWidth="2.5" filter="url(#glowEffect)" />
            <circle cx="52" cy="62" r="13" fill="#0A0F1D" />
            {/* Glossy White Reflections */}
            <circle cx="48.5" cy="56.5" r="4.2" fill="#FFFFFF" />
            <circle cx="56.5" cy="66.5" r="1.8" fill="#FFFFFF" />

            {/* Right Eye Sockets & Pupil */}
            <circle cx="98" cy="62" r="17.5" fill="#E2E8F0" />
            <circle cx="98" cy="62" r="16.5" fill="none" stroke="#38BDF8" strokeWidth="2.5" filter="url(#glowEffect)" />
            <circle cx="98" cy="62" r="13" fill="#0A0F1D" />
            {/* Glossy White Reflections */}
            <circle cx="94.5" cy="56.5" r="4.2" fill="#FFFFFF" />
            <circle cx="102.5" cy="66.5" r="1.8" fill="#FFFFFF" />
          </motion.g>

          {/* Closed Eyes Group (Shown on password focus) */}
          <motion.g
            animate={isPasswordFocused ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Left Closed Eye (Cyan Arch) */}
            <path d="M 45 62 Q 52 68 59 62" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glowEffect)" />
            {/* Right Closed Eye (Cyan Arch) */}
            <path d="M 91 62 Q 98 68 105 62" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" fill="none" filter="url(#glowEffect)" />
          </motion.g>

          {/* Mouth (Smiling Curve on White Face) */}
          <path d="M 67 79 Q 75 86 83 79" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* ARMS (Left and Right - Path Morphing) */}
          <motion.path 
            variants={leftArmVariants}
            animate={handState}
            initial="idle"
            transition={{ type: 'spring' as const, stiffness: 120, damping: 15 }}
            stroke="#CBD5E1" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          <motion.path 
            variants={rightArmVariants}
            animate={handState}
            initial="idle"
            transition={{ type: 'spring' as const, stiffness: 120, damping: 15 }}
            stroke="#CBD5E1" 
            strokeWidth="5.5" 
            strokeLinecap="round" 
            fill="none" 
          />

          {/* HANDS (Left and Right - Translations) */}
          {/* Left Hand Glove (White with Blue Cuff) */}
          <motion.g
            variants={leftHandVariants}
            animate={handState}
            initial="idle"
            transition={{ type: 'spring' as const, stiffness: 120, damping: 15 }}
          >
            <circle cx="0" cy="0" r="7" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M -3 -3.5 Q -6 -1.5 -2 2" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M 2.5 -2.5 Q 5 -0.5 1.5 3" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="-4.5" y="3.5" width="9" height="3" rx="1" fill="url(#robotBlueAccent)" />
          </motion.g>

          {/* Right Hand Glove (White with Blue Cuff) */}
          <motion.g
            variants={rightHandVariants}
            animate={handState}
            initial="idle"
            transition={{ type: 'spring' as const, stiffness: 120, damping: 15 }}
          >
            <circle cx="0" cy="0" r="7" fill="#F1F5F9" stroke="#E2E8F0" strokeWidth="1.5" />
            <path d="M 2.5 -3.5 Q 5 -1.5 1.5 2" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M -3 -2.5 Q -5.5 -0.5 -2 3" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="-4.5" y="3.5" width="9" height="3" rx="1" fill="url(#robotBlueAccent)" />
          </motion.g>

        </svg>
      </motion.div>
    </div>
  );
};

export default LoginMascot;

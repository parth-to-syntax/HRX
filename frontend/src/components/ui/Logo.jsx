import React from 'react';

const Logo = ({ className = "h-8 w-auto", white = false }) => {
  return (
    <svg 
      viewBox="0 0 600 400" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* H */}
      <path 
        d="M 60 100 L 60 300 M 60 200 L 140 200 M 140 100 L 140 300" 
        stroke={white ? "white" : "currentColor"} 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* R with arrow */}
      <path 
        d="M 180 100 L 180 300 M 180 100 L 260 100 Q 300 100 300 150 Q 300 180 280 190 L 180 190 M 280 190 L 320 300" 
        stroke={white ? "white" : "currentColor"} 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Arrow inside R */}
      <path 
        d="M 220 150 L 280 150 M 270 140 L 280 150 L 270 160" 
        stroke={white ? "white" : "currentColor"} 
        strokeWidth="16" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* X */}
      <path 
        d="M 360 100 L 480 300 M 480 100 L 360 300" 
        stroke={white ? "white" : "currentColor"} 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* Decorative elements */}
      <circle 
        cx="520" 
        cy="140" 
        r="10" 
        fill={white ? "white" : "currentColor"} 
      />
      <circle 
        cx="540" 
        cy="160" 
        r="8" 
        fill={white ? "white" : "currentColor"} 
        opacity="0.7"
      />
      <circle 
        cx="520" 
        cy="180" 
        r="6" 
        fill={white ? "white" : "currentColor"} 
        opacity="0.5"
      />
    </svg>
  );
};

export default Logo;

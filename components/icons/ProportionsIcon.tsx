import React from 'react';

export const ProportionsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 2a10 10 0 0 0-9 12.75c.34.78 1.4 1.25 2 1.25h14c.6 0 1.66-.47 2-1.25A10 10 0 0 0 12 2Z"/>
    <line x1="4" y1="8" x2="20" y2="8" strokeDasharray="2 2"/>
    <line x1="4" y1="16" x2="20"y2="16" strokeDasharray="2 2"/>
  </svg>
);

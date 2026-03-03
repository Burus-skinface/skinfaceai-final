import React from 'react';

export const SymmetryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 3v18" strokeDasharray="4 4" />
    <path d="M19 16s-1.5-3-7-5.5" />
    <path d="M5 16s1.5-3 7-5.5" />
    <path d="M19 8s-1.5 3-7 5.5" />
    <path d="M5 8s1.5 3 7 5.5" />
  </svg>
);

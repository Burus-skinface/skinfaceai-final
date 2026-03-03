import React from 'react';

export const NoseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M12 2a4 4 0 0 0-4 4v1.5a2.5 2.5 0 0 1-5 0V7a4 4 0 0 1 8 0v1.5a2.5 2.5 0 0 0 5 0V7a4 4 0 0 1 8 0v.5a2.5 2.5 0 0 1-5 0V6a4 4 0 0 0-4-4Z" />
    <path d="M12 14c-2.5 0-4.5 2-4.5 4.5S9.5 22 12 22s4.5-2 4.5-3.5-2-4.5-4.5-4.5Z" />
  </svg>
);

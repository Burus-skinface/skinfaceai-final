import React from 'react';

export const SpectrumIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M5 12C5 7.02944 7.02944 5 12 5" />
    <path d="M5 12C5 16.9706 7.02944 19 12 19" />
    <path d="M12 5C16.9706 5 19 7.02944 19 12" />
    <path d="M12 19C16.9706 19 19 16.9706 19 12" />
  </svg>
);

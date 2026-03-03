import React from 'react';

export const JawIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
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
    <path d="M11 12.5a.5.5 0 0 1-1 0V12a.5.5 0 0 1 1 0v.5Z" />
    <path d="M15 12.5a.5.5 0 0 1-1 0V12a.5.5 0 0 1 1 0v.5Z" />
    <path d="M19.5 13.5a.5.5 0 0 1-1 0V12a.5.5 0 0 1 1 0v1.5Z" />
    <path d="M4 19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3Z" />
    <path d="M17.8 14.2C17 12.4 15.6 11 14 11h-4c-1.6 0-3 1.4-3.8 3.2" />
    <path d="M4 14c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

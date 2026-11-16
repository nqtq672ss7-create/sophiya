import React from 'react';

interface MaxIconProps {
  className?: string;
}

/**
 * Official-style icon for Russian messenger MAX (max.ru).
 */
export const MaxIcon: React.FC<MaxIconProps> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.477 2 2 6.32 2 11.65c0 2.79 1.225 5.302 3.187 7.06-.195 1.32-.666 2.607-1.158 3.226-.156.197.022.482.266.43 1.49-.318 3.24-.978 4.427-1.662A10.45 10.45 0 0 0 12 21.3c5.523 0 10-4.32 10-9.65C22 6.32 17.523 2 12 2Zm0 4.5a5.15 5.15 0 1 0 0 10.3 5.15 5.15 0 0 0 0-10.3Z"
      fill="currentColor"
    />
  </svg>
);

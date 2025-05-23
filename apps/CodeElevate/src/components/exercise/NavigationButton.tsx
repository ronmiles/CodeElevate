import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NavigationButtonProps {
  direction: 'next' | 'previous';
  onClick: () => void;
  disabled: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({
  direction,
  onClick,
  disabled,
}) => {
  const isNext = direction === 'next';
  const Icon = isNext ? ChevronRight : ChevronLeft;
  const position = isNext ? 'right-16' : 'left-16';
  const label = isNext ? 'Next' : 'Previous';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`fixed ${position} top-1/2 -translate-y-1/2 z-10 flex flex-col items-center ${
        disabled
          ? 'opacity-0 cursor-default pointer-events-none'
          : 'text-text-secondary hover:text-text transition-all duration-200'
      }`}
      aria-label={`${label} Exercise`}
    >
      <div className="bg-gray-800 hover:bg-gray-700 p-3 rounded-full shadow-lg mb-2">
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
};

export default NavigationButton;

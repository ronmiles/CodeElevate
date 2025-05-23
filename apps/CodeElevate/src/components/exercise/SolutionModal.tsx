import React from 'react';
import { Info } from 'lucide-react';

interface SolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const SolutionModal: React.FC<SolutionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-md mx-4 w-full overflow-hidden transform transition-all border border-gray-700">
        <div className="bg-gray-900 px-6 py-4 border-b border-gray-700">
          <h3 className="text-lg font-medium text-gray-100 flex items-center">
            <Info className="h-5 w-5 mr-2 text-indigo-400" />
            View Example Solution?
          </h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-text-secondary">
            Are you sure you want to view the solution? We recommend trying to
            solve it yourself first for better learning.
          </p>
        </div>
        <div className="bg-gray-900 px-6 py-3 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-indigo-700 text-white rounded-lg hover:bg-indigo-600"
          >
            Show Solution
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolutionModal;

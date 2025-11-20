
import React from 'react';

interface ConfirmationModalProps {
  message: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmButtonClass?: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  description,
  confirmText = '삭제',
  cancelText = '취소',
  onConfirm,
  onCancel,
  confirmButtonClass = 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-red-500',
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-2">{message}</h2>
          {description && <p className="text-sm text-gray-600 mb-6">{description}</p>}
        </div>
        <div className="flex justify-end items-center p-4 bg-gray-100 rounded-b-lg gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={confirmButtonClass}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

'use client';

import { useState, useCallback } from 'react';

interface ModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export const useModal = () => {
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showModal = useCallback(
    (
      message: string,
      type: 'success' | 'error' | 'warning' | 'info' = 'info',
      options?: {
        title?: string;
        onConfirm?: () => void;
        confirmText?: string;
        cancelText?: string;
      }
    ) => {
      setModalState({
        isOpen: true,
        message,
        type,
        title: options?.title,
        onConfirm: options?.onConfirm,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
      });
    },
    []
  );

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    modalState,
    showModal,
    closeModal,
  };
};

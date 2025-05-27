'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 'createProject' | 'github' | 'projectInfo';

interface ModalContextType {
  isOpen: Record<ModalType, boolean>;
  projectName: string;
  openModal: (type: ModalType) => void;
  closeModal: (type: ModalType) => void;
  setProjectName: (name: string) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function ModalProvider({ children }: { children: ReactNode }) {
  const [projectName, setProjectName] = useState<string>('');
  const [isOpen, setIsOpen] = useState<Record<ModalType, boolean>>({
    createProject: false,
    github: false,
    projectInfo: false,
  });

  const openModal = (type: ModalType) => {
    setIsOpen((prev) => ({ ...prev, [type]: true }));
  };

  const closeModal = (type: ModalType) => {
    setIsOpen((prev) => ({ ...prev, [type]: false }));
  };

  return (
    <ModalContext.Provider
      value={{
        isOpen,
        openModal,
        closeModal,
        projectName,
        setProjectName,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

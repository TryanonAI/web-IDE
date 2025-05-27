'use client';

import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import RestrictedAccessView from '@/components/dashboard/RestrictedAccessView';

interface AccessRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AccessRequiredModal({
  isOpen,
  onClose,
}: AccessRequiredModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-description="Access Required" className="sm:max-w-md">
        <RestrictedAccessView 
          containerClassName="py-4"
          isModal={true}
          onRequestSuccess={onClose}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

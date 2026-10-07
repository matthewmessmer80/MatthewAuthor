import React, { useEffect } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export interface AdminDeleteDialogProps {
  isOpen: boolean;
  itemTitle: string;
  itemType?: string; // e.g. "Book", "News & Dispatch", "Gallery Item", "Character", "Lore Entry"
  description?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}

export const AdminDeleteDialog: React.FC<AdminDeleteDialogProps> = ({
  isOpen,
  itemTitle,
  itemType,
  description,
  isDeleting,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="relative w-full max-w-md bg-[#11131c] border border-red-900/60 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-4">
        {/* Warning Icon & Heading */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-950/80 border border-red-700/50 flex items-center justify-center shrink-0 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              id="delete-dialog-title"
              className="text-base font-cinzel font-bold text-[#f5efeb] truncate"
            >
              Delete "{itemTitle}"?
            </h3>
            {itemType && (
              <span className="text-[10px] uppercase font-cinzel text-red-400/90 font-semibold tracking-wider">
                Permanent {itemType} Deletion
              </span>
            )}
          </div>
        </div>

        {/* Highlighted item title quote */}
        <div className="p-3 bg-[#181114] border border-red-900/40 rounded-lg text-sm font-cinzel font-bold text-[#f5efeb] break-words">
          "{itemTitle}"
        </div>

        {/* Warning message */}
        <div className="space-y-1">
          <p className="text-xs text-red-400 font-semibold">
            This action cannot be undone.
          </p>
          {description && (
            <p className="text-xs text-[#a8a396] leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* Action buttons: Cancel | Delete */}
        <div className="border-t border-[#232635] pt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 bg-[#171924] hover:bg-[#202332] text-xs font-cinzel text-[#a8a396] hover:text-[#f5efeb] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-cinzel font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-red-950 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

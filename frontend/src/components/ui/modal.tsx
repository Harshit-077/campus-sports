"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Centered dialog on desktop, bottom sheet on phones. Built on the native <dialog> element. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose(); // click on the dimmed backdrop
      }}
      className="modal m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 text-on-surface max-sm:mb-0 max-sm:mt-auto max-sm:w-full max-sm:max-w-none max-sm:rounded-b-none"
    >
      <div className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-display text-headline-md text-primary">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 shrink-0 place-items-center rounded-lg text-on-surface-variant hover:bg-tertiary-fixed"
          >
            <X className="size-5" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}

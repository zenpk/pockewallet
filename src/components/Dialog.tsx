import { type ReactNode, useEffect, useRef } from "react";

export type DialogProps = {
  title: string;
  submit: () => Promise<boolean> | boolean;
  children: ReactNode;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export function Dialog(props: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (props.isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!props.isOpen && dialog.open) {
      dialog.close();
    }
  }, [props.isOpen]);

  return (
    <dialog
      ref={ref}
      onClose={props.onClose}
      onClick={(e) => {
        if (e.target === ref.current) props.onClose();
      }}
    >
      <div className="dialog-header">
        <span>{props.title}</span>
        <button
          type="button"
          className="dialog-close-btn"
          onClick={props.onClose}
          aria-label="Close"
        >
          &#x2715;
        </button>
      </div>
      <div className="dialog-body">{props.children}</div>
      <div className="dialog-footer">
        <button type="button" className="btn btn-gray" onClick={props.onClose}>
          Close
        </button>
        <button
          type="button"
          className="btn btn-blue"
          onClick={async () => {
            const result = await props.submit();
            if (result) {
              props.onClose();
            }
          }}
        >
          Confirm
        </button>
      </div>
    </dialog>
  );
}

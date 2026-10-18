import { useCallback, useEffect, useState } from "react";

interface Flash {
  id: number;
  text: string;
}

/** Aviso breve que se ve aunque la persona esté abajo en la página. */
export function useFlash() {
  const [flash, setFlash] = useState<Flash | null>(null);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), 2800);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const show = useCallback((text: string) => setFlash({ id: Date.now(), text }), []);
  return [flash, show] as const;
}

export function Toast({ flash }: { flash: Flash | null }) {
  return (
    <div className="toast-dock" role="status" aria-live="polite">
      {flash && (
        <p className="toast" key={flash.id}>
          {flash.text}
        </p>
      )}
    </div>
  );
}

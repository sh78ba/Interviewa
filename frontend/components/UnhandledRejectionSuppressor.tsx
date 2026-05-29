"use client";
import { useEffect } from "react";

export default function UnhandledRejectionSuppressor() {
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      try {
        const reason = event.reason as any;
        const msg =
          (reason &&
            (reason.message || (reason.toString && reason.toString()))) ||
          (typeof reason === "string" ? reason : "");
        if (msg && /canceled/i.test(msg.toString())) {
          event.preventDefault();
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener("unhandledrejection", handler as EventListener);
    return () =>
      window.removeEventListener(
        "unhandledrejection",
        handler as EventListener,
      );
  }, []);

  return null;
}

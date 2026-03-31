if (typeof AbortSignal !== 'undefined' && !(AbortSignal as any).any) {
  (AbortSignal as any).any = function any(signals: AbortSignal[]) {
    const controller = new AbortController();

    const onAbort = () => {
      if (!controller.signal.aborted) {
        controller.abort();
      }
      cleanup();
    };

    const cleanup = () => {
      for (const signal of signals) {
        signal.removeEventListener?.('abort', onAbort);
      }
    };

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        return controller.signal;
      }
      signal.addEventListener?.('abort', onAbort, { once: true });
    }

    return controller.signal;
  };
}

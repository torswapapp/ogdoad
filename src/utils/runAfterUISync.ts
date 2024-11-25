export const syncUI = () => new Promise(r => requestAnimationFrame(r));

export const runAfterUISync = async <T>(callback: (...args: unknown[]) => T, syncFrames = 1) => {
  for (let i = 0; i < syncFrames; i++) {
    await syncUI();
  }
  return callback();
};

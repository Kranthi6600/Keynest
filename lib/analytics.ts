const ENDPOINT = "https://metrics.keynest.app";

type TrackEvent = "install" | "unlock" | "export";

function ping(event: TrackEvent) {
  try {
    const body = new Blob(["1"], { type: "text/plain" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${ENDPOINT}/${event}`, body);
    } else {
      fetch(`${ENDPOINT}/${event}`, { method: "POST", keepalive: true }).catch(
        () => {},
      );
    }
  } catch {}
}

export const trackInstall = () => ping("install");
export const trackExport = () => ping("export");

export function trackUnlockOncePerDay() {
  const today = new Date().toISOString().slice(0, 10);
  try {
    if (localStorage.getItem("keynest:lastUnlockPing") === today) return;
    localStorage.setItem("keynest:lastUnlockPing", today);
  } catch {}
  ping("unlock");
}

"use client";

type CapturedRequest = {
  url: string;
  method: string;
  headers: Record<string, string>;
  status?: number;
  responseBody?: string;
};

let captured: CapturedRequest[] = [];
let patched = false;

export function patchFetchForDebug() {
  if (patched || typeof window === "undefined") return;
  patched = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (...args: Parameters<typeof fetch>) => {
    const [input, init] = args;
    const url = typeof input === "string" ? input : (input as Request).url;

    let entry: CapturedRequest | null = null;
    if (url.includes("supabase.co")) {
      const headersObj: Record<string, string> = {};
      try {
        const h = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
        h.forEach((value, key) => {
          if (key.toLowerCase() === "authorization") {
            headersObj[key] = value ? `${value.slice(0, 25)}… (Länge: ${value.length})` : "(leer)";
          } else if (key.toLowerCase() === "apikey") {
            headersObj[key] = value ? `${value.slice(0, 15)}…` : "(leer)";
          } else {
            headersObj[key] = value;
          }
        });
      } catch (e) {
        headersObj["_fehler"] = String(e);
      }
      entry = { url, method: init?.method || "GET", headers: headersObj };
      captured = [entry, ...captured].slice(0, 8);
    }

    const res = await originalFetch(...args);

    if (entry) {
      entry.status = res.status;
      try {
        entry.responseBody = await res.clone().text();
      } catch {
        entry.responseBody = "(konnte Antwort nicht lesen)";
      }
    }

    return res;
  };
}

export function getCapturedRequests(): CapturedRequest[] {
  return captured;
}

export function getLastRequestTo(pathIncludes: string): CapturedRequest | undefined {
  return captured.find((c) => c.url.includes(pathIncludes));
}

type FetchJsonOptions = RequestInit & {
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 12000;

export async function fetchJson<T>(
  url: string,
  init?: FetchJsonOptions,
): Promise<T> {
  const timeoutMs = init?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      credentials: "include",
      ...init,
      signal: controller.signal,
    });
    if (!res.ok)
      throw new Error(`${init?.method ?? "GET"} ${url}: ${res.status}`);
    return res.json();
  } catch (err) {
    if ((err as Error).name === "AbortError") {
      throw new Error(`${init?.method ?? "GET"} ${url}: timeout`);
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

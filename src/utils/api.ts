export async function fetchJson<T>(
  url: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok)
    throw new Error(`${init?.method ?? "GET"} ${url}: ${res.status}`);
  return res.json();
}

export function postJson<T>(url: string, body: unknown): Promise<T> {
  return fetchJson<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

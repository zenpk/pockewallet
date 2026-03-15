const KEY = "RecentDescriptions";
const MAX = 100;

export namespace RecentDescriptions {
  export function read(): string[] {
    const data = localStorage.getItem(KEY);
    return data ? JSON.parse(data) : [];
  }

  export function add(description: string) {
    const trimmed = description.trim();
    if (!trimmed) return;
    const list = read().filter((d) => d !== trimmed);
    list.unshift(trimmed);
    if (list.length > MAX) list.length = MAX;
    localStorage.setItem(KEY, JSON.stringify(list));
  }
}

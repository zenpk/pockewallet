import { STORE_SYNONYMS } from "../utils/consts";
import { normalizeForSearch } from "../utils/utils";

export namespace Synonyms {
  export type SynonymGroup = {
    id: string;
    words: string[];
  };

  export function readAll(): SynonymGroup[] {
    const storage = localStorage.getItem(STORE_SYNONYMS);
    if (!storage) {
      return [];
    }
    return JSON.parse(storage) as SynonymGroup[];
  }

  export function readById(id: string): SynonymGroup | undefined {
    return readAll().find((group) => group.id === id);
  }

  export function write(data: SynonymGroup) {
    const groups = readAll();
    const index = groups.findIndex((g) => g.id === data.id);
    if (index !== -1) {
      groups[index] = data;
    } else {
      groups.push(data);
    }
    localStorage.setItem(STORE_SYNONYMS, JSON.stringify(groups));
  }

  export function remove(id: string) {
    const groups = readAll().filter((g) => g.id !== id);
    localStorage.setItem(STORE_SYNONYMS, JSON.stringify(groups));
  }

  export function writeAll(groups: SynonymGroup[]) {
    localStorage.setItem(STORE_SYNONYMS, JSON.stringify(groups));
  }

  /**
   * Recursively expand a search string through synonym groups.
   * Uses substring matching (kana-insensitive): if a search term is a
   * substring of any word in a group, all words from that group become
   * additional search terms. Repeats until no new terms are found.
   */
  export function expandSearch(searchString: string): string[] {
    const groups = readAll();
    const result = new Set<string>();
    result.add(searchString);

    const processedGroupIds = new Set<string>();
    const queue: string[] = [searchString];

    while (queue.length > 0) {
      const term = queue.shift()!;
      const normalizedTerm = normalizeForSearch(term);

      for (const group of groups) {
        if (processedGroupIds.has(group.id)) continue;
        const matches = group.words.some((w) =>
          normalizeForSearch(w).includes(normalizedTerm),
        );
        if (matches) {
          processedGroupIds.add(group.id);
          for (const word of group.words) {
            if (!result.has(word)) {
              result.add(word);
              queue.push(word);
            }
          }
        }
      }
    }

    return Array.from(result);
  }
}

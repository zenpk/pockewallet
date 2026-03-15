import { STORE_SYNONYMS } from "../utils/consts";

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
   * Given a search string, returns all synonym words that should also match.
   * E.g. if group = ["abc", "abcd", "acb"] and searchString = "abc",
   * returns ["abc", "abcd", "acb"].
   */
  export function expandSearch(searchString: string): string[] {
    const lower = searchString.toLowerCase();
    const groups = readAll();
    const result = new Set<string>();
    result.add(searchString);
    for (const group of groups) {
      const lowerWords = group.words.map((w) => w.toLowerCase());
      if (lowerWords.includes(lower)) {
        for (const word of group.words) {
          result.add(word);
        }
      }
    }
    return Array.from(result);
  }
}

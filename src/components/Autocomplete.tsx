import { useEffect, useMemo, useRef, useState } from "react";
import { Synonyms } from "../localStorage/synonyms";
import { normalizeForSearch } from "../utils/utils";

type Props = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  placeholder?: string;
};

export function Autocomplete({
  id,
  value,
  onChange,
  suggestions,
  className,
  placeholder,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = useMemo(() => {
    const trimmed = value.trim();
    if (!trimmed) return suggestions;
    const expandedTerms = Synonyms.expandSearch(trimmed);
    const normalizedTerms = expandedTerms.map(normalizeForSearch);
    return suggestions.filter((s) => {
      const norm = normalizeForSearch(s);
      return normalizedTerms.some((term) => norm.includes(term));
    });
  }, [value, suggestions]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: need to clear active index when value changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayItems = useMemo(
    () => filtered.slice(0, 20).reverse(),
    [filtered],
  );

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open]);

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function select(val: string) {
    onChange(val);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || displayItems.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % displayItems.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? displayItems.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < displayItems.length) {
          e.preventDefault();
          select(displayItems[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={wrapperRef} className="autocomplete">
      <input
        id={id}
        className={className}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />
      {open && displayItems.length > 0 && (
        <ul ref={listRef} className="autocomplete-list">
          {displayItems.map((s, i) => (
            <li
              key={s}
              className={`autocomplete-item${i === activeIndex ? " active" : ""}`}
              onMouseDown={() => select(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

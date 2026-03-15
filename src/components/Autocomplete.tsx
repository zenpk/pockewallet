import { useEffect, useRef, useState } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  className?: string;
  placeholder?: string;
};

export function Autocomplete({
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

  const filtered = value.trim()
    ? suggestions.filter((s) =>
        s.toLowerCase().includes(value.trim().toLowerCase()),
      )
    : suggestions;

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
    if (!open || filtered.length === 0) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % filtered.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? filtered.length - 1 : i - 1));
        break;
      case "Enter":
        if (activeIndex >= 0 && activeIndex < filtered.length) {
          e.preventDefault();
          select(filtered[activeIndex]);
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
      {open && filtered.length > 0 && (
        <ul ref={listRef} className="autocomplete-list">
          {filtered.slice(0, 20).map((s, i) => (
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

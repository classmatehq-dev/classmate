"use client";

import {
  type ComponentProps,
  useRef,
  useState,
} from "react";

import { Avatar, cx } from "@/components/ui";
import { useClassMembers } from "@/lib/api/hooks";

type Props = Omit<ComponentProps<"textarea">, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  classId: string | undefined;
};

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-base text-navy placeholder:text-muted focus:border-brand-blue focus:outline-none";

/** Textarea with `@` autocomplete over the class's members. */
export function MentionInput({
  value,
  onChange,
  classId,
  className,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const members = useClassMembers(classId);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  const matches =
    query === null
      ? []
      : (members.data ?? [])
          .filter((m) =>
            m.username.toLowerCase().startsWith(query.toLowerCase()),
          )
          .slice(0, 6);

  function sync(el: HTMLTextAreaElement) {
    const upto = el.value.slice(0, el.selectionStart ?? el.value.length);
    const m = upto.match(/(?:^|\s)@(\w{0,20})$/);
    setQuery(m ? m[1] : null);
    setActive(0);
  }

  function pick(username: string) {
    const el = ref.current;
    if (!el) return;
    const caret = el.selectionStart ?? value.length;
    const before = value.slice(0, caret).replace(/@(\w{0,20})$/, `@${username} `);
    const next = before + value.slice(caret);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      const pos = before.length;
      el.setSelectionRange(pos, pos);
    });
  }

  const open = query !== null && matches.length > 0;

  return (
    <div className="relative">
      <textarea
        {...rest}
        ref={ref}
        value={value}
        className={cx(inputClass, "min-h-[96px] resize-y", className)}
        onChange={(e) => {
          onChange(e.target.value);
          sync(e.target);
        }}
        onKeyUp={(e) => sync(e.currentTarget)}
        onClick={(e) => sync(e.currentTarget)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (a + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (a - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault();
            pick(matches[active].username);
          } else if (e.key === "Escape") {
            setQuery(null);
          }
        }}
        onBlur={() => setTimeout(() => setQuery(null), 120)}
        {...rest}
      />

      {open && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-xl border border-border bg-surface py-1 shadow-lg">
          {matches.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(m.username);
                }}
                className={cx(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                  i === active ? "bg-light-blue" : "hover:bg-light-blue/60",
                )}
              >
                <Avatar username={m.username} src={m.avatarUrl} size={22} />
                <span className="font-semibold text-navy">@{m.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

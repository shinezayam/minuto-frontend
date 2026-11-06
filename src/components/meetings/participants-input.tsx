"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Users, X } from "lucide-react";
import { api } from "@/lib/api";
import type { Contact } from "@/lib/types";

const same = (a: string, b: string) => a.trim().toLocaleLowerCase("mn") === b.trim().toLocaleLowerCase("mn");

/**
 * Хурлын оролцогчдыг оруулах. Өмнө нь оруулсан хүмүүс (сервер дээр хадгалагдсан) доор санал болгогдоно —
 * байнга хамт хурал хийдэг хүмүүсээ дахин бичихгүй, нэг дараад нэмнэ.
 */
export function ParticipantsInput({
  value,
  onChange,
  disabled,
  id = "participants",
}: {
  value: string[];
  onChange: (names: string[]) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [draft, setDraft] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    api
      .listContacts()
      .then((r) => setContacts(r.contacts))
      .catch(() => {}); // санал болгохгүй байсан ч гараар оруулж болно
  }, []);

  const add = (raw: string) => {
    const names = raw
      .split(/[,;\n]/)
      .map((n) => n.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    const next = [...value];
    for (const n of names) if (!next.some((v) => same(v, n))) next.push(n);
    if (next.length !== value.length) onChange(next);
    setDraft("");
  };

  const remove = (name: string) => onChange(value.filter((v) => v !== name));

  const forgetContact = async (c: Contact) => {
    setContacts((cs) => cs.filter((x) => x.id !== c.id));
    api.deleteContact(c.id).catch(() => {});
  };

  const suggestions = useMemo(() => {
    const q = draft.trim().toLocaleLowerCase("mn");
    return contacts
      .filter((c) => !value.some((v) => same(v, c.name)))
      .filter((c) => !q || c.name.toLocaleLowerCase("mn").includes(q))
      .slice(0, 12);
  }, [contacts, value, draft]);

  return (
    <div>
      <div
        className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input px-2 py-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 ${
          disabled ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {value.map((name) => (
          <span
            key={name}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 py-0.5 pl-2 pr-1 text-sm text-primary"
          >
            {name}
            <button
              type="button"
              onClick={() => remove(name)}
              className="rounded p-0.5 hover:bg-primary/20"
              aria-label={`${name}-г хасах`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={disabled}
          maxLength={100}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,;]/.test(v)) add(v);
            else setDraft(v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (draft.trim()) add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length ? "Нэмэх..." : "Нэр бичээд Enter дарна уу"}
          className="h-7 min-w-[10rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      {suggestions.length > 0 && (
        <div className="mt-2">
          <p className="mb-1.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            Өмнөх оролцогчид — дарж нэмнэ
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((c) => (
              <span key={c.id} className="group inline-flex items-center rounded-md border border-border text-sm">
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => add(c.name)}
                  className="inline-flex items-center gap-1 py-0.5 pl-2 pr-1.5 hover:text-primary"
                >
                  <Plus className="h-3 w-3" />
                  {c.name}
                </button>
                <button
                  type="button"
                  onClick={() => forgetContact(c)}
                  className="hidden border-l border-border px-1 py-0.5 text-muted-foreground hover:text-destructive group-hover:inline-flex"
                  title="Жагсаалтаас устгах"
                  aria-label={`${c.name}-г жагсаалтаас устгах`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

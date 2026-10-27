"use client";

import { useState } from "react";
import { Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import type { AnswerStyleDto } from "./types";

interface Props {
  styles: AnswerStyleDto[];
  onChanged: () => Promise<void> | void;
  onError: (msg: string) => void;
}

const inputCls =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-caramel focus:ring-2 focus:ring-caramel/20";

export function ManageStylesDialog({ styles, onChanged, onError }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditingId(null);
    setName("");
    setInstruction("");
  };

  async function call(method: string, url: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong.");
      await onChanged();
      return true;
    } catch (e) {
      onError(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    if (!name.trim()) return;
    const ok = editingId
      ? await call("PUT", "/api/styles", { id: editingId, name, instruction })
      : await call("POST", "/api/styles", { name, instruction });
    if (ok) reset();
  }

  return (
    <Dialog onOpenChange={(o) => !o && reset()}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Manage Styles</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle className="text-lg font-semibold">Manage answer styles</DialogTitle>
        <DialogDescription className="mt-1 text-sm text-gray-500">
          Add, edit or delete the styles Halvi can answer in.
        </DialogDescription>

        <ul className="mt-4 space-y-2">
          {styles.map((s) => (
            <li key={s.id} className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.name}</p>
                <p className="truncate text-xs text-gray-500">{s.instruction}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${s.name}`}
                  onClick={() => {
                    setEditingId(s.id);
                    setName(s.name);
                    setInstruction(s.instruction);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="danger"
                  size="icon"
                  aria-label={`Delete ${s.name}`}
                  disabled={busy || styles.length <= 1}
                  onClick={() => call("DELETE", `/api/styles?id=${encodeURIComponent(s.id)}`)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
          <p className="text-sm font-medium">{editingId ? "Edit style" : "Add a style"}</p>
          <input className={inputCls} placeholder="Style name" value={name} onChange={(e) => setName(e.target.value)} />
          <textarea
            className={inputCls}
            rows={2}
            placeholder="Instruction (e.g. short and simple, detailed, tips for bakers)"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            {editingId && (
              <Button variant="secondary" onClick={reset}>
                Cancel
              </Button>
            )}
            <Button onClick={save} disabled={busy || !name.trim()}>
              <Plus className="h-4 w-4" />
              {editingId ? "Save" : "Add"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

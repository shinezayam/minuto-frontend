"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { api, friendlyError } from "@/lib/api";
import { updateStoredUser, type AuthUser } from "@/lib/auth";

/** Хэрэглэгчийн нэрийг засах цонх — хурлын тэмдэглэлд "Хөтөлсөн: Minuto / <нэр>" гэж гарна */
export function ProfileNameDialog({
  user,
  open,
  onOpenChange,
}: {
  user: AuthUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Цонх нээгдэх бүрт шинээр mount хийгдэж, одоогийн нэрээр эхэлнэ */}
        {open && <NameForm user={user} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function NameForm({ user, onDone }: { user: AuthUser; onDone: () => void }) {
  const [name, setName] = useState(user.name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      updateStoredUser(await api.updateMe(name.trim()));
      onDone();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Таны нэр</DialogTitle>
        <DialogDescription>
          Хурлын тэмдэглэлд &quot;Хөтөлсөн: Minuto / {name.trim() || user.email}&quot; гэж гарна.
        </DialogDescription>
      </DialogHeader>
      <Input
        autoFocus
        value={name}
        maxLength={100}
        onChange={(e) => setName(e.target.value)}
        placeholder="Жишээ нь: Б. Болд"
        className="h-10"
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Хадгалах
        </Button>
      </DialogFooter>
    </form>
  );
}

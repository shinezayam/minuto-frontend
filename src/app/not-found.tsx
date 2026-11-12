import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="font-display text-4xl font-bold tracking-tight">404</h1>
        <p className="mt-2 text-lg font-medium">Хуудас олдсонгүй</p>
        <p className="mt-2 text-muted-foreground">
          Таны хайж буй хуудас байхгүй эсвэл зөөгдсөн байж магадгүй.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="gap-2 rounded-full">
            <Link href="/">
              <Home className="h-4 w-4" />
              Нүүр хуудас
            </Link>
          </Button>
          <Button variant="outline" asChild className="gap-2 rounded-full">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Mic, Upload, ArrowRight, Clock, Shield, FileText } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Хурлаа бичиж,{" "}
              <span className="text-primary">AI-р хурлын бичиг</span> үүсгээрэй
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Монгол хэлний хурлын AI туслах. Хурлаа бичиж, автомат хурлын
              бичиг, шийдвэр, үүрэг даалгавар үүсгээрэй.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/meetings/new/live"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl"
              >
                <Mic className="h-5 w-5" />
                Шууд хурал бичих
              </Link>
              <Link
                href="/upload"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-card px-8 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-accent"
              >
                <Upload className="h-5 w-5" />
                Аудио файл оруулах
              </Link>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="border-t border-border bg-muted/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">
              Хэрхэн ажилладаг вэ?
            </h2>
            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              <StepCard
                step={1}
                icon={<Mic className="h-6 w-6" />}
                title="Хурлаа бичнэ"
                description="Микрофоноо ашиглан хурлаа шууд бичнэ. Браузер дээр ажиллана."
              />
              <StepCard
                step={2}
                icon={<FileText className="h-6 w-6" />}
                title="AI боловсруулна"
                description="AI автоматаар хурлын бичиг, шийдвэр, үүрэг даалгавар үүсгэнэ."
              />
              <StepCard
                step={3}
                icon={<ArrowRight className="h-6 w-6" />}
                title="Татаж авна"
                description="Хурлын бичгийг засварлаж, DOCX форматаар татаж авна."
              />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Mic className="h-5 w-5 text-primary" />}
              title="Шууд бичлэг"
              description="Браузер дээр шууд микрофон бичлэг. Хурлын явцад бичвэр харна."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-primary" />}
              title="Хувийн байдлын хамгаалалт"
              description="Таны бичлэг болон бичвэр зөвхөн танд хадгалагдана."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-primary" />}
              title="Цаг хэмнэнэ"
              description="Хурлын бичиг автоматаар үүсч, цаг хугацаа хэмнэнэ."
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          © 2026 Mongolian AI Minutes. Hackathon MVP.
        </div>
      </footer>
    </>
  );
}

function StepCard({
  step,
  icon,
  title,
  description,
}: {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
        {step}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

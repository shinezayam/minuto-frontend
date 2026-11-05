import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  FileDown,
  GraduationCap,
  Link2,
  ListChecks,
  Lock,
  MonitorSpeaker,
  Mic,
  Upload,
  Users,
} from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { LandingNav } from "@/components/landing/landing-nav";

export default function HomePage() {
  return (
    <>
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <Highlights />
        <HowItWorks />
        <Features />
        <MinutesShowcase />
        <UseCases />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Арын фон: зөөлөн өнгөт туяа + нарийн тор */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-12rem] h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,oklch(0.75_0.12_264/0.35),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,oklch(0.5_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(0.5_0_0/0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pb-28">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            <LogoMark animated className="h-3 text-primary" />
            Монгол хэлэнд зориулсан хурлын AI туслах
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
            Хурлаа ярилц.
            <br />
            <span className="bg-gradient-to-r from-primary to-[oklch(0.55_0.2_290)] bg-clip-text text-transparent">
              Тэмдэглэлийг Minuto хөтөлнө.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Minuto хурлыг тань бичиж, яриаг текст болгоод хураангуй, шийдвэр, үүрэг даалгавар бүхий
            хурлын тэмдэглэлийг хэдхэн минутад бэлдэнэ. Та зөвхөн ярилцахад анхаарлаа хандуулна.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login?mode=register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-7 text-base font-semibold text-background shadow-lg shadow-foreground/10 transition-opacity hover:opacity-90"
            >
              Эхлэх
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-background px-7 text-base font-semibold transition-colors hover:bg-muted"
            >
              Хэрхэн ажилладгийг үзэх
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Суулгах шаардлагагүй, хөтөч дээр", "Шууд болон бичлэгээс", "Word (DOCX) татах"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ProductMockup />
      </div>
    </section>
  );
}

/** Бүтээгдэхүүний жишээ дэлгэц — шууд бичвэр → AI тэмдэглэл. Агуулга нь жишээ. */
function ProductMockup() {
  const lines = [
    { t: "00:12", text: "Шинэ хувилбарыг ирэх даваа гаригт гаргая гэж санал болгож байна." },
    { t: "00:21", text: "Тест бараг дууссан. Баасан гараг гэхэд Сараа тайлангаа бэлдээрэй." },
    { t: "00:34", text: "Үнийн бодлогыг дараагийн хурлаар дахин ярилцъя." },
  ];

  return (
    <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
      <div aria-hidden className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary/15 via-transparent to-[oklch(0.55_0.2_290/0.15)] blur-2xl" />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10">
        {/* Цонхны толгой */}
        <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0.17_25)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.82_0.15_85)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.15_150)]" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">Бүтээгдэхүүний хурал</span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[oklch(0.95_0.04_25)] px-2 py-0.5 text-[11px] font-semibold text-[oklch(0.5_0.19_25)]">
            <span className="h-1.5 w-1.5 animate-pulse-recording rounded-full bg-[oklch(0.6_0.22_25)]" />
            REC 00:34
          </span>
        </div>

        {/* Шууд бичвэр */}
        <div className="space-y-3 px-5 py-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Шууд бичвэр</p>
            <LogoMark animated className="h-4 text-primary" />
          </div>
          {lines.map((l) => (
            <div key={l.t} className="flex gap-3 text-sm">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-muted-foreground">{l.t}</span>
              <p className="leading-relaxed">{l.text}</p>
            </div>
          ))}
        </div>

        {/* AI тэмдэглэл */}
        <div className="border-t border-border bg-muted/30 px-5 py-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            AI хурлын тэмдэглэл
          </p>
          <div className="space-y-2.5">
            <MockItem tone="primary" label="Шийдвэр" text="Шинэ хувилбарыг ирэх даваа гаригт гаргана." source="00:12" />
            <MockItem tone="green" label="Даалгавар" text="Тестийн тайлан бэлдэх · Сараа · Баасан" source="00:21" />
            <MockItem tone="amber" label="Нээлттэй асуулт" text="Үнийн бодлого — дараагийн хурлаар" source="00:34" />
          </div>
        </div>
      </div>
    </div>
  );
}

const TONES = {
  primary: "bg-primary/10 text-primary",
  green: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.42_0.12_150)]",
  amber: "bg-[oklch(0.96_0.06_85)] text-[oklch(0.47_0.11_70)]",
} as const;

function MockItem({
  tone,
  label,
  text,
  source,
}: {
  tone: keyof typeof TONES;
  label: string;
  text: string;
  source: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card px-3.5 py-3">
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${TONES[tone]}`}>{label}</span>
      <p className="flex-1 text-sm leading-snug">{text}</p>
      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-muted-foreground">
        <Link2 className="h-3 w-3" />
        {source}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------ Highlights */

function Highlights() {
  const items = [
    { title: "Монгол хэлэнд", text: "Монгол яриаг кирилл бичвэр болгоно" },
    { title: "Шууд бичвэр", text: "Хурлын явцад текст гарч ирнэ" },
    { title: "Эх сурвалжтай", text: "Шийдвэр бүр бичвэрийн хэсэгтэй холбогдоно" },
    { title: "Word экспорт", text: "Тэмдэглэлээ DOCX-ээр татаж хуваалцана" },
  ];
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
        {items.map((i) => (
          <div key={i.title} className="px-2 py-7 sm:px-6">
            <p className="font-display text-base font-bold">{i.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{i.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------- How it works */

function HowItWorks() {
  const steps = [
    {
      icon: Mic,
      title: "Бичнэ",
      text: "Танхимын хурлыг микрофоноор, онлайн хурлыг (Zoom, Meet, Teams) хөтчийн табаар шууд бичнэ. Эсвэл бэлэн аудио файлаа оруулна.",
    },
    {
      icon: ListChecks,
      title: "AI боловсруулна",
      text: "Яриа текст болж, AI хураангуй, хэлэлцсэн асуудал, шийдвэр, үүрэг даалгавар, нээлттэй асуултыг ялгаж гаргана.",
    },
    {
      icon: FileDown,
      title: "Хуваалцана",
      text: "Тэмдэглэлээ бичвэртэй нь тулган шалгаж, Word (DOCX) файлаар татаад багтайгаа хуваалцана.",
    },
  ];

  return (
    <section id="how" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Хэрхэн ажилладаг"
          title="Гурван алхмаар хурлын тэмдэглэл"
          text="Тохиргоо, суулгац шаардлагагүй. Хөтчөө нээгээд л эхэлнэ."
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-border bg-card p-7 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-5xl font-extrabold text-muted/80 [-webkit-text-stroke:1px_var(--border)]">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-bold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- Features */

function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Боломжууд"
          title="Хурлын тэмдэглэлд хэрэгтэй бүхэн"
          text="Бичлэгээс эхлээд хуваалцах хүртэлх ажлыг нэг дор."
        />

        <div className="mt-14 grid gap-4 md:grid-cols-6">
          <FeatureCard
            className="md:col-span-4"
            icon={Mic}
            title="Шууд бичлэг ба бичвэр"
            text="Хурлын явцад яриа тань дэлгэц дээр текст болон гарч ирнэ. Түр зогсоож, үргэлжлүүлж болно."
          >
            <div className="mt-6 flex h-16 items-center gap-[3px] overflow-hidden rounded-xl border border-border bg-background px-4 sm:gap-1.5">
              {Array.from({ length: 48 }).map((_, i) => (
                <span
                  key={i}
                  className="minuto-bar min-w-0 flex-1 rounded-full bg-primary/70"
                  style={{
                    height: `${20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%`,
                    animationDelay: `${(i % 8) * 0.1}s`,
                  }}
                />
              ))}
            </div>
          </FeatureCard>
          <FeatureCard
            className="md:col-span-2"
            icon={MonitorSpeaker}
            title="Онлайн хурал"
            text="Zoom, Google Meet, Teams-ийн хурлыг хөтчийн табын дуугаар нь бичнэ."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={Upload}
            title="Аудио файл оруулах"
            text="MP3, WAV, M4A, WebM бичлэгээ оруулаад тэмдэглэл гаргуулна."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={Link2}
            title="Эх сурвалжтай тэмдэглэл"
            text="Шийдвэр, даалгавар бүр бичвэрийн аль хэсгээс гарсныг харуулна."
          />
          <FeatureCard
            className="md:col-span-2"
            icon={FileDown}
            title="Word (DOCX) экспорт"
            text="Албан ёсны хэлбэрт ойр тэмдэглэлийг нэг товшилтоор татна."
          />
          <FeatureCard
            className="md:col-span-6"
            icon={Lock}
            title="Таны хурал зөвхөн танд"
            text="Бичлэг, бичвэр, тэмдэглэл тань таны бүртгэлд хадгалагдаж, зөвхөн та нэвтэрч харна. Хэрэггүй болсон хурлаа бүрмөсөн устгаж болно."
          />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  text,
  className = "",
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-border bg-card p-7 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 leading-relaxed text-muted-foreground">{text}</p>
      {children}
    </div>
  );
}

/* -------------------------------------------------------- Minutes output */

function MinutesShowcase() {
  const parts = [
    { title: "Хураангуй", text: "Хурлын гол санааг 3–6 өгүүлбэрт." },
    { title: "Хэлэлцсэн асуудал", text: "Сэдэв тус бүрийн товч тайлбар." },
    { title: "Шийдвэр", text: "Санал биш, батлагдсан шийдвэрийг л." },
    { title: "Үүрэг даалгавар", text: "Хариуцагч, хугацаатай нь." },
    { title: "Нээлттэй асуулт", text: "Шийдэгдээгүй үлдсэн асуудлууд." },
  ];

  return (
    <section className="relative overflow-hidden bg-[oklch(0.17_0.02_264)] py-20 text-white sm:py-28">
      <div aria-hidden className="pointer-events-none absolute right-[-10rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(closest-side,oklch(0.55_0.2_280/0.45),transparent)]" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[oklch(0.78_0.1_264)]">Үр дүн</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Цэгцтэй, шалгах боломжтой хурлын тэмдэглэл
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Minuto зохиож нэмэхгүй. Бичвэрт байхгүй шийдвэр, хариуцагч, хугацааг гаргахгүй бөгөөд гаргасан
            зүйл бүрийг яг аль хэсгээс авсныг заана. Ингэснээр та хурлын тэмдэглэлээ итгэлтэйгээр хуваалцана.
          </p>
          <Link
            href="/login?mode=register"
            className="mt-9 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-[oklch(0.17_0.02_264)] transition-opacity hover:opacity-90"
          >
            Анхны хурлаа бичих
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {parts.map((p, i) => (
            <div
              key={p.title}
              className={`rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur ${i === 0 ? "sm:col-span-2" : ""}`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[oklch(0.78_0.1_264)]" />
                <p className="font-display font-bold">{p.title}</p>
              </div>
              <p className="mt-1.5 text-sm text-white/65">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Use cases */

function UseCases() {
  const cases = [
    { icon: Building2, title: "Удирдлагын хурал", text: "ТУЗ, удирдлагын шуурхай хурлын шийдвэр, үүргийг алдагдуулахгүй." },
    { icon: Users, title: "Багийн уулзалт", text: "Өдөр тутмын болон долоо хоногийн уулзалтын даалгаврыг хөтөлнө." },
    { icon: Briefcase, title: "Харилцагчтай уулзалт", text: "Тохиролцсон зүйлсээ тэмдэглэж, дараагийн алхмаа тодорхой болгоно." },
    { icon: GraduationCap, title: "Сургалт, ярилцлага", text: "Лекц, ярилцлага, судалгааны яриаг бичвэр болгон хадгална." },
  ];
  return (
    <section id="use-cases" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading eyebrow="Хэрэглээ" title="Ярилцдаг газар бүрт" text="Хурал хаана, ямар хэлбэрээр болох нь хамаагүй." />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((c) => (
            <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
              <c.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-display text-lg font-bold">{c.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------- FAQ */

function Faq() {
  const qa = [
    {
      q: "Монгол хэлийг хэр сайн таних вэ?",
      a: "Minuto монгол ярианд зориулсан яриа таних загвар ашигладаг. Чанар нь бичлэгийн дуу, чимээ, ярих хурдаас хамаарна. Тэмдэглэл бүр эх бичвэртэйгээ холбогддог тул чухал хэсгийг хялбар тулган шалгана.",
    },
    {
      q: "Онлайн хурлыг хэрхэн бичих вэ?",
      a: "Шинэ хурал эхлүүлээд онлайн хурлын горимыг сонгож, хурал явагдаж буй хөтчийн табыг дуутай нь хуваалцана. Ингэснээр бусад оролцогчийн яриа ч бичигдэнэ.",
    },
    {
      q: "Ямар файл оруулж болох вэ?",
      a: "MP3, WAV, M4A, WebM форматтай аудио бичлэг оруулж болно.",
    },
    {
      q: "Миний хурлын мэдээлэл хаана хадгалагдах вэ?",
      a: "Бичлэг, бичвэр, тэмдэглэл тань таны бүртгэлд хадгалагдаж, зөвхөн та харна. Хурлаа хүссэн үедээ бүрмөсөн устгаж болно.",
    },
    {
      q: "AI-ийн гаргасан тэмдэглэлд бүрэн итгэж болох уу?",
      a: "AI алдаа гаргах боломжтой тул хуваалцахаас өмнө шийдвэр, хариуцагч, хугацааг бичвэртэй тулгаж шалгахыг зөвлөж байна. Minuto зүйл бүрийн эх сурвалжийг зааж өгдөг нь үүнийг хөнгөвчилнө.",
    },
  ];
  return (
    <section id="faq" className="scroll-mt-20 border-t border-border bg-muted/30 py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHeading eyebrow="Түгээмэл асуулт" title="Асуулт байна уу?" />
        <div className="mt-12 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {qa.map((x) => (
            <details key={x.q} className="group px-6 py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display font-bold">
                <span className="flex items-center gap-3">
                  <CircleHelp className="h-4 w-4 shrink-0 text-primary" />
                  {x.q}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 pl-7 leading-relaxed text-muted-foreground">{x.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- Final CTA */

function FinalCta() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.42_0.2_290)] px-6 py-16 text-center text-white sm:px-16">
          <LogoMark className="pointer-events-none absolute -bottom-10 -right-8 h-56 text-white/10" />
          <h2 className="relative font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Дараагийн хурлаа Minuto-д даатга
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/80">
            Бүртгүүлээд анхны хурлаа хэдхэн минутад тэмдэглээрэй.
          </p>
          <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/login?mode=register"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Бүртгүүлэх
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              Нэвтрэх
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- Footer */

function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <Logo />
          <p className="text-sm text-muted-foreground">Монгол хэлний хурлын AI туслах</p>
        </div>
        <nav className="flex gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground">Боломжууд</a>
          <a href="#faq" className="hover:text-foreground">Түгээмэл асуулт</a>
          <Link href="/login" className="hover:text-foreground">Нэвтрэх</Link>
        </nav>
        <p className="text-sm text-muted-foreground">© 2026 Гэрэгэ Системс ХХК</p>
      </div>
    </footer>
  );
}

/* ---------------------------------------------------------------- Shared */

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-4 text-lg text-muted-foreground">{text}</p>}
    </div>
  );
}

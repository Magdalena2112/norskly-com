import { useEffect, useState, type ReactNode } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronDown, ExternalLink } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GERMANY_BEFORE_LEAVING, GERMANY_GUIDE, GERMANY_LINK_GROUPS, type GermanyTopic } from "@/lib/germanyRelocationData";
import { NORWAY_BEFORE_LEAVING, NORWAY_GUIDE, NORWAY_LINK_GROUPS, NORWAY_SOURCES, type NorwayTopic } from "@/lib/norwayRelocationData";
import {
  COUNTRIES, STEPS, type CountryData, type CountryId,
} from "@/lib/relocationData";

function Expandable({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border bg-background/70">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-foreground"
      >
        {icon}
        <span className="flex-1">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-2 px-4 pb-4">{children}</div>}
    </div>
  );
}

function StepShell({ step, children }: { step: (typeof STEPS)[number]; children: ReactNode }) {
  return (
    <section id={step.id} className="relative scroll-mt-32 pl-14 md:pl-20">
      <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground ring-4 ring-background md:h-12 md:w-12 md:text-base">
        {step.num}
      </span>
      <h2 className="mb-4 pt-1.5 font-display text-2xl text-foreground md:pt-2.5 md:text-3xl">{step.title}</h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function CountryTopicList({ stepId, countryId }: { stepId: string; countryId: CountryId }) {
  const data = countryId === "norveska" ? NORWAY_GUIDE[stepId] : GERMANY_GUIDE[stepId];
  if (!data) return null;
  return (
    <div className="space-y-3">
      {data.intro && <p className="text-sm leading-relaxed text-muted-foreground">{data.intro}</p>}
      {data.topics.map((topic: NorwayTopic | GermanyTopic) => (
        <Expandable key={topic.title} title={topic.title}>
          {topic.paragraphs?.map((text) => <p key={text} className="text-sm leading-relaxed text-foreground/85">{text}</p>)}
          {topic.bullets && <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-foreground/85">{topic.bullets.map((text) => <li key={text}>{text}</li>)}</ul>}
          {topic.source && <a href={topic.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">{topic.source.label}<ExternalLink className="h-3 w-3" /></a>}
        </Expandable>
      ))}
      {countryId === "norveska" && stepId === "dokumenta" && <a href={NORWAY_SOURCES.checklist.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2">{NORWAY_SOURCES.checklist.label}<ExternalLink className="h-3 w-3" /></a>}
    </div>
  );
}

function ReadinessChecklist({ country }: { country: CountryId }) {
  const key = `norskly_relocation_ready_${country}`;
  const items = country === "norveska" ? NORWAY_BEFORE_LEAVING : GERMANY_BEFORE_LEAVING;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(key) || "[]")); } catch { setDone([]); }
  }, [key]);
  const toggle = (item: string) => {
    const next = done.includes(item) ? done.filter((d) => d !== item) : [...done, item];
    setDone(next);
    localStorage.setItem(key, JSON.stringify(next));
  };
  const completed = items.filter((item) => done.includes(item)).length;
  const pct = Math.round((completed / items.length) * 100);
  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const checked = done.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              aria-pressed={checked}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                checked ? "border-primary/40 bg-primary/5 text-foreground" : "border-border bg-background/70 text-foreground hover:border-primary/30",
              )}
            >
              <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40")}>
                {checked && <Check className="h-3.5 w-3.5" />}
              </span>
              {item}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-xl bg-secondary/60 p-4">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-foreground">Spreman/na za preseljenje</span>
          <span className="text-primary">{completed}/{items.length}</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
    </div>
  );
}

function Roadmap({ country }: { country: CountryData }) {
  const [active, setActive] = useState<string>(STEPS[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" },
    );
    STEPS.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [country.id]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <nav aria-label="Koraci preseljenja" className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex gap-1 overflow-x-auto px-4 py-3 [scrollbar-width:none]">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex shrink-0 items-center">
              <button
                type="button"
                onClick={() => go(s.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors",
                  active === s.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-primary",
                )}
              >
                {s.num} {s.short}
              </button>
              {i < STEPS.length - 1 && <ArrowRight className="mx-0.5 h-3 w-3 text-muted-foreground/50" />}
            </div>
          ))}
        </div>
      </nav>

      <div className="container max-w-4xl px-4 py-12 md:py-16">
        <div className="relative space-y-14 md:space-y-16">
          <span aria-hidden className="absolute bottom-0 left-5 top-2 w-px border-l border-dashed border-primary/30 md:left-6" />

          <StepShell step={STEPS[0]}><CountryTopicList countryId={country.id} stepId="uslovi" /></StepShell>
          <StepShell step={STEPS[1]}><CountryTopicList countryId={country.id} stepId="posao" /></StepShell>
          <StepShell step={STEPS[2]}><CountryTopicList countryId={country.id} stepId="diploma" /></StepShell>

          <StepShell step={STEPS[3]}>
            <CountryTopicList countryId={country.id} stepId="dokumenta" />
          </StepShell>

          <StepShell step={STEPS[4]}>
            <CountryTopicList countryId={country.id} stepId="dozvola" />
          </StepShell>

          <StepShell step={STEPS[5]}>
            <CountryTopicList countryId={country.id} stepId="pre-odlaska" />
            <div className="pt-3"><ReadinessChecklist country={country.id} /></div>
          </StepShell>

          <StepShell step={STEPS[6]}>
            <CountryTopicList countryId={country.id} stepId="nakon-dolaska" />
          </StepShell>

          <StepShell step={STEPS[7]}>
            <div className="grid gap-4 sm:grid-cols-2">
              {(country.id === "norveska" ? NORWAY_LINK_GROUPS : GERMANY_LINK_GROUPS).map((g) => (
                <div key={g.category} className="rounded-2xl border border-border bg-card p-4 shadow-card-soft">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">{g.category}</p>
                  <ul className="space-y-3">
                    {g.items.map((l) => (
                      <li key={l.label} className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{l.label}</p>
                        </div>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Otvori ${l.label}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </StepShell>
        </div>
      </div>
    </>
  );
}

export default function RelocationHubPage() {
  const [params, setParams] = useSearchParams();
  const raw = params.get("zemlja");
  const country = raw === "norveska" || raw === "nemacka" ? COUNTRIES[raw] : null;

  const choose = (id: CountryId) => {
    setParams({ zemlja: id });
    setTimeout(() => document.getElementById("roadmap")?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Relocation Hub - Preseljenje u Norvešku ili Nemačku | Norskly</title>
        <meta name="description" content="Sve što ti je potrebno za preseljenje u Norvešku ili Nemačku – korak po korak." />
      </Helmet>

      <header className="container flex items-center px-4 py-5">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Norskly
        </Link>
      </header>

      <section className="container max-w-4xl px-4 pb-12 pt-6 text-center md:pb-16 md:pt-10">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">Korak po korak</p>
        <h1 className="mb-4 font-display text-4xl text-foreground md:text-6xl">Relocation Hub</h1>
        <p className="mx-auto mb-10 max-w-xl text-base text-muted-foreground md:text-lg">
          Sve što ti je potrebno za preseljenje u Norvešku ili Nemačku – korak po korak.
        </p>
        <div className="mx-auto grid max-w-2xl gap-4 sm:grid-cols-2">
          {Object.values(COUNTRIES).map((c) => {
            const selected = country?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => choose(c.id)}
                aria-pressed={selected}
                className={cn(
                  "group rounded-3xl border-2 bg-card p-6 text-left shadow-card-soft transition-all hover:-translate-y-0.5 md:p-8",
                  selected ? "border-primary" : "border-border hover:border-primary/40",
                )}
              >
                <span className="mb-4 block text-4xl">{c.flag}</span>
                <span className="block font-display text-2xl text-foreground">{c.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{c.tagline}</span>
                <span className="mt-5 inline-flex items-center text-sm font-medium text-primary">
                  {selected ? "Izabrano" : "Pogledaj put"} <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div id="roadmap">{country && <Roadmap key={country.id} country={country} />}</div>
    </div>
  );
}

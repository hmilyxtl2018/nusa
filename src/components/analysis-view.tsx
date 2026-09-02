import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Leaf, Send, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { NusaMark } from "@/components/mark";
import { ScoreRing } from "@/components/score-ring";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { askAboutPlate } from "@/lib/analyze";
import { t, type I18nKey } from "@/lib/i18n";
import { cautionIsPersonal, collectMismatches, mismatchLabelKey } from "@/lib/profile-match";
import { useNusa } from "@/lib/store";
import type {
  BalanceLabel,
  Benefit,
  Caution,
  Evidence,
  Lang,
  ScanRecord,
  Severity,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const BALANCE_KEY: Record<BalanceLabel, I18nKey> = {
  nourishing: "balance.nourishing",
  balanced: "balance.balanced",
  indulgent: "balance.indulgent",
  caution: "balance.caution",
};

const EVIDENCE_KEY: Record<Evidence, I18nKey> = {
  strong: "result.evidence.strong",
  moderate: "result.evidence.moderate",
  traditional: "result.evidence.traditional",
};

const SEVERITY_KEY: Record<Severity, I18nKey> = {
  low: "result.severity.low",
  moderate: "result.severity.moderate",
  high: "result.severity.high",
};

const CHIPS: { key: I18nKey; q: Record<Lang, string> }[] = [
  {
    key: "result.chips.diabetes",
    q: {
      en: "Is this okay if I have diabetes?",
      id: "Apakah ini aman jika saya diabetes?",
      ms: "Adakah ini sesuai jika saya ada diabetes?",
      th: "เบาหวานกินจานนี้ได้ไหม?",
      vi: "Người tiểu đường ăn được món này chứ?",
      fil: "Okay ba ito kung may diabetes ako?",
      zh: "有糖尿病可以吃这盘吗？",
      km: "តើអាចញ៉ាំបានទេ បើមានជំងឺទឹកនោមផ្អែម?",
      lo: "ຖ້າເປັນເບົາຫວານ ກິນໄດ້ບໍ?",
      my: "ဆီးချို ရှိရင် ဒီပန်းကန် စားလို့ရလား။",
    },
  },
  {
    key: "result.chips.halal",
    q: {
      en: "Is this halal?",
      id: "Apakah ini halal?",
      ms: "Adakah ini halal?",
      th: "จานนี้ฮาลาลไหม?",
      vi: "Món này có phải halal không?",
      fil: "Halal ba ito?",
      zh: "这盘清真吗？",
      km: "តើនេះហាឡាល់ទេ?",
      lo: "ນີ້ຮາລານບໍ?",
      my: "ဒါ ဟာလာလ် လား။",
    },
  },
  {
    key: "result.chips.healthier",
    q: {
      en: "How can I make this gentler on the body?",
      id: "Bagaimana membuat hidangan ini lebih lembut bagi tubuh?",
      ms: "Bagaimana nak jadikan hidangan ini lebih lembut?",
      th: "จะกินจานนี้ให้อ่อนโยนกว่าได้อย่างไร?",
      vi: "Làm sao để ăn món này dịu hơn với cơ thể?",
      fil: "Paano gawing mas magaan sa katawan ang putaheng ito?",
      zh: "怎样吃能让这盘更温和？",
      km: "ធ្វើយ៉ាងណាឲ្យចាននេះស្រាលជាង?",
      lo: "ຈະເຮັດໃຫ້ຈານນີ້ອ່ອນກວ່າໄດ້ແນວໃດ?",
      my: "ဒီပန်းကန်ကို ပိုညင်သာအောင် ဘယ်လိုစားမလဲ။",
    },
  },
  {
    key: "result.chips.pair",
    q: {
      en: "What should I eat with this?",
      id: "Sebaiknya dimakan dengan apa?",
      ms: "Elok dimakan dengan apa?",
      th: "กินคู่กับอะไรดี?",
      vi: "Nên ăn kèm với gì?",
      fil: "Ano ang magandang isama rito?",
      zh: "这盘配什么吃比较好？",
      km: "គួរញ៉ាំជាមួយអ្វី?",
      lo: "ຄວນກິນຄູ່ກັບຫຍັງ?",
      my: "ဘာနဲ့တွဲစားသင့်လဲ။",
    },
  },
];

function Expandable({
  title,
  meta,
  children,
  tone,
  personal,
  personalLabel,
}: {
  title: string;
  meta: string;
  children: ReactNode;
  tone: "benefit" | "caution";
  personal?: boolean;
  personalLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="rounded-[20px] bg-card shadow-[var(--shadow-border)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left"
      >
        <span
          className={cn(
            "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
            tone === "benefit" ? "bg-benefit-bg text-benefit" : "bg-caution-bg text-caution",
          )}
        >
          {tone === "benefit" ? (
            <Leaf className="size-4" strokeWidth={1.8} />
          ) : (
            <TriangleAlert className="size-4" strokeWidth={1.8} />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-medium leading-snug text-foreground">{title}</span>
            {personal ? (
              <Badge tone={tone === "benefit" ? "benefit" : "caution"}>{personalLabel}</Badge>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{meta}</span>
        </span>
        <ChevronDown
          className={cn(
            "mt-1 size-4 shrink-0 text-subtle transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div className="space-y-2 border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          {children}
        </div>
      ) : null}
    </article>
  );
}

function BenefitCard({
  item,
  lang,
}: {
  item: Benefit;
  lang: Lang;
}) {
  return (
    <Expandable
      title={item.component}
      meta={item.source}
      tone="benefit"
    >
      <p>
        <span className="text-foreground">{t(lang, "result.effect")}. </span>
        {item.effect}
      </p>
      <div className="flex flex-wrap gap-1.5 pt-1">
        <Badge tone="benefit">{t(lang, EVIDENCE_KEY[item.evidence])}</Badge>
        {item.tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>
    </Expandable>
  );
}

function CautionCard({
  item,
  lang,
  personal,
  personalLabel,
}: {
  item: Caution;
  lang: Lang;
  personal: boolean;
  personalLabel: string;
}) {
  return (
    <Expandable
      title={item.component}
      meta={item.source}
      tone="caution"
      personal={personal}
      personalLabel={personalLabel}
    >
      <p>
        <span className="text-foreground">{t(lang, "result.effect")}. </span>
        {item.effect}
      </p>
      {item.whoShouldCare ? (
        <p>
          <span className="text-foreground">{t(lang, "result.who")}. </span>
          {item.whoShouldCare}
        </p>
      ) : null}
      <Badge tone="caution">{t(lang, SEVERITY_KEY[item.severity])}</Badge>
    </Expandable>
  );
}

export function AnalysisView({
  scan,
  photo,
}: {
  scan: ScanRecord;
  photo: string;
}) {
  const lang = useNusa((s) => s.lang) as Lang;
  const profile = useNusa((s) => s.profile);
  const updateChat = useNusa((s) => s.updateChat);
  const navigate = useNavigate();
  const { analysis, chat } = scan;
  const mismatches = collectMismatches(analysis, profile);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  async function ask(text: string) {
    const q = text.trim();
    if (!q || asking) return;
    setAsking(true);
    setQuestion("");
    const nextChat = [...chat, { role: "user" as const, text: q }];
    updateChat(scan.id, nextChat);
    try {
      const result = await askAboutPlate({
        data: { question: q, lang, profile, analysis },
      });
      if (!result.ok) {
        toast.error(t(lang, "analyze.unavailable"));
        setAsking(false);
        return;
      }
      updateChat(scan.id, [...nextChat, { role: "nusa", text: result.text }]);
    } catch {
      toast.error(t(lang, "analyze.fail"));
    } finally {
      setAsking(false);
    }
  }

  const n = analysis.nutrition;
  const macros = [
    { k: t(lang, "result.kcal"), v: n.calories },
    { k: t(lang, "result.protein"), v: `${n.protein_g}g` },
    { k: t(lang, "result.carbs"), v: `${n.carbs_g}g` },
    { k: t(lang, "result.fat"), v: `${n.fat_g}g` },
    { k: t(lang, "result.sodium"), v: `${n.sodium_mg}mg` },
    { k: t(lang, "result.sugar"), v: `${n.sugar_g}g` },
    { k: t(lang, "result.fiber"), v: `${n.fiber_g}g` },
  ];

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg pb-10">
      <div className="relative">
        <img src={photo} alt={analysis.dishName} className="aspect-[4/3] w-full object-cover" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex size-11 items-center justify-center rounded-full bg-background/90 text-foreground shadow-[var(--shadow-border)] backdrop-blur-sm"
            aria-label={t(lang, "result.back")}
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="flex h-11 items-center rounded-full bg-background/90 px-4 text-sm font-medium shadow-[var(--shadow-border)] backdrop-blur-sm"
          >
            {t(lang, "result.new")}
          </button>
        </div>
      </div>

      <div className="px-5 pt-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {[analysis.cuisine, analysis.region].filter(Boolean).join(" · ")}
        </p>
        <h1 className="mt-1 font-display text-3xl font-medium tracking-[-0.03em]">
          {analysis.dishName}
        </h1>
        {analysis.localName && analysis.localName !== analysis.dishName ? (
          <p className="mt-1 text-sm text-muted-foreground">{analysis.localName}</p>
        ) : null}

        {mismatches.length > 0 ? (
          <div className="mt-4 rounded-[20px] bg-caution-bg px-4 py-3 text-sm text-caution-fg">
            <p className="font-medium">{t(lang, "result.mismatch")}</p>
            <p className="mt-1 text-caution-fg/80">
              {mismatches
                .map((m) => {
                  const key = mismatchLabelKey(m.key);
                  return key ? t(lang, key) : m.key;
                })
                .join(" · ")}
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-[24px] bg-card p-4 shadow-[var(--shadow-border)]">
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t(lang, "result.balance")}
          </p>
          <div className="mt-3">
            <ScoreRing
              score={analysis.overall.score}
              label={t(lang, BALANCE_KEY[analysis.overall.label])}
              caption={analysis.overall.headline}
            />
          </div>
          {analysis.summary ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {analysis.summary}
            </p>
          ) : null}
        </div>

        {analysis.foods.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t(lang, "result.identified")}
            </h2>
            <ul className="mt-3 space-y-2">
              {analysis.foods.map((food) => (
                <li
                  key={food.name}
                  className="flex items-baseline justify-between gap-3 rounded-[16px] bg-card px-3.5 py-2.5 shadow-[var(--shadow-border)]"
                >
                  <span>
                    <span className="text-sm font-medium">{food.name}</span>
                    {food.role ? (
                      <span className="ml-2 text-xs text-muted-foreground">{food.role}</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {food.portion}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-benefit">
            {t(lang, "result.beneficial")}
          </h2>
          <div className="mt-3 space-y-2">
            {analysis.beneficial.length === 0 ? (
              <p className="rounded-[20px] bg-card px-4 py-3.5 text-sm leading-relaxed text-muted-foreground shadow-[var(--shadow-border)]">
                {analysis.summary || t(lang, "result.beneficial")}
              </p>
            ) : (
              analysis.beneficial.map((item) => (
                <BenefitCard key={item.component} item={item} lang={lang} />
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-caution">
            {t(lang, "result.cautions")}
          </h2>
          <div className="mt-3 space-y-2">
            {analysis.cautions.length === 0 ? (
              <p className="rounded-[20px] bg-card px-4 py-3.5 text-sm leading-relaxed text-muted-foreground shadow-[var(--shadow-border)]">
                {t(lang, "result.cautions")}
              </p>
            ) : (
              analysis.cautions.map((item) => (
                <CautionCard
                  key={item.component}
                  item={item}
                  lang={lang}
                  personal={cautionIsPersonal(item, profile)}
                  personalLabel={t(lang, "result.foryou")}
                />
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {t(lang, "result.nutrition")}
          </h2>
          {n.basis ? (
            <p className="mt-1 text-xs text-muted-foreground">{n.basis}</p>
          ) : null}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {macros.map((m) => (
              <div
                key={m.k}
                className="rounded-[16px] bg-card px-3 py-3 shadow-[var(--shadow-border)]"
              >
                <p className="text-[11px] text-muted-foreground">{m.k}</p>
                <p className="mt-1 font-display text-lg font-medium tabular-nums tracking-tight">
                  {m.v}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 flex flex-wrap gap-2">
          <Badge tone={analysis.flags.halal === "yes" ? "benefit" : analysis.flags.halal === "no" ? "caution" : "muted"}>
            {t(
              lang,
              analysis.flags.halal === "yes"
                ? "result.halal.yes"
                : analysis.flags.halal === "no"
                  ? "result.halal.no"
                  : "result.halal.uncertain",
            )}
          </Badge>
          {analysis.flags.vegetarian ? <Badge tone="benefit">{t(lang, "result.veg")}</Badge> : null}
          {analysis.flags.vegan ? <Badge tone="benefit">{t(lang, "result.vegan")}</Badge> : null}
          {analysis.flags.glutenFree ? <Badge>{t(lang, "result.gf")}</Badge> : null}
          {analysis.flags.containsPork ? <Badge tone="caution">{t(lang, "result.pork")}</Badge> : null}
          {analysis.flags.containsBeef ? <Badge>{t(lang, "result.beef")}</Badge> : null}
          {analysis.flags.containsAlcohol ? <Badge tone="caution">{t(lang, "result.alcohol")}</Badge> : null}
          {analysis.flags.containsShellfish ? <Badge>{t(lang, "result.shellfish")}</Badge> : null}
          {analysis.allergens.map((a) => (
            <Badge key={a} tone="caution">
              {a}
            </Badge>
          ))}
        </section>

        {analysis.culturalNote ? (
          <section className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t(lang, "result.culture")}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {analysis.culturalNote}
            </p>
          </section>
        ) : null}

        {analysis.servingTips.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {t(lang, "result.tips")}
            </h2>
            <ul className="mt-3 space-y-2">
              {analysis.servingTips.map((tip) => (
                <li
                  key={tip}
                  className="rounded-[16px] bg-card px-3.5 py-3 text-sm leading-relaxed shadow-[var(--shadow-border)]"
                >
                  {tip}
                </li>
              ))}
            </ul>
            {analysis.pairingAdvice ? (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">{t(lang, "result.pairing")}. </span>
                {analysis.pairingAdvice}
              </p>
            ) : null}
          </section>
        ) : null}

        <section className="mt-10">
          <div className="flex items-center gap-2">
            <NusaMark className="size-6" />
            <h2 className="font-display text-xl font-medium tracking-[-0.03em]">
              {t(lang, "result.ask")}
            </h2>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {CHIPS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => void ask(chip.q[lang])}
                className="min-h-10 rounded-full bg-card px-3.5 text-sm shadow-[var(--shadow-border)]"
              >
                {t(lang, chip.key)}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {chat.map((turn, i) => (
              <div
                key={`${turn.role}-${i}`}
                className={cn(
                  "max-w-[92%] rounded-[18px] px-3.5 py-3 text-sm leading-relaxed",
                  turn.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-card shadow-[var(--shadow-border)]",
                )}
              >
                {turn.text}
              </div>
            ))}
            {asking ? (
              <div className="rounded-[18px] bg-card px-3.5 py-3 text-sm text-muted-foreground shadow-[var(--shadow-border)]">
                <span className="nusa-shimmer">{t(lang, "analyze.title")}</span>
              </div>
            ) : null}
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(question);
            }}
          >
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t(lang, "result.ask.placeholder")}
              className="h-12 min-w-0 flex-1 rounded-[14px] bg-card px-3.5 text-sm shadow-[var(--shadow-border)] outline-none placeholder:text-subtle"
            />
            <Button
              type="submit"
              size="icon"
              disabled={asking || !question.trim()}
              aria-label={t(lang, "common.send")}
            >
              <Send className="size-4" />
            </Button>
          </form>
        </section>

        <p className="mt-10 text-xs leading-relaxed text-subtle">{t(lang, "app.disclaimer")}</p>
      </div>
    </div>
  );
}

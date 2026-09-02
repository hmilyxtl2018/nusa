import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { NusaMark } from "@/components/mark";
import { t } from "@/lib/i18n";
import type { Lang } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["analyze.1", "analyze.2", "analyze.3", "analyze.4"] as const;

const THOUGHTS: Partial<Record<Lang, string[]>> = {
  en: [
    "Looking at how the plate is built — base, relish, protein, fresh.",
    "Reading colour, shine, steam, and whether it was steamed, fried or stewed.",
    "Separating coconut, sambal, fish, egg and greens if they are on the plate.",
    "Noting oil, salt, sugar, and how generous the relish looks.",
    "Weighing helpful compounds against sodium, saturated fat and frying.",
    "Holding this against how you eat — diet, conditions, allergies.",
    "Drafting both sides of the plate, without scare stories.",
    "Writing it in your language.",
  ],
  zh: [
    "在看这盘怎么组成：主食、配菜、蛋白质、生鲜。",
    "在读颜色、油光、热气，以及蒸、炸还是炖。",
    "在分开椰浆、参巴、鱼、蛋、青菜——如果盘上有。",
    "在看油、盐、糖，以及酱料给了多少。",
    "在权衡有益成分，对上钠、饱和脂肪和油炸。",
    "在对照你怎么吃：饮食、状况、过敏。",
    "在写盘子的两面，不危言耸听。",
    "在用你的语言写下来。",
  ],
  id: [
    "Melihat susunan piring — nasi, sambal, protein, yang segar.",
    "Membaca warna, kilap, uap: kukus, goreng, atau gulai.",
    "Memisahkan santan, sambal, ikan, telur, sayur jika ada.",
    "Mencatat minyak, garam, gula, dan seberapa banyak sambalnya.",
    "Menimbang senyawa bermanfaat lawan natrium, lemak jenuh, goreng.",
    "Mencocokkan dengan cara Anda makan — diet, kondisi, alergi.",
    "Menyusun dua sisi piring, tanpa menakut-nakuti.",
    "Menulisnya dalam bahasa Anda.",
  ],
  ms: [
    "Melihat susunan pinggan — nasi, sambal, protein, yang segar.",
    "Membaca warna, kilat, wap: kukus, goreng atau rebus.",
    "Memisahkan santan, sambal, ikan, telur, sayur jika ada.",
    "Mencatat minyak, garam, gula, dan berapa banyak sambalnya.",
    "Menimbang sebatian bermanfaat lawan natrium, lemak tepu, goreng.",
    "Menyemak cara anda makan — diet, keadaan, alahan.",
    "Menulis dua sisi pinggan, tanpa menakutkan.",
    "Menulis dalam bahasa anda.",
  ],
  th: [
    "กำลังดูจานประกอบอย่างไร — ข้าว น้ำพริก โปรตีน ของสด",
    "อ่านสี เงา ไอน้ำ ว่านึ่ง ทอด หรือเคี่ยว",
    "แยกกะทิ น้ำพริก ปลา ไข่ ผัก ถ้ามีบนจาน",
    "ดูน้ำมัน เกลือ น้ำตาล และน้ำพริกให้มาเท่าไร",
    "ชั่งสารที่เป็นประโยชน์ กับโซเดียม ไขมันอิ่มตัว ของทอด",
    "เทียบกับวิธีที่คุณกิน — อาหาร สุขภาพ แพ้",
    "ร่างสองด้านของจาน โดยไม่ขู่",
    "กำลังเขียนเป็นภาษาของคุณ",
  ],
  vi: [
    "Nhìn cách đĩa được dựng — cơm, sambal, đạm, rau sống.",
    "Đọc màu, ánh dầu, hơi nóng: hấp, chiên hay om.",
    "Tách dừa, sambal, cá, trứng, rau nếu có trên đĩa.",
    "Ghi dầu, muối, đường, và sambal chan bao nhiêu.",
    "Cân hợp chất có ích với natri, mỡ bão hòa, đồ chiên.",
    "Đối chiếu cách bạn ăn — kiêng, bệnh, dị ứng.",
    "Viết hai mặt của đĩa, không dọa.",
    "Đang viết bằng ngôn ngữ của bạn.",
  ],
  fil: [
    "Tinitingnan kung paano buo ang plato — kanin, sambal, protina, sariwa.",
    "Binabasa ang kulay, ningning, singaw: steamed, prito, o nilaga.",
    "Hinahati ang niyog, sambal, isda, itlog, gulay kung nandiyan.",
    "Minamarkahan ang langis, asin, asukal, at gaano karami ang sambal.",
    "Tinimbang ang nakakatulong laban sa sodium, saturated fat, prito.",
    "Ikinukumpara sa pagkain mo — diet, kundisyon, allergy.",
    "Isinusulat ang dalawang mukha ng plato, walang panakot.",
    "Sinusulat sa wika mo.",
  ],
};

const HOLD: Partial<Record<Lang, string[]>> = {
  en: [
    "Still with the model — taking a careful second look.",
    "Checking the sambal, the oil, and what your profile asked for.",
    "Almost there — folding this into one reading.",
  ],
  zh: [
    "还在模型里细看这一盘。",
    "在核对酱料、用油，以及你档案里在意的事。",
    "就快好了——收成一次完整的读盘。",
  ],
  id: [
    "Masih di model — melihat sekali lagi dengan teliti.",
    "Mengecek sambal, minyak, dan yang Anda pedulikan.",
    "Hampir — merangkai menjadi satu bacaan.",
  ],
  ms: [
    "Masih dengan model — meneliti sekali lagi.",
    "Menyemak sambal, minyak, dan apa yang anda ambil berat.",
    "Hampir — menyusun jadi satu bacaan.",
  ],
  th: [
    "ยังอยู่ในโมเดล — กำลังดูอีกครั้งอย่างละเอียด",
    "กำลังตรวจน้ำพริก น้ำมัน และสิ่งที่คุณใส่ใจ",
    "ใกล้แล้ว — กำลังรวบเป็นหนึ่งการอ่าน",
  ],
  vi: [
    "Vẫn trong mô hình — nhìn kỹ thêm một lượt.",
    "Đang đối sambal, dầu, và điều bạn quan tâm.",
    "Sắp xong — gom thành một lần đọc.",
  ],
  fil: [
    "Nasa modelo pa — tinitingnan ulit nang mabuti.",
    "Sinusuri ang sambal, langis, at iniisip mo.",
    "Malapit na — binubuo bilang isang pagbasa.",
  ],
};

function linesFor(lang: Lang) {
  return THOUGHTS[lang] ?? THOUGHTS.en ?? [];
}

function holdsFor(lang: Lang) {
  return HOLD[lang] ?? HOLD.en ?? [];
}

export function Analyzing({ lang, photo }: { lang: Lang; photo: string }) {
  const thoughts = linesFor(lang);
  const holds = holdsFor(lang);
  const [step, setStep] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [current, setCurrent] = useState(thoughts[0] ?? "");
  const [typed, setTyped] = useState("");
  const [tick, setTick] = useState(0);
  const prevThought = useRef("");

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1600);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const next =
      tick < thoughts.length
        ? thoughts[tick]
        : holds[(tick - thoughts.length) % Math.max(holds.length, 1)];
    if (!next) return;
    if (tick > 0 && prevThought.current) {
      setLog((rows) => [...rows.slice(-4), prevThought.current]);
    }
    prevThought.current = next;
    setCurrent(next);
    setStep(
      Math.min(
        STEPS.length - 1,
        Math.floor((tick / Math.max(thoughts.length, 1)) * STEPS.length),
      ),
    );
  }, [tick, thoughts, holds]);

  useEffect(() => {
    setTyped("");
    if (!current) return;
    let n = 0;
    const stepMs = current.length > 48 ? 16 : 22;
    const id = window.setInterval(() => {
      n += 1;
      setTyped(current.slice(0, n));
      if (n >= current.length) window.clearInterval(id);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [current]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="nusa-scan relative h-[34vh] min-h-44 overflow-hidden">
        <img src={photo} alt="" className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent" />
      </div>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
        <div className="flex items-center gap-2.5">
          <NusaMark className="size-7 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-primary">
              Nusa
            </p>
            <p className="nusa-shimmer font-display text-xl font-medium tracking-[-0.03em]">
              {t(lang, "analyze.title")}
            </p>
          </div>
        </div>

        <div
          className="mt-5 min-h-[7.5rem] rounded-[20px] bg-card px-4 py-3 shadow-[var(--shadow-border)]"
          aria-live="polite"
        >
          <ol className="space-y-1.5">
            {log.map((line, i) => (
              <li
                key={`${i}-${line.slice(0, 12)}`}
                className="text-[13px] leading-snug text-muted-foreground"
              >
                {line}
              </li>
            ))}
            <li className="text-[13px] leading-snug text-foreground">
              <span>{typed}</span>
              <span className="nusa-caret ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[1px] bg-primary align-middle" />
            </li>
          </ol>
        </div>

        <ol className="mt-6 space-y-3.5">
          {STEPS.map((key, i) => {
            const active = i === step;
            const done = i < step;
            return (
              <li key={key} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    done && "bg-primary text-primary-foreground",
                    active && "nusa-think-ring bg-secondary",
                    !done && !active && "bg-secondary",
                  )}
                >
                  {done ? (
                    <Check className="size-3" strokeWidth={2.6} />
                  ) : active ? (
                    <span className="size-1.5 rounded-full bg-primary" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    "pt-px text-sm leading-snug",
                    active && "font-medium text-foreground",
                    done && "text-primary",
                    !done && !active && "text-muted-foreground",
                  )}
                >
                  {t(lang, key)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

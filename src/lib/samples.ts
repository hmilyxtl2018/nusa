import type { I18nKey } from "./i18n";

export type SamplePlate = {
  id: string;
  src: string;
  nameKey: I18nKey;
  regionKey: I18nKey;
};

export const SAMPLE_PLATES: SamplePlate[] = [
  {
    id: "nasi-lemak",
    src: "/samples/nasi-lemak.jpg",
    nameKey: "samples.nasiLemak",
    regionKey: "samples.my",
  },
  {
    id: "pho",
    src: "/samples/pho.jpg",
    nameKey: "samples.pho",
    regionKey: "samples.vn",
  },
  {
    id: "pad-thai",
    src: "/samples/pad-thai.jpg",
    nameKey: "samples.padThai",
    regionKey: "samples.th",
  },
  {
    id: "adobo",
    src: "/samples/adobo.jpg",
    nameKey: "samples.adobo",
    regionKey: "samples.ph",
  },
  {
    id: "rendang",
    src: "/samples/rendang.jpg",
    nameKey: "samples.rendang",
    regionKey: "samples.id",
  },
  {
    id: "laksa",
    src: "/samples/laksa.jpg",
    nameKey: "samples.laksa",
    regionKey: "samples.sg",
  },
];

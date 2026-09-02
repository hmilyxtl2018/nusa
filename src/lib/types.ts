export type Lang =
  | "en"
  | "id"
  | "ms"
  | "th"
  | "vi"
  | "fil"
  | "zh"
  | "km"
  | "lo"
  | "my";

export type Diet =
  | "any"
  | "halal"
  | "vegetarian"
  | "vegan"
  | "buddhist"
  | "hindu";

export type HealthFlag =
  | "diabetes"
  | "hypertension"
  | "pregnancy"
  | "gout"
  | "kidney"
  | "cholesterol";

export type AllergyFlag =
  | "peanut"
  | "shellfish"
  | "fish"
  | "gluten"
  | "dairy"
  | "soy"
  | "egg"
  | "sesame";

export type Profile = {
  diet: Diet;
  health: HealthFlag[];
  allergies: AllergyFlag[];
};

export type Evidence = "strong" | "moderate" | "traditional";
export type Severity = "low" | "moderate" | "high";
export type BalanceLabel = "nourishing" | "balanced" | "indulgent" | "caution";
export type HalalFlag = "yes" | "no" | "uncertain";

export type FoodItem = {
  name: string;
  portion: string;
  role: string;
};

export type Benefit = {
  component: string;
  source: string;
  effect: string;
  evidence: Evidence;
  tags: string[];
};

export type Caution = {
  component: string;
  source: string;
  effect: string;
  severity: Severity;
  whoShouldCare: string;
  profileKeys: string[];
};

export type Nutrition = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  sodium_mg: number;
  sugar_g: number;
  fiber_g: number;
  basis: string;
};

export type DietFlags = {
  halal: HalalFlag;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  containsPork: boolean;
  containsAlcohol: boolean;
  containsBeef: boolean;
  containsShellfish: boolean;
};

export type FoodAnalysis = {
  dishName: string;
  localName: string;
  cuisine: string;
  region: string;
  mealType: string;
  confidence: number;
  summary: string;
  overall: {
    score: number;
    label: BalanceLabel;
    headline: string;
  };
  foods: FoodItem[];
  beneficial: Benefit[];
  cautions: Caution[];
  nutrition: Nutrition;
  culturalNote: string;
  servingTips: string[];
  pairingAdvice: string;
  allergens: string[];
  flags: DietFlags;
};

export type ChatTurn = {
  role: "user" | "nusa";
  text: string;
};

export type ScanRecord = {
  id: string;
  createdAt: number;
  sampleSrc?: string;
  thumb: string;
  analysis: FoodAnalysis;
  chat: ChatTurn[];
};

export type Tab = "home" | "history" | "you";

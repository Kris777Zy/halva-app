export interface ChatSummary {
  id: string;
  title: string;
  style: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  productIds: number[];
}

export interface AnswerStyleDto {
  id: string;
  name: string;
  instruction: string;
}

export interface ProductDto {
  id: number;
  flavour: string;
  ingredients: string;
  sugarPer100g: number;
  kcalPer100g: number;
  weightG: number;
  priceEur: number;
  allergens: string;
}

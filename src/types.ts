export interface MenuItem {
  id: string;
  name: string;
  description: string;
  station: string;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHumane: boolean;
}

export interface MealPeriod {
  name: string;
  startTime: string | null;
  endTime: string | null;
  items: MenuItem[];
}

export interface DayMenu {
  date: string;
  dayOfWeek: string;
  breakfast: MealPeriod | null;
  lunch: MealPeriod | null;
  happyHour: MealPeriod | null;
}

export interface WeeklyMenu {
  weekStart: string;
  scrapedAt: string;
  days: Record<string, DayMenu>;
}

export interface MealRating {
  averageRating: number;
  voteCount: number;
}

export interface HistoryComment {
  id: string;
  body: string;
  createdAt: string;
}

export interface HistoryResponse {
  menu: WeeklyMenu;
  ratings: Record<string, Record<string, MealRating>>;
  comments: Record<string, Record<string, HistoryComment[]>>;
}

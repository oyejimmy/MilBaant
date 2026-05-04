export type EggPref = 'fried' | 'boiled' | 'omelette' | 'none'

export interface BreakfastPref {
  paratha: boolean
  sadaRoti: boolean
  egg: EggPref
  tea: boolean
}

export interface Suggestion {
  id: string
  userId: string
  userName: string
  text: string
  createdAt: string
}

export interface NotesData {
  breakfastPrefs?: Record<string, BreakfastPref>   // userId → pref
  suggestions?: Suggestion[]
}

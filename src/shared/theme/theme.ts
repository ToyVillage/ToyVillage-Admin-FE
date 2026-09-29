import { tokens } from './tokens'

// Emotion ThemeProvider에 주입되는 테마 객체.
export const theme = {
  colors: tokens.color,
  font: tokens.font,
} as const

export type AppTheme = typeof theme

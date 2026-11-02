const categoryThemes: Record<string, string> = {
  brasil: 'news',
  mundo: 'news',
  política: 'news',
  politica: 'news',
  economia: 'economy',
  tecnologia: 'technology',
  esportes: 'sports',
  entretenimento: 'entertainment',
  games: 'games',
}

export function getCategoryTheme(category: string) {
  return categoryThemes[category.trim().toLocaleLowerCase('pt-BR')] ?? 'news'
}

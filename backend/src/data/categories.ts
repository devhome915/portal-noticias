export const categoryRegistry = [
  { id: 'brazil', name: 'Brasil', slug: 'brasil', description: 'Notícias e acontecimentos do Brasil.', order: 1, active: true },
  { id: 'world', name: 'Mundo', slug: 'mundo', description: 'Acontecimentos e análises internacionais.', order: 2, active: true },
  { id: 'politics', name: 'Política', slug: 'politica', description: 'Política, governo e decisões públicas.', order: 3, active: true },
  { id: 'economy', name: 'Economia', slug: 'economia', description: 'Mercados, negócios e indicadores econômicos.', order: 4, active: true },
  { id: 'technology', name: 'Tecnologia', slug: 'tecnologia', description: 'Tecnologia, inovação e ciência aplicada.', order: 5, active: true },
  { id: 'sports', name: 'Esportes', slug: 'esportes', description: 'Esportes, competições e atletas.', order: 6, active: true },
  { id: 'entertainment', name: 'Entretenimento', slug: 'entretenimento', description: 'Cultura, cinema, música e entretenimento.', order: 7, active: true },
  { id: 'games', name: 'Games', slug: 'games', description: 'Jogos, consoles, PC gaming, eSports e lançamentos.', order: 8, active: true },
] as const

export type Category = (typeof categoryRegistry)[number]['name']

export const categoryNames = categoryRegistry.map((category) => category.name) as [
  Category,
  ...Category[],
]

export function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && categoryRegistry.some((category) => category.name === value)
}

export function getCategoryBySlug(slug: string) {
  return categoryRegistry.find((category) => category.active && category.slug === slug)
}

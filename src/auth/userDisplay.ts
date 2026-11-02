export function getDisplayName(name?: string | null, email?: string | null) {
  const fallbackEmail = email ?? (name?.includes('@') ? name : null)
  const source = name?.trim() && !name.includes('@')
    ? name.trim()
    : fallbackEmail?.split('@')[0].replace(/[._-]+/g, ' ').trim() || 'Usuário'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return parts.join(' ')
  return `${parts[0]} ${parts[parts.length - 1]}`
}

export function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'U'
  return parts.length === 1
    ? parts[0].slice(0, 1).toLocaleUpperCase('pt-BR')
    : `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toLocaleUpperCase('pt-BR')
}

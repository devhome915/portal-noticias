import type { ReactNode } from 'react'
import type { NewsCategory } from '../types/news'
import { LoginSuccessToast } from './LoginSuccessToast'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function SiteLayout({
  categories,
  children,
  className = '',
  contentClassName = '',
}: {
  categories: NewsCategory[]
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div className={`page-shell ${className}`.trim()}>
      <SiteHeader categories={categories} />
      <LoginSuccessToast />
      <main className={`content-area ${contentClassName}`.trim()}>{children}</main>
      <SiteFooter />
    </div>
  )
}

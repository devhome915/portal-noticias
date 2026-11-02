import { useEffect, useRef, useState } from 'react'
import type { Article, ReactionType } from '../types/news'

const reactionOptions: Array<{ key: ReactionType; label: string; icon: string }> = [
  { key: 'curtir', label: 'Curtir', icon: '👍' },
  { key: 'amei', label: 'Amei', icon: '❤️' },
  { key: 'uau', label: 'Uau', icon: '😮' },
  { key: 'triste', label: 'Triste', icon: '😢' },
  { key: 'bravo', label: 'Bravo', icon: '😠' },
]

export function NewsInteractionBar({
  article,
  isAuthenticated,
  onReact,
  onRemoveReaction,
  onOpenComments,
  onRequireLogin,
}: {
  article: Article
  isAuthenticated: boolean
  onReact: (reaction: ReactionType) => Promise<void> | void
  onRemoveReaction: () => Promise<void> | void
  onOpenComments: () => void
  onRequireLogin: () => void
}) {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const [selectionOverride, setSelectionOverride] = useState<{
    articleId: number
    reaction: ReactionType | null
  } | null>(null)
  const selectedReaction =
    selectionOverride?.articleId === article.id
      ? selectionOverride.reaction
      : article.reactions?.userReaction ?? null
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    if (!selectorOpen) {
      return undefined
    }

    optionRefs.current[0]?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectorOpen(false)
        triggerRef.current?.focus()
      }
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setSelectorOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [selectorOpen])
  const totalReactions = article.reactions?.total ?? 0
  const commentCount = article.commentCount ?? 0
  const popularReactionTypes = reactionOptions
    .map((reaction) => ({
      ...reaction,
      count: article.reactions?.byType[reaction.key] ?? 0,
    }))
    .filter((reaction) => reaction.count > 0)
    .sort((left, right) => right.count - left.count)
    .slice(0, 3)

  const focusOption = (nextIndex: number) => {
    const safeIndex = Math.max(0, Math.min(nextIndex, reactionOptions.length - 1))
    optionRefs.current[safeIndex]?.focus()
  }

  const handleSelectReaction = async (reaction: ReactionType) => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }

    setSelectionOverride({ articleId: article.id, reaction })
    setSelectorOpen(false)
    triggerRef.current?.focus()
    await onReact(reaction)
  }

  const handleRemoveSelection = async () => {
    if (!isAuthenticated) {
      onRequireLogin()
      return
    }

    setSelectionOverride({ articleId: article.id, reaction: null })
    setSelectorOpen(false)
    triggerRef.current?.focus()
    await onRemoveReaction()
  }

  return (
    <div className="news-interaction-bar" ref={popoverRef}>
      <div className="interaction-summary">
        <span className="reaction-summary">
          {popularReactionTypes.length > 0 ? (
            <span className="reaction-types" aria-label="Tipos de reação mais usados">
              {popularReactionTypes.map((reaction) => (
                <span key={reaction.key} aria-hidden="true">{reaction.icon}</span>
              ))}
            </span>
          ) : null}
          <span>{totalReactions} reações</span>
        </span>
        <button type="button" className="comment-summary" onClick={onOpenComments}>
          {commentCount} comentários
        </button>
      </div>

      <div className="interaction-actions">
        <button
          ref={triggerRef}
          type="button"
          className={selectedReaction ? 'interaction-button selected' : 'interaction-button'}
          aria-haspopup="dialog"
          aria-expanded={selectorOpen}
          aria-controls={`reaction-popover-${article.id}`}
          aria-pressed={Boolean(selectedReaction)}
          onClick={() => {
            if (!isAuthenticated) {
              onRequireLogin()
              return
            }

            setSelectorOpen((current) => !current)
          }}
        >
          <span aria-hidden="true">{selectedReaction ? reactionOptions.find((item) => item.key === selectedReaction)?.icon : '👍'}</span>
          Reagir
        </button>

        <button type="button" className="interaction-button secondary" onClick={onOpenComments}>
          <span aria-hidden="true">💬</span>
          Comentar
        </button>
      </div>

      {selectorOpen ? (
        <div id={`reaction-popover-${article.id}`} className="reaction-popover" role="dialog" aria-label="Selecionar reação">
          {reactionOptions.map((reaction, index) => (
            <button
              key={reaction.key}
              ref={(element) => {
                optionRefs.current[index] = element
              }}
              type="button"
              className={selectedReaction === reaction.key ? 'reaction-option active' : 'reaction-option'}
              onClick={() => void handleSelectReaction(reaction.key)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                  event.preventDefault()
                  focusOption(index + 1)
                  return
                }

                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                  event.preventDefault()
                  focusOption(index - 1)
                  return
                }
              }}
            >
              <span aria-hidden="true">{reaction.icon}</span>
              {reaction.label}
            </button>
          ))}

          {selectedReaction ? (
            <button type="button" className="reaction-option danger" onClick={() => void handleRemoveSelection()}>
              Remover reação
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

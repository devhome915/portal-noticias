import { getDisplayName } from '../auth/userDisplay'
import type { ReactionSummary, ReactionType } from '../types/news'
import { formatNewsDate } from '../utils/formatDate'

export type ThreadComment = {
  id: number
  articleId: number
  author: string
  userId: string
  content: string
  createdAt: string
  status: string
  parentId: number | null
  edited: boolean
  replies?: ThreadComment[]
  reactions?: ReactionSummary
}

const commentReactionOptions: Array<{ key: ReactionType; label: string; icon: string }> = [
  { key: 'curtir', label: 'Curtir', icon: '👍' },
  { key: 'amei', label: 'Amei', icon: '❤️' },
  { key: 'uau', label: 'Uau', icon: '😮' },
  { key: 'triste', label: 'Triste', icon: '😢' },
  { key: 'bravo', label: 'Bravo', icon: '😠' },
]

export function CommentThread({
  comments,
  currentUser,
  currentDisplayName,
  pendingCommentReactions,
  onReply,
  onDelete,
  onReport,
  onReact,
  depth = 0,
}: {
  comments: ThreadComment[]
  currentUser: string | null
  currentDisplayName?: string
  pendingCommentReactions: Set<number>
  onReply: (commentId: number) => void
  onDelete: (commentId: number) => void
  onReport: (commentId: number) => void
  onReact: (commentId: number, reaction: ReactionType, remove: boolean) => void
  depth?: number
}) {
  if (comments.length === 0) return null

  return (
    <div className="comment-thread">
      {comments.map((comment) => (
        <article key={comment.id} className={`comment-item depth-${depth}`}>
          <header className="comment-header">
            <div>
              <strong>{currentUser === comment.userId && currentDisplayName ? currentDisplayName : getDisplayName(comment.author)}</strong>
              <time>{formatNewsDate(comment.createdAt)}</time>
            </div>
            <span className="comment-status">{comment.status}</span>
          </header>

          <p>{comment.content}</p>
          <span className="comment-reply-count" aria-label={`${comment.replies?.length ?? 0} respostas`}>
            {comment.replies?.length ?? 0} {comment.replies?.length === 1 ? 'resposta' : 'respostas'}
          </span>

          <div className="comment-actions">
            <div className="comment-reactions" role="group" aria-label={`Reações ao comentário de ${comment.author}`}>
              {commentReactionOptions.map((reaction) => {
                const count = comment.reactions?.byType[reaction.key] ?? 0
                const selected = comment.reactions?.userReaction === reaction.key
                const pending = pendingCommentReactions.has(comment.id)
                return (
                  <button
                    key={reaction.key}
                    type="button"
                    className={selected ? 'comment-reaction-button active' : 'comment-reaction-button'}
                    aria-label={`${reaction.label}: ${count}`}
                    aria-pressed={selected}
                    aria-busy={pending}
                    disabled={pending}
                    title={reaction.label}
                    onClick={() => onReact(comment.id, reaction.key, selected)}
                  >
                    <span aria-hidden="true">{reaction.icon}</span>
                    <span>{count}</span>
                  </button>
                )
              })}
            </div>
            <div className="comment-action-links">
              <button type="button" className="text-link" onClick={() => onReply(comment.id)}>Responder</button>
              {currentUser && comment.userId === currentUser ? (
                <button type="button" className="text-link danger" onClick={() => onDelete(comment.id)}>Excluir</button>
              ) : (
                <button type="button" className="text-link danger" onClick={() => onReport(comment.id)}>Denunciar</button>
              )}
            </div>
          </div>

          {comment.replies && comment.replies.length > 0 ? (
            <CommentThread
              comments={comment.replies}
              currentUser={currentUser}
              currentDisplayName={currentDisplayName}
              pendingCommentReactions={pendingCommentReactions}
              onReply={onReply}
              onDelete={onDelete}
              onReport={onReport}
              onReact={onReact}
              depth={Math.min(depth + 1, 2)}
            />
          ) : null}
        </article>
      ))}
    </div>
  )
}

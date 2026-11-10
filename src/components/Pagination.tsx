import type { Pagination as PaginationInfo } from '../lib/api'

type Props = {
  pagination: PaginationInfo
  disabled?: boolean
  onChange: (page: number) => void
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < total - 1) pages.push('…')
  pages.push(total)
  return pages
}

export default function Pagination({ pagination, disabled, onChange }: Props) {
  const { page, limit, total, totalPages, hasPrevPage, hasNextPage } = pagination
  if (total === 0) return null

  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-info">
        Showing {from}–{to} of {total}
      </span>
      <div className="pagination-controls">
        <button className="btn btn-ghost btn-sm" disabled={disabled || !hasPrevPage} onClick={() => onChange(page - 1)}>
          ‹ Prev
        </button>
        {pageList(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="pagination-gap">…</span>
          ) : (
            <button
              key={p}
              className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
              aria-current={p === page ? 'page' : undefined}
              disabled={disabled}
              onClick={() => p !== page && onChange(p)}
            >
              {p}
            </button>
          ),
        )}
        <button className="btn btn-ghost btn-sm" disabled={disabled || !hasNextPage} onClick={() => onChange(page + 1)}>
          Next ›
        </button>
      </div>
    </nav>
  )
}

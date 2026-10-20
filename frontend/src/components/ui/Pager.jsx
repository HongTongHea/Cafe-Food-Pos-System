import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Client-side pagination for tables.
export function usePaged(items, pageSize = 10) {
  const [page, setPage] = useState(1);
  const pages = Math.max(1, Math.ceil(items.length / pageSize));

  useEffect(() => {
    if (page > pages) setPage(pages);
  }, [page, pages]);

  const slice = useMemo(() => items.slice((page - 1) * pageSize, page * pageSize), [items, page, pageSize]);
  return { slice, page, pages, setPage, total: items.length, pageSize };
}

export default function Pager({ page, pages, setPage, total, pageSize }) {
  if (total <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-stone-100 px-4 py-3 text-sm text-stone-500">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex items-center gap-1">
        <button className="btn-icon" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        <span className="min-w-16 text-center font-medium text-stone-700">
          {page} / {pages}
        </span>
        <button className="btn-icon" disabled={page >= pages} onClick={() => setPage(page + 1)} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

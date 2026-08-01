import { cn } from "@/lib/utils";

const ELLIPSIS = "ellipsis" as const;
const SIBLING_COUNT = 1;

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function getPageItems(current: number, total: number): Array<number | typeof ELLIPSIS> {
  const totalVisible = SIBLING_COUNT * 2 + 5; // first, last, current, 2 siblings, 2 ellipses

  if (total <= totalVisible) return range(1, total);

  const leftSibling = Math.max(current - SIBLING_COUNT, 1);
  const rightSibling = Math.min(current + SIBLING_COUNT, total);

  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    return [...range(1, 3 + SIBLING_COUNT * 2), ELLIPSIS, total];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    return [1, ELLIPSIS, ...range(total - (3 + SIBLING_COUNT * 2) + 1, total)];
  }

  return [1, ELLIPSIS, ...range(leftSibling, rightSibling), ELLIPSIS, total];
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40"
      >
        Prev
      </button>

      {items.map((item, index) =>
        item === ELLIPSIS ? (
          <span key={`ellipsis-${index}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPageChange(item)}
            disabled={item === page}
            className={cn(
              "min-w-9 rounded-md px-3 py-1.5 text-sm",
              item === page
                ? "bg-neutral-900 text-white"
                : "text-neutral-700 hover:bg-neutral-100",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-100 disabled:pointer-events-none disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

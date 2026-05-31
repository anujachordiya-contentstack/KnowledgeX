const COLOR_MAP: Record<string, string> = {
  draft: "bg-gray-100 text-gray-600",
  in_review: "bg-blue-100 text-blue-700",
  changes_requested: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  archived: "bg-rose-100 text-rose-700",
};

const LABEL_MAP: Record<string, string> = {
  draft: "Draft",
  in_review: "In Review",
  changes_requested: "Changes Requested",
  published: "Published",
  archived: "Archived",
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const colorCls = COLOR_MAP[status] ?? "bg-gray-100 text-gray-600";
  const label = LABEL_MAP[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorCls}`}
    >
      {label}
    </span>
  );
}

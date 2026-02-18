interface UnitIndicatorProps {
  unit?: string
}

export function UnitIndicator({ unit }: UnitIndicatorProps) {
  if (!unit) return null

  const displayUnit = unit === "mm" ? "Metric" : "Imperial"

  return (
    <div className="px-2 py-1 rounded bg-muted text-xs font-semibold text-muted-foreground">
      {displayUnit}
    </div>
  )
}

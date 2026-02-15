import { Button } from "@/components/ui/button"

interface UnitSwitcherProps {
  documentUnit: string
  hasFingerprint?: boolean
  onSwitch: (unit: string) => void
}

export function UnitSwitcher({ documentUnit, hasFingerprint, onSwitch }: UnitSwitcherProps) {
  const isMetric = documentUnit === 'mm'
  const currentLabel = isMetric ? 'Metric' : 'Imperial'
  const isLocked = !!hasFingerprint

  const handleSwitch = () => {
    if (isLocked) return
    onSwitch(documentUnit === "mm" ? "in" : "mm")
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-6 text-xs px-2 hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleSwitch}
      disabled={isLocked}
      title={isLocked ? "Unit system is locked after fretboard is applied" : "Switch between Imperial and Metric units"}
    >
      {currentLabel}
    </Button>
  )
}

/** Page identifiers for sidebar navigation */
export type PageId = "parameters" | "templates" | "reports" | "changelog" | "help" | "community" | "support" | "about"

/** Matches the payload shape from parameter_bridge.build_ui_payload() */

export interface Parameter {
  name: string
  label: string
  unitKind: string
  controlType: string
  default: string
  min?: number
  max?: number
  minMetric?: number
  maxMetric?: number
  step?: number
  description: string
  expression?: string
  value?: number | null
  unit?: string
  group?: string    // set on extra params that have a pgfm-group tag
}

export interface ParameterGroup {
  id: string
  label: string
  order: number
  parameters: Parameter[]
}

export interface ModelPayload {
  schemaVersion: string
  templateVersion: string
  groups: ParameterGroup[]
  missing: string[]
  extra: string[]
  extraParams?: Parameter[]
  mode?: "initial" | "live" | "template"
  fingerprint?: string
  hasFingerprint?: boolean
  documentUnit?: string
}

export interface GuitarTemplate {
  id: string
  name: string
  description: string
  createdAt: string
  schemaVersion: string
  readonly: boolean
  parameters: Record<string, string>
}

export interface TemplateListPayload {
  presets: GuitarTemplate[]
  userTemplates: GuitarTemplate[]
}

/** A new parameter staged locally before being applied to Fusion */
export interface PendingParam {
  id: string           // local UUID for React key, never sent to backend
  name: string         // Fusion parameter name (e.g. "MyPickupDepth")
  value: string        // numeric string e.g. "12.5"
  unitKind: "length" | "angle" | "unitless"
  groupId: string      // which schema group it belongs to visually
  description: string  // optional Fusion comment
}

/** Timeline item representation */
export interface TimelineItem {
  name: string
  type: "Feature" | "Group"
  suppressed: boolean
  index: number
  children?: TimelineItem[]
}

/** Timeline summary state */
export interface TimelineSummary {
  total_items: number
  active_count: number
  suppressed_count: number
  group_count: number
  feature_count: number
}

/** Response from timeline operations */
export interface TimelineOperationResult {
  success: boolean
  message: string
  newState?: boolean
  itemsAffected?: number
}

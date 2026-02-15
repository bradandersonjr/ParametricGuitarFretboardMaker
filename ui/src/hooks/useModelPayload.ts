import { useEffect, useState } from "react"
import { onMessageFromPython, sendToPython, signalReady } from "@/lib/fusion-bridge"
import type { ModelPayload, TemplateListPayload } from "@/types"

export function useModelPayload() {
  const [payload, setPayload] = useState<ModelPayload | null>(null)
  const [connected, setConnected] = useState(false)
  const [templateList, setTemplateList] = useState<TemplateListPayload | null>(null)

  useEffect(() => {
    onMessageFromPython((action, dataJson) => {
      if (action === "PUSH_MODEL_STATE") {
        try {
          // Check if defaultMetric is in the JSON string before parsing
          if (dataJson.includes('ScaleLengthBass') && dataJson.includes('defaultMetric')) {
            console.log('[useModelPayload] JSON contains defaultMetric')
            // Find the ScaleLengthBass section
            const match = dataJson.match(/"name":"ScaleLengthBass"[^}]*"defaultMetric":"[^"]*"/)
            if (match) {
              console.log('[useModelPayload] Found ScaleLengthBass with defaultMetric:', match[0])
            }
          } else if (dataJson.includes('ScaleLengthBass')) {
            console.log('[useModelPayload] ScaleLengthBass found but NO defaultMetric in JSON')
          }

          const data: ModelPayload = JSON.parse(dataJson)
          console.log('[useModelPayload] Received PUSH_MODEL_STATE:', data)
          // Log first param to check for defaultMetric
          if (data.groups[0]?.parameters[0]) {
            console.log('[useModelPayload] First param:', data.groups[0].parameters[0])
          }
          setPayload(data)
          setConnected(true)
        } catch {
          // Silently ignore malformed payloads
        }
      } else if (action === "PUSH_TEMPLATES") {
        try {
          const data: TemplateListPayload = JSON.parse(dataJson)
          setTemplateList(data)
        } catch {
          // Silently ignore malformed payloads
        }
      }
    })
    signalReady()
  }, [])

  function refreshPayload() {
    sendToPython("GET_MODEL_STATE")
  }

  return { payload, connected, refreshPayload, templateList }
}

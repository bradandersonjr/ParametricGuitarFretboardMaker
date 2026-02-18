import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, Download, Upload, AlertCircle, AlertTriangle, X } from "lucide-react"
import { sendToPython } from "@/lib/fusion-bridge"
import type { ModelPayload } from "@/types"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

interface SharePageProps {
    payload: ModelPayload | null
    version: string
    onImportLoaded: () => void
}

export function SharePage({ payload, version, onImportLoaded }: SharePageProps) {
    const [shareString, setShareString] = useState("")
    const [importString, setImportString] = useState("")
    const [copied, setCopied] = useState(false)
    const [importError, setImportError] = useState("")
    const [waitingForImport, setWaitingForImport] = useState(false)
    const [showVersionWarning, setShowVersionWarning] = useState(false)
    const [pendingImportData, setPendingImportData] = useState<{ version: string; parameters: Record<string, string> } | null>(null)
    const [payloadAtImportTime, setPayloadAtImportTime] = useState<ModelPayload | null>(null)

    // Navigate to Parameters once the payload changes after an import request
    useEffect(() => {
        if (waitingForImport && payload && payload !== payloadAtImportTime && payload.mode === 'imported') {
            setWaitingForImport(false)
            setPayloadAtImportTime(null)
            onImportLoaded()
        }
    }, [payload, waitingForImport, payloadAtImportTime, onImportLoaded])

    const isInitial = payload?.mode === "initial"

    // Validate share string format
    const isImportValid = useMemo(() => {
        const trimmed = importString.trim()
        if (!trimmed) return false

        try {
            // Check prefix
            const prefixMatch = trimmed.match(/^pgfm_v([\d.]+)_/)
            if (!prefixMatch) return false

            // Try to decode and parse
            const encoded = trimmed.substring(prefixMatch[0].length)
            const decoded = atob(encoded)
            const shareData = JSON.parse(decoded)

            return !!(shareData && typeof shareData === 'object' && shareData.parameters)
        } catch {
            return false
        }
    }, [importString])

    // Generate encrypted share string from current parameters
    const handleExport = () => {
        if (!payload) return

        try {
            // Collect all parameter values
            const parameterData: Record<string, string> = {}

            // Add schema parameters
            payload.groups.forEach(group => {
                group.parameters.forEach(param => {
                    if (param.expression) {
                        parameterData[param.name] = param.expression
                    }
                })
            })

            // Add extra parameters
            if (payload.extraParams) {
                payload.extraParams.forEach(param => {
                    if (param.expression) {
                        parameterData[param.name] = param.expression
                    }
                })
            }

            // Create a JSON object with metadata
            const shareData = {
                version: payload.schemaVersion,
                templateVersion: payload.templateVersion,
                parameters: parameterData,
                timestamp: new Date().toISOString(),
            }

            // Convert to JSON and encode to base64
            const jsonString = JSON.stringify(shareData)
            const encoded = btoa(jsonString)

            // Add prefix to identify this as a PGFM share string
            setShareString(`pgfm_v${version}_${encoded}`)
        } catch (error) {
            console.error("Export error:", error)
            setShareString("")
        }
    }

    // Import parameters from encrypted share string
    const handleImport = () => {
        setImportError("")

        if (!importString.trim()) {
            setImportError("Please paste a share string first")
            return
        }

        try {
            const trimmed = importString.trim()

            // Validate and strip the prefix (pgfm_v{version}_)
            const prefixMatch = trimmed.match(/^pgfm_v([\d.]+)_/)
            if (!prefixMatch) {
                throw new Error("Invalid share string format - missing PGFM prefix")
            }

            const importedVersion = prefixMatch[1]
            const encoded = trimmed.substring(prefixMatch[0].length) // Remove prefix

            // Decode from base64 and parse JSON
            const decoded = atob(encoded)
            const shareData = JSON.parse(decoded)

            // Validate the structure
            if (!shareData.parameters || typeof shareData.parameters !== "object") {
                throw new Error("Invalid share string format")
            }

            // Check if version matches
            if (importedVersion !== version) {
                // Show warning dialog
                setPendingImportData({ version: importedVersion, parameters: shareData.parameters })
                setShowVersionWarning(true)
                return
            }

            // Version matches, proceed with import
            proceedWithImport(shareData.parameters)
        } catch (error) {
            console.error("Import error:", error)
            setImportError("Invalid share string. Please check and try again.")
        }
    }

    // Proceed with import after version check
    const proceedWithImport = (parameters: Record<string, string>) => {
        setPayloadAtImportTime(payload)
        setWaitingForImport(true)
        sendToPython("IMPORT_SHARE", { parameters })

        setImportString("")
        setShowVersionWarning(false)
        setPendingImportData(null)
    }

    // Handle version warning acceptance
    const handleVersionWarningAccept = () => {
        if (pendingImportData) {
            proceedWithImport(pendingImportData.parameters)
        }
    }

    // Handle version warning cancellation
    const handleVersionWarningCancel = () => {
        setShowVersionWarning(false)
        setPendingImportData(null)
    }

    // Copy share string to clipboard
    const handleCopy = () => {
        if (!shareString) return

        // Use execCommand method (more reliable in Autodesk Fusion webview)
        const textArea = document.createElement("textarea")
        textArea.value = shareString
        textArea.style.position = "fixed"
        textArea.style.left = "-999999px"
        textArea.style.top = "-999999px"
        textArea.setAttribute('readonly', '')
        document.body.appendChild(textArea)

        try {
            textArea.focus()
            textArea.select()
            textArea.setSelectionRange(0, shareString.length)

            const successful = document.execCommand('copy')
            if (successful) {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            }
        } catch (error) {
            console.error("Copy error:", error)
        } finally {
            document.body.removeChild(textArea)
        }
    }

    return (
        <div className="flex flex-col flex-1 min-h-0">
            <header className="px-4 py-3 border-b border-border shrink-0">
                <h1 className="text-sm font-bold tracking-tight font-heading">Share Design</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Export and import fretboard designs via encrypted text strings.
                </p>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
                {/* Export Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Download size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold font-heading">Export Design</h2>
                            <p className="text-xs text-muted-foreground">
                                Generate a shareable string from your current design
                            </p>
                        </div>
                    </div>

                    {isInitial && (
                        <div className="rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs space-y-1">
                            <p className="text-blue-800 dark:text-blue-200 font-medium flex items-center gap-1.5">
                                <AlertCircle size={14} />
                                Design Not Loaded
                            </p>
                            <p className="text-blue-700 dark:text-blue-300">
                                Load a template or create a design to export parameters.
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleExport}
                        disabled={isInitial || !payload}
                        className="w-full gap-2"
                        variant="default"
                    >
                        <Share2 size={16} />
                        Generate Share String
                    </Button>

                    {shareString && (
                        <div className="space-y-2">
                            <div className="relative">
                                <textarea
                                    value={shareString}
                                    readOnly
                                    className="w-full h-32 px-3 py-2 text-xs font-mono rounded-lg border border-input bg-muted/30 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Your share string will appear here..."
                                />
                            </div>
                            <Button
                                onClick={handleCopy}
                                variant="outline"
                                className="w-full gap-2"
                                disabled={!shareString}
                            >
                                {copied ? (
                                    <>
                                        <Check size={16} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={16} />
                                        Copy to Clipboard
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="border-t border-border/50" />

                {/* Import Section */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <Upload size={16} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold font-heading">Import Design</h2>
                            <p className="text-xs text-muted-foreground">
                                Load parameters from a shared string
                            </p>
                        </div>
                    </div>



                    <div className="space-y-2">
                        <textarea
                            value={importString}
                            onChange={(e) => {
                                setImportString(e.target.value)
                                setImportError("")
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault()
                                    handleImport()
                                }
                            }}
                            className="w-full h-32 px-3 py-2 text-xs font-mono rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted/30"
                            placeholder="Paste share string here..."
                        />

                        {importError && (
                            <div className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-xs">
                                <p className="text-red-800 dark:text-red-200 flex items-center gap-1.5">
                                    <AlertCircle size={14} />
                                    {importError}
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setImportString("")
                                    setImportError("")
                                }}
                                disabled={!importString}
                                variant="outline"
                                className="px-3"
                                title="Clear"
                            >
                                <X size={16} />
                            </Button>
                            <Button
                                onClick={handleImport}
                                disabled={!isImportValid}
                                className="flex-1 gap-2"
                                variant="default"
                            >
                                <Upload size={16} />
                                Import Parameters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Info Section */}
                <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 space-y-2">
                    <h3 className="text-xs font-semibold font-heading">How it works</h3>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                        <li>Export creates an encoded string containing all your parameter values</li>
                        <li>Share the string with others via email, chat, or forums</li>
                        <li>Import applies the parameters to your current design</li>
                        <li>The string is encoded but not encrypted for security</li>
                    </ul>
                </div>
            </div>

            {/* Version Mismatch Warning Dialog */}
            <Dialog open={showVersionWarning} onOpenChange={setShowVersionWarning}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="text-yellow-500" size={24} />
                            <DialogTitle>Version Mismatch</DialogTitle>
                        </div>
                        <DialogDescription className="space-y-2 pt-2">
                            <p>
                                This share string was created with version <strong>v{pendingImportData?.version}</strong>,
                                but you're currently using version <strong>v{version}</strong>.
                            </p>
                            <p className="text-yellow-600 dark:text-yellow-500">
                                The import may not work as intended due to version differences.
                                Do you want to proceed anyway?
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={handleVersionWarningCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleVersionWarningAccept}>
                            Proceed Anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

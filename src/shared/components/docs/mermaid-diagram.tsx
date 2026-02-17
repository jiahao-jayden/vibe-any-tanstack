import { Maximize2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTheme } from "tanstack-theme-kit"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { cn } from "@/shared/lib/utils"

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

interface MermaidDiagramProps {
  code: string
  className?: string
}

export function MermaidDiagram({ code, className }: MermaidDiagramProps) {
  const { theme, systemTheme } = useTheme()
  const [svg, setSvg] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const mermaidRef = useRef<typeof import("beautiful-mermaid") | null>(null)

  const currentTheme = theme === "system" ? systemTheme : theme

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        if (!mermaidRef.current) {
          mermaidRef.current = await import("beautiful-mermaid")
        }
        const { renderMermaid, THEMES } = mermaidRef.current
        const mermaidTheme =
          currentTheme === "dark" ? THEMES["github-dark"] : THEMES["github-light"]
        const rendered = await renderMermaid(code, mermaidTheme)
        if (cancelled) return
        setSvg(rendered)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setSvg("")
        setError(err instanceof Error ? err.message : "Failed to render Mermaid diagram")
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [code, currentTheme])

  const imageUrl = useMemo(() => (svg ? svgToDataUrl(svg) : ""), [svg])

  if (error) {
    return (
      <div className={cn("not-prose rounded-lg border border-destructive/30 p-3", className)}>
        <p className="text-sm text-destructive">Mermaid render error: {error}</p>
        <pre className="mt-3 overflow-x-auto rounded bg-muted p-3 text-xs">{code}</pre>
      </div>
    )
  }

  if (!svg) {
    return <div className={cn("not-prose h-24 animate-pulse rounded-lg bg-muted/70", className)} />
  }

  return (
    <>
      <div
        className={cn(
          "not-prose group relative overflow-x-auto rounded-lg border bg-background p-3",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 size-7 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => setOpen(true)}
          aria-label="Expand diagram"
        >
          <Maximize2 className="size-3.5" />
        </Button>
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
      >
        <DialogContent
          className="max-h-[90vh] max-w-[90vw] overflow-auto p-6"
          showCloseButton
        >
          <DialogTitle className="sr-only">Mermaid Diagram</DialogTitle>
          <DialogDescription className="sr-only">Expanded view of the diagram</DialogDescription>
          <img
            src={imageUrl}
            alt="Mermaid diagram"
            className="mx-auto max-h-[80vh] max-w-full object-contain"
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

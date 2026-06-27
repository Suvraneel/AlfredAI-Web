'use client'
import { useState, useEffect } from "react"
import { Zap, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatCountdown } from "@/lib/utils"
import type { ConfirmationRequest } from "@/types/api"
import { confirmAction, cancelAction } from "@/lib/api"
import { toast } from "sonner"

interface ConfirmationCardProps {
  confirmation: ConfirmationRequest
  onApprove: (response: import("@/types/api").ChatResponse) => void
  onCancel: () => void
}

export function ConfirmationCard({ confirmation, onApprove, onCancel }: ConfirmationCardProps) {
  const [countdown, setCountdown] = useState(() => formatCountdown(confirmation.expires_at))
  const [expired, setExpired] = useState(false)
  const [approving, setApproving] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      const expiry = new Date(confirmation.expires_at)
      if (now >= expiry) {
        setExpired(true)
        clearInterval(interval)
      } else {
        setCountdown(formatCountdown(confirmation.expires_at))
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [confirmation.expires_at])

  const handleApprove = async () => {
    setApproving(true)
    try {
      const response = await confirmAction(confirmation.action_id)
      onApprove(response)
      toast.success("Action approved and executed")
    } catch (e) {
      toast.error("Failed to approve action")
    } finally {
      setApproving(false)
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await cancelAction(confirmation.action_id)
      onCancel()
      toast.success("Action cancelled")
    } catch (e) {
      toast.error("Failed to cancel action")
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className={cn(
      "rounded-xl border p-4 my-2",
      expired
        ? "border-border bg-bg-surface"
        : "border-warning/30 bg-warning/5 shadow-[0_0_20px_rgba(245,158,11,0.08)]"
    )}>
      <div className="flex items-center gap-2 mb-3">
        <div className={cn(
          "flex h-7 w-7 items-center justify-center rounded-full",
          expired ? "bg-bg-subtle" : "bg-warning/10"
        )}>
          {expired ? (
            <AlertTriangle className="h-3.5 w-3.5 text-text-muted" />
          ) : (
            <Zap className="h-3.5 w-3.5 text-warning" />
          )}
        </div>
        <span className={cn(
          "text-sm font-medium",
          expired ? "text-text-muted" : "text-warning"
        )}>
          {expired ? "Action expired" : "Waiting for your approval"}
        </span>
        {!expired && (
          <span className={cn(
            "ml-auto text-xs font-mono",
            countdown === "00:00" ? "text-error" : "text-text-muted"
          )}>
            Expires in {countdown}
          </span>
        )}
      </div>

      <p className="text-sm text-text-primary mb-4 leading-relaxed">
        {confirmation.human_readable_summary}
      </p>

      {expired ? (
        <p className="text-xs text-text-muted">
          This action has expired. Send a new message to retry.
        </p>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            loading={approving}
            disabled={cancelling}
            className="flex items-center gap-1.5 bg-success hover:bg-success/90 text-white"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Approve and Execute
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            loading={cancelling}
            disabled={approving}
            className="flex items-center gap-1.5 border-error/30 text-error hover:bg-error/5"
          >
            <XCircle className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

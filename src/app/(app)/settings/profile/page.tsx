'use client'
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { updatePassword } from "@/lib/api"
import { getAtlassianId, setAtlassianId, getTenantId } from "@/lib/auth"
import { Copy, Check, User } from "lucide-react"
import { toast } from "sonner"

export default function ProfilePage() {
  const { user } = useAuth()
  const [atlassianId, setAtlassianIdState] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingAtlassian, setSavingAtlassian] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const id = getAtlassianId()
    if (id) setAtlassianIdState(id)
  }, [])

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const saveAtlassianId = () => {
    setAtlassianId(atlassianId)
    toast.success("Atlassian Account ID saved")
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 12) {
      toast.error("Password must be at least 12 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setSavingPassword(true)
    try {
      await updatePassword(currentPassword, newPassword)
      toast.success("Password updated")
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update password")
    } finally {
      setSavingPassword(false)
    }
  }

  const tenantId = getTenantId()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4 flex-shrink-0">
        <User className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Account info */}
          <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Account</h2>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-text-muted">Email</Label>
                <p className="mt-1 text-sm text-text-primary">{user?.email}</p>
              </div>
              <div>
                <Label className="text-xs text-text-muted">Role</Label>
                <div className="mt-1">
                  <Badge variant={user?.role === 'admin' ? 'accent' : 'default'} className="capitalize">
                    {user?.role}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-text-muted">Workspace ID</Label>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                  <code className="flex-1 text-xs font-mono text-text-secondary break-all">
                    {tenantId || user?.tenant_id || '—'}
                  </code>
                  {(tenantId || user?.tenant_id) && (
                    <button
                      onClick={() => copyToClipboard(tenantId || user?.tenant_id || '', 'tenant')}
                      className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0"
                    >
                      {copied === 'tenant' ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Atlassian Account ID */}
          <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Atlassian Account ID</h2>
              <p className="mt-1 text-xs text-text-muted">Required for Jira write actions. Found in your Atlassian profile settings.</p>
            </div>

            <div className="space-y-2">
              <Input
                value={atlassianId}
                onChange={e => setAtlassianIdState(e.target.value)}
                onBlur={saveAtlassianId}
                placeholder="712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
              <p className="text-xs text-text-muted">
                Format: <code className="font-mono text-text-secondary">712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>
              </p>
            </div>

            <Button size="sm" onClick={saveAtlassianId}>
              Save Atlassian ID
            </Button>
          </div>

          {/* Change password */}
          <div className="rounded-xl border border-border bg-bg-surface p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Change Password</h2>

            <form onSubmit={savePassword} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword">New password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 12 characters"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
              <Button type="submit" size="sm" loading={savingPassword}>
                Update password
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

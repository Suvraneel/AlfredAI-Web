'use client'
import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { getUsers, inviteUser } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/shared/EmptyState"
import { formatDate } from "@/lib/utils"
import type { UserProfile } from "@/types/api"
import { Users, UserPlus, Copy, Check, Lock } from "lucide-react"
import { toast } from "sonner"

const inviteSchema = z.object({
  email: z.string().email("Valid email required"),
  role: z.enum(["admin", "member"]),
})

type InviteFormValues = z.infer<typeof inviteSchema>

export default function TeamPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'member' },
  })

  useEffect(() => {
    if (user?.role === 'admin') {
      getUsers().then(r => setUsers(r.items)).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-bg-subtle flex items-center justify-center">
            <Lock className="h-5 w-5 text-text-muted" />
          </div>
          <h2 className="text-sm font-medium text-text-primary">Admin access required</h2>
          <p className="text-sm text-text-muted">Only admins can manage team members.</p>
        </div>
      </div>
    )
  }

  const handleInvite = async (data: InviteFormValues) => {
    try {
      const result = await inviteUser(data.email, data.role)
      setTempPassword(result.temporary_password)
      setUsers(prev => [...prev, {
        user_id: result.user_id,
        email: result.email,
        tenant_id: user.tenant_id,
        role: data.role,
        created_at: new Date().toISOString(),
        is_active: true,
      }])
      reset()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invite user")
    }
  }

  const copyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4 flex-shrink-0">
        <Users className="h-4 w-4 text-text-muted" />
        <h1 className="text-sm font-semibold text-text-primary">Team</h1>
        <span className="text-xs text-text-muted ml-1">({users.length} members)</span>
        <Button size="sm" className="ml-auto gap-1.5" onClick={() => setInviteOpen(true)}>
          <UserPlus className="h-3.5 w-3.5" />
          Invite user
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="space-y-3 max-w-2xl mx-auto">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Just you"
            description="Invite your team to get started."
            action={<Button size="sm" onClick={() => setInviteOpen(true)}>Invite team member</Button>}
          />
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="rounded-xl border border-border bg-bg-surface overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Email</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Role</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Joined</th>
                    <th className="text-left text-xs font-medium text-text-muted px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map(u => (
                    <tr key={u.user_id} className="hover:bg-bg-subtle transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">{u.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={u.role === 'admin' ? 'accent' : 'default'} className="capitalize text-[10px]">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-text-muted">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.is_active ? 'text-success' : 'text-error'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invite dialog */}
      <Dialog open={inviteOpen && !tempPassword} onOpenChange={v => { if (!v) { setInviteOpen(false); reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              They'll receive a temporary password to share out-of-band. No email is sent automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" placeholder="colleague@company.com" {...registerField('email')} />
              {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setInviteOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" loading={isSubmitting}>Send invite</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Temp password dialog */}
      <Dialog open={!!tempPassword} onOpenChange={() => { setTempPassword(null); setInviteOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share this password</DialogTitle>
            <DialogDescription>
              Share this temporary password with the user. It will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-3">
            <code className="flex-1 text-sm font-mono text-text-primary">{tempPassword}</code>
            <button onClick={copyPassword} className="text-text-muted hover:text-text-primary transition-colors">
              {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <DialogFooter>
            <Button onClick={() => { setTempPassword(null); setInviteOpen(false); }}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

'use client'
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { slugify } from "@/lib/utils"
import { Copy, Check, ChevronDown, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = password.length >= 12 ? (password.length >= 16 ? 3 : 2) : password.length >= 8 ? 1 : 0
  const labels = ['', 'Weak', 'Good', 'Strong']
  const colors = ['', 'bg-error', 'bg-warning', 'bg-success']

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? colors[strength] : 'bg-bg-subtle'}`} />
        ))}
      </div>
      {password && <p className="text-xs text-text-muted">{labels[strength]} · Min 12 characters</p>}
    </div>
  )
}

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/

export default function SignupPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [registrationSecret, setRegistrationSecret] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [successTenantId, setSuccessTenantId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (name) setSlug(slugify(name))
  }, [name])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Company name is required'
    if (!SLUG_REGEX.test(slug)) errs.slug = 'Slug must be 3-50 chars, lowercase, alphanumeric and hyphens only'
    if (!email.includes('@')) errs.email = 'Valid email required'
    if (password.length < 12) errs.password = 'Password must be at least 12 characters'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      const result = await register({
        name,
        slug,
        admin_email: email,
        admin_password: password,
        registration_secret: registrationSecret,
      })
      setSuccessTenantId(result.tenant_id)
      setTimeout(() => router.push('/onboarding'), 3000)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  const copyTenantId = () => {
    if (successTenantId) {
      navigator.clipboard.writeText(successTenantId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (successTenantId) {
    return (
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 bg-bg-base">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mx-auto">
              <Check className="h-7 w-7 text-success" />
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Workspace created!</h2>
            <p className="text-sm text-text-muted">Redirecting to onboarding in 3 seconds…</p>

            <div className="rounded-lg border border-warning/30 bg-warning/5 p-4 mt-4">
              <p className="text-xs text-warning font-medium mb-2">Save your Workspace ID — you need it to log in</p>
              <div className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2">
                <code className="flex-1 text-xs font-mono text-text-primary text-left break-all">{successTenantId}</code>
                <button onClick={copyTenantId} className="flex-shrink-0 text-text-muted hover:text-text-primary transition-colors">
                  {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full grid lg:grid-cols-2">
      {/* Left - form */}
      <div className="flex flex-col items-center justify-center px-4 py-12 bg-bg-base">
        <div className="flex items-center gap-2 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to text-white text-sm font-bold">
            A
          </div>
          <span className="font-semibold text-text-primary">AlfredAI</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary">Create your workspace</h1>
            <p className="mt-1 text-sm text-text-muted">Get your team set up in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                placeholder="Acme Corp"
              />
              {errors.name && <p className="text-xs text-error">{errors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Workspace Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value.toLowerCase())}
                placeholder="acme-corp"
              />
              <p className="text-xs text-text-muted">alfred.ai/{slug || 'your-slug'}</p>
              {errors.slug && <p className="text-xs text-error">{errors.slug}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
              {errors.email && <p className="text-xs text-error">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min 12 characters"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <PasswordStrengthBar password={password} />
              {errors.password && <p className="text-xs text-error">{errors.password}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
              {errors.confirmPassword && <p className="text-xs text-error">{errors.confirmPassword}</p>}
            </div>

            {/* Invite code */}
            <div>
              <button
                type="button"
                onClick={() => setShowSecret(p => !p)}
                className="text-xs text-text-muted hover:text-text-secondary flex items-center gap-1"
              >
                <ChevronDown className={`h-3 w-3 transition-transform ${showSecret ? 'rotate-180' : ''}`} />
                Have an invite code?
              </button>
              {showSecret && (
                <div className="mt-2">
                  <Input
                    value={registrationSecret}
                    onChange={e => setRegistrationSecret(e.target.value)}
                    placeholder="Registration secret"
                    type="password"
                  />
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" loading={loading} variant="gradient">
              Create workspace
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-text-muted">
            Already have an account?{' '}
            <Link href="/login" className="text-accent-from hover:underline">Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right - illustration */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-bg-surface border-l border-border p-12">
        <div className="max-w-sm space-y-6 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-from to-accent-to text-white text-3xl font-bold mx-auto shadow-[0_0_40px_rgba(99,102,241,0.3)]">
            A
          </div>
          <h2 className="text-2xl font-bold text-text-primary">One workspace.<br />All your tools.</h2>
          <p className="text-text-muted">Connect Jira, GitHub, and more. Ask questions, take actions, get answers — all in one chat.</p>
          <div className="space-y-2">
            {[
              "Jira + GitHub integration",
              "AI-powered answers",
              "Human-in-the-loop actions",
              "Full audit log",
            ].map(f => (
              <p key={f} className="text-sm text-text-secondary text-left">&#10003; {f}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

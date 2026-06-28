'use client'
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp } from "lucide-react"
import { getTenantId } from "@/lib/auth"
import { useState } from "react"

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
  tenantId: z.string().min(1, "Workspace ID required"),
  rememberWorkspace: z.boolean(),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const { login, user } = useAuth()
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', tenantId: '', rememberWorkspace: true },
  })

  useEffect(() => {
    const stored = getTenantId()
    if (stored) {
      setValue('tenantId', stored)
      setWorkspaceOpen(false)
    } else {
      setWorkspaceOpen(true)
    }
  }, [setValue])

  useEffect(() => {
    if (user) router.replace('/chat')
  }, [user, router])

  const onSubmit = async (data: FormValues) => {
    try {
      await login(data.email, data.tenantId, data.password)
      if (!data.rememberWorkspace) localStorage.removeItem('alfred_tenant_id')
      router.replace('/chat')
    } catch (e) {
      setError('root', { message: e instanceof Error ? e.message : 'Login failed' })
    }
  }

  const tenantId = watch('tenantId')

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-12 bg-bg-base">
      <div className="flex items-center gap-2 mb-8">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to text-white text-sm font-bold">
          A
        </div>
        <span className="font-semibold text-text-primary">AlfredAI</span>
      </div>

      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-bg-surface p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-text-primary">Welcome back</h1>
            <p className="mt-1 text-sm text-text-muted">Sign in to your workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••••••"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
            </div>

            {/* Workspace settings collapsible */}
            <div className="rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setWorkspaceOpen(p => !p)}
                className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-subtle transition-colors"
              >
                <span>Workspace settings</span>
                {workspaceOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {workspaceOpen && (
                <div className="border-t border-border p-3 space-y-3 bg-bg-elevated">
                  <div className="space-y-1.5">
                    <Label htmlFor="tenantId">Workspace ID</Label>
                    <Input
                      id="tenantId"
                      type="text"
                      placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="font-mono text-xs"
                      {...register('tenantId')}
                    />
                    {errors.tenantId && <p className="text-xs text-error">{errors.tenantId.message}</p>}
                  </div>
                  <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded"
                      {...register('rememberWorkspace')}
                    />
                    Remember my workspace
                  </label>
                </div>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-error">{errors.root.message}</p>
            )}

            <Button type="submit" className="w-full" loading={isSubmitting}>
              Sign in
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-text-muted">
            Don&apos;t know your Workspace ID?{' '}
            <span className="text-text-secondary">Check your signup confirmation.</span>
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-text-muted">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-accent-from hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

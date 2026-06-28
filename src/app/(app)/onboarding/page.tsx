'use client'
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getConnectionAuthorizeUrl } from "@/lib/api"
import { setAtlassianId, getAtlassianId } from "@/lib/auth"
import { CheckCircle2, ArrowRight } from "lucide-react"
import { toast } from "@/lib/toast"

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [jiraConnected, setJiraConnected] = useState(false)
  const [githubConnected, setGithubConnected] = useState(false)
  const [atlassianId, setAtlassianIdState] = useState('')
  const [connecting, setConnecting] = useState<'jira' | 'github' | null>(null)

  useEffect(() => {
    const connected = searchParams.get('connected')
    if (connected === 'jira') { setJiraConnected(true); setStep(3) }
    if (connected === 'github') { setGithubConnected(true) }
    const stored = getAtlassianId()
    if (stored) setAtlassianIdState(stored)
  }, [searchParams])

  const connectTool = async (tool: 'jira' | 'github') => {
    setConnecting(tool)
    try {
      const { authorization_url } = await getConnectionAuthorizeUrl(tool)
      window.location.href = authorization_url
    } catch {
      toast.error(`Failed to initiate ${tool} connection`)
      setConnecting(null)
    }
  }

  const handleFinish = () => {
    if (atlassianId) setAtlassianId(atlassianId)
    router.push('/chat')
  }

  const steps = [
    { num: 1, label: 'Welcome' },
    { num: 2, label: 'Connect Jira' },
    { num: 3, label: 'Connect GitHub' },
  ]

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-4 py-12">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-10">
        {steps.map(({ num, label }, i) => (
          <div key={num} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                step > num ? 'bg-success text-white' : step === num ? 'bg-accent-from text-white' : 'bg-bg-subtle text-text-muted'
              }`}>
                {step > num ? '✓' : num}
              </div>
              <span className={`text-sm ${step === num ? 'text-text-primary' : 'text-text-muted'}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-md">
        {/* Step 1 */}
        {step === 1 && (
          <div className="rounded-2xl border border-border bg-bg-surface p-8 space-y-6">
            <div className="text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-from to-accent-to text-white text-2xl font-bold mx-auto mb-4 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                A
              </div>
              <h1 className="text-xl font-semibold text-text-primary">You&apos;re in. Let&apos;s set up your workspace.</h1>
              <p className="mt-2 text-sm text-text-muted">Connect your tools to unlock AI-powered answers.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {['Jira', 'GitHub', 'Confluence', 'Slack'].map((tool, i) => (
                <div key={tool} className={`flex items-center gap-2 rounded-lg border p-3 ${
                  i < 2 ? 'border-accent-from/30 bg-accent-from/5' : 'border-border bg-bg-elevated opacity-40'
                }`}>
                  <div className={`h-7 w-7 rounded flex items-center justify-center text-xs font-bold ${
                    i < 2 ? 'bg-accent-from/20 text-accent-from' : 'bg-bg-subtle text-text-muted'
                  }`}>
                    {tool[0]}
                  </div>
                  <span className="text-sm text-text-secondary">{tool}</span>
                  {i >= 2 && <span className="text-[10px] text-text-muted ml-auto">Soon</span>}
                </div>
              ))}
            </div>

            <Button className="w-full" onClick={() => setStep(2)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="rounded-2xl border border-border bg-bg-surface p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Connect Jira</h2>
              <p className="mt-1 text-sm text-text-muted">
                Unlock AI answers about your issues, sprints, and backlogs.
              </p>
            </div>

            {jiraConnected ? (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm text-success">Jira connected — issues and sprints are syncing</span>
              </div>
            ) : (
              <Button
                className="w-full"
                onClick={() => connectTool('jira')}
                loading={connecting === 'jira'}
              >
                Connect Jira
              </Button>
            )}

            <div className="flex items-center justify-between">
              <button onClick={() => setStep(3)} className="text-sm text-text-muted hover:text-text-secondary">
                Skip for now
              </button>
              <Button onClick={() => setStep(3)} disabled={connecting !== null && !jiraConnected}>
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="rounded-2xl border border-border bg-bg-surface p-8 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Connect GitHub &amp; Atlassian ID</h2>
              <p className="mt-1 text-sm text-text-muted">
                Link GitHub PRs to Jira tickets automatically.
              </p>
            </div>

            {githubConnected ? (
              <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 p-4">
                <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                <span className="text-sm text-success">GitHub connected</span>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => connectTool('github')}
                loading={connecting === 'github'}
              >
                Connect GitHub
              </Button>
            )}

            <div className="space-y-2">
              <Label htmlFor="atlassianId">Your Atlassian Account ID</Label>
              <Input
                id="atlassianId"
                value={atlassianId}
                onChange={e => setAtlassianIdState(e.target.value)}
                placeholder="712020:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
              <p className="text-xs text-text-muted">
                Found in Atlassian Profile → Account ID. Required for Jira write actions.
              </p>
            </div>

            <Button className="w-full" variant="gradient" onClick={handleFinish}>
              Finish setup <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  )
}

'use client'
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Zap, GitBranch, Search, Shield, Check } from "lucide-react"

const TYPING_DEMO = [
  { role: 'user', text: "What's blocking PROJ-47?" },
  { role: 'ai', text: "PROJ-47 is In Review, assigned to Sarah Chen. PR #61 has 2 approvals. The branch feat/oauth2-login is ready to merge — no blockers.", tools: ['jira_get_issue', 'github_get_linked_prs'] },
]

const INTEGRATIONS = [
  { name: 'Jira', color: '#6366F1' },
  { name: 'GitHub', color: '#F59E0B' },
  { name: 'Confluence', soon: true },
  { name: 'Slack', soon: true },
  { name: 'Asana', soon: true },
]

const PRICING = [
  {
    name: 'Starter',
    price: '$49',
    period: '/mo',
    desc: 'Perfect for small teams',
    features: ['3 users', '1 workspace', '500 AI actions/mo', 'Jira + GitHub', 'Email support'],
    cta: 'Start free trial',
    highlight: false,
  },
  {
    name: 'Growth',
    price: '$149',
    period: '/mo',
    desc: 'For growing engineering teams',
    features: ['10 users', 'Unlimited workspaces', '2,000 AI actions/mo', 'All integrations', 'Priority support', 'Audit log'],
    cta: 'Start free trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations',
    features: ['Unlimited users', 'SSO / SAML', 'Custom data retention', 'SLA guarantee', 'Dedicated support', 'Custom integrations'],
    cta: 'Contact us',
    highlight: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-full bg-bg-base">
      {/* Nav */}
      <nav className="border-b border-border sticky top-0 z-40 bg-bg-base/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-from to-accent-to text-white text-xs font-bold">
              A
            </div>
            <span className="font-semibold text-text-primary">AlfredAI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm rounded-lg bg-accent-from hover:bg-accent-from/90 text-white px-4 py-1.5 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent-from/30 bg-accent-from/5 px-3 py-1 text-xs text-accent-from">
            <Zap className="h-3 w-3" />
            AI-powered engineering intelligence
          </div>
          <h1 className="text-5xl font-bold text-text-primary leading-tight tracking-tight">
            Your team&apos;s knowledge,<br />
            <span className="bg-gradient-to-r from-accent-from to-accent-to bg-clip-text text-transparent">
              unified.
            </span>
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Ask questions about your Jira issues, GitHub PRs, and more — in plain English.
            Alfred connects your tools and gives you instant, cross-platform answers.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent-from to-accent-to text-white px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(99,102,241,0.3)]"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-surface text-text-secondary px-6 py-3 text-sm font-medium hover:text-text-primary hover:bg-bg-elevated transition-colors"
            >
              See how it works
            </a>
          </div>
        </motion.div>
      </section>

      {/* Demo */}
      <section id="demo" className="max-w-4xl mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-bg-surface overflow-hidden shadow-2xl"
        >
          {/* Window chrome */}
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-error/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
            </div>
            <span className="text-xs text-text-muted mx-auto">AlfredAI Chat</span>
          </div>

          <div className="p-6 space-y-4 min-h-[260px]">
            {TYPING_DEMO.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.8, duration: 0.4 }}
                viewport={{ once: true }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-accent-from/20 border border-accent-from/30 text-text-primary rounded-tr-sm'
                    : 'bg-bg-elevated border border-border text-text-primary rounded-tl-sm'
                }`}>
                  <p>{msg.text}</p>
                  {msg.tools && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {msg.tools.map(t => (
                        <span key={t} className="text-[10px] font-mono bg-bg-surface border border-border rounded px-1.5 py-0.5 text-text-muted">
                          ✓ {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Integrations */}
      <section className="border-y border-border py-10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs text-text-muted mb-6 uppercase tracking-widest">Connects with your stack</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {INTEGRATIONS.map(({ name, soon }) => (
              <div key={name} className={`flex items-center gap-2 text-sm ${soon ? 'opacity-40' : 'text-text-secondary'}`}>
                <span className="font-medium">{name}</span>
                {soon && <span className="text-[10px] border border-border rounded px-1 py-0.5 text-text-muted">Soon</span>}
              </div>
            ))}
            <div className="text-sm text-text-muted opacity-40">and more</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Built for engineering teams</h2>
          <p className="text-text-muted">Stop context-switching. Get answers instantly.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Search, title: 'Instant answers', desc: 'Ask about any Jira issue or GitHub PR in plain English. Get context-rich answers in seconds.' },
            { icon: GitBranch, title: 'Cross-tool context', desc: 'See Jira tickets, linked PRs, commits, and review status all in one place.' },
            { icon: Shield, title: 'Human-in-the-loop', desc: 'Alfred asks for your approval before making any changes. Always in control.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-from/10 mb-4">
                <Icon className="h-5 w-5 text-accent-from" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-4 py-20" id="pricing">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Simple, transparent pricing</h2>
          <p className="text-text-muted">Start free. Upgrade when your team grows.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING.map(({ name, price, period, desc, features, cta, highlight }) => (
            <div key={name} className={`rounded-2xl border p-6 flex flex-col ${
              highlight
                ? 'border-accent-from/50 bg-accent-from/5 shadow-[0_0_40px_rgba(99,102,241,0.15)]'
                : 'border-border bg-bg-surface'
            }`}>
              {highlight && (
                <div className="text-[10px] font-medium text-accent-from uppercase tracking-widest mb-3">Most popular</div>
              )}
              <div className="mb-4">
                <div className="text-sm font-medium text-text-secondary mb-1">{name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-text-primary">{price}</span>
                  {period && <span className="text-text-muted">{period}</span>}
                </div>
                <p className="text-xs text-text-muted mt-1">{desc}</p>
              </div>
              <ul className="space-y-2 flex-1 mb-6">
                {features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                    <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`w-full text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                  highlight
                    ? 'bg-gradient-to-r from-accent-from to-accent-to text-white hover:opacity-90'
                    : 'border border-border bg-bg-elevated text-text-secondary hover:text-text-primary hover:bg-bg-subtle'
                }`}
              >
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-accent-from to-accent-to text-white text-[10px] font-bold">A</div>
            <span>AlfredAI</span>
          </div>
          <p>© 2026 AlfredAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

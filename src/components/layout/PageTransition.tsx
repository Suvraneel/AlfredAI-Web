'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

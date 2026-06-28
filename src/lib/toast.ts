import { toast as sonner } from 'sonner'

type SonnerOptions = Parameters<typeof sonner.success>[1]

export const toast = {
  success: (msg: string, opts?: SonnerOptions) =>
    sonner.success(msg, { duration: 4000, ...opts }),
  error: (msg: string, opts?: SonnerOptions) =>
    sonner.error(msg, { duration: Infinity, ...opts }),
  info: (msg: string, opts?: SonnerOptions) => sonner.info(msg, opts),
  warning: (msg: string, opts?: SonnerOptions) => sonner.warning(msg, opts),
}

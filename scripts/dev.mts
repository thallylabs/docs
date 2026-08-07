/**
 * Start the Next.js dev server on the first available port.
 *
 * `next dev -p 3040` aborts with EADDRINUSE when another process (often a
 * second thally site) already holds the port. This launcher probes ports
 * starting from the preferred one and hands the winner to `next dev`, so
 * running several scaffolded sites side by side just works.
 *
 * The preferred port can be overridden with the PORT env var; any extra CLI
 * arguments (e.g. `npm run dev -- --webpack`) are forwarded to `next dev`.
 */

import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'node:net'

const DEFAULT_PORT = 3040
const MAX_ATTEMPTS = 20

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer()
    probe.unref()
    probe.once('error', () => resolve(false))
    // No host argument: binds the same unspecified address (dual-stack `::`
    // where available) that `next dev` binds, so the probe result matches.
    probe.listen(port, () => {
      probe.close(() => resolve(true))
    })
  })
}

async function findAvailablePort(preferred: number): Promise<number> {
  for (let port = preferred; port < preferred + MAX_ATTEMPTS; port++) {
    if (await isPortAvailable(port)) return port
  }
  throw new Error(
    `No available port found in the range ${preferred}-${preferred + MAX_ATTEMPTS - 1}.`,
  )
}

const preferred = Number.parseInt(process.env.PORT ?? '', 10) || DEFAULT_PORT
const port = await findAvailablePort(preferred)
if (port !== preferred) {
  console.warn(`[thally] Port ${preferred} is in use, starting on ${port} instead.`)
}

const require = createRequire(import.meta.url)
const nextBin = require.resolve('next/dist/bin/next')
const child = spawn(
  process.execPath,
  [nextBin, 'dev', '-p', String(port), ...process.argv.slice(2)],
  { stdio: 'inherit' },
)
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 0)
})

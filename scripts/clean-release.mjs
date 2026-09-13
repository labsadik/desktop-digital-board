import { execFileSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

if (process.platform === 'win32') {
  try {
    execFileSync('taskkill', ['/F', '/IM', 'Note Replace.exe'], { stdio: 'ignore' })
  } catch {
    // The app is not running; continue.
  }
}

const releaseDir = path.resolve('release')
await rm(releaseDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 })
console.log(`Cleaned ${releaseDir}`)

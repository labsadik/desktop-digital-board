import { execFileSync } from 'node:child_process'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

if (process.platform === 'win32') {
  try {
    execFileSync('taskkill', ['/F', '/T', '/IM', 'Note Replace.exe'], {
      stdio: 'ignore',
      timeout: 5000,
      windowsHide: true,
    })
  } catch {
    // Process is not running or Windows cleanup timed out; continue.
  }
}

const releaseDir = path.resolve('release')
await rm(releaseDir, {
  recursive: true,
  force: true,
  maxRetries: 10,
  retryDelay: 250,
})

console.log(`Cleaned ${releaseDir}`)

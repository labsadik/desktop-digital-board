import { spawn } from 'node:child_process'
import process from 'node:process'

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const child = spawn(command, ['electron', '.'], {
  stdio: 'inherit',
  shell: false,
  env: { ...process.env, NOTE_REPLACE_DEV: '1' },
})

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error(`Could not start Electron: ${error.message}`)
  process.exit(1)
})

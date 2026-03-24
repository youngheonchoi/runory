import { spawn, spawnSync } from 'node:child_process'

const build = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true,
})

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

const vite = spawn('npm', ['run', 'dev:vite'], {
  stdio: 'inherit',
  shell: true,
})

const pages = spawn('npm', ['run', 'dev:pages-api'], {
  stdio: 'inherit',
  shell: true,
})

const shutdown = () => {
  vite.kill('SIGTERM')
  pages.kill('SIGTERM')
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

vite.on('exit', (code) => {
  pages.kill('SIGTERM')
  process.exit(code ?? 0)
})

pages.on('exit', (code) => {
  vite.kill('SIGTERM')
  process.exit(code ?? 0)
})

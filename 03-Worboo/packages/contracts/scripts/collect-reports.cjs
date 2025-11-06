const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const reportsDir = path.join(rootDir, 'build', 'reports')

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true })
}

const copyIfExists = (src, dest) => {
  if (!fs.existsSync(src)) {
    console.warn(`[report] skipped missing file: ${src}`)
    return
  }
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
  console.log(`[report] copied ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`)
}

ensureDir(reportsDir)

const coverageSrc = path.join(rootDir, 'coverage', 'lcov.info')
const coverageSummarySrc = path.join(rootDir, 'coverage', 'coverage-summary.json')
const gasSrc = path.join(rootDir, 'build', 'gas', 'gas-report.txt')

copyIfExists(coverageSrc, path.join(reportsDir, 'contracts.lcov'))
copyIfExists(coverageSummarySrc, path.join(reportsDir, 'coverage-summary.json'))
copyIfExists(gasSrc, path.join(reportsDir, 'gas-report.txt'))

console.log('[report] evidence collected in build/reports')

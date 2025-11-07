#!/usr/bin/env ts-node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { requestHint } from '../src/client'

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option('endpoint', {
      type: 'string',
      describe: 'Assistant service endpoint (default http://127.0.0.1:8788/hint)',
    })
    .option('prompt', {
      type: 'string',
      demandOption: true,
      describe: 'Prompt text to send to the assistant',
    })
    .option('model', {
      type: 'string',
      describe: 'Optional model identifier',
    })
    .option('header', {
      type: 'array',
      describe: 'Extra header in KEY=VALUE form (repeatable)',
    })
    .help()
    .parse()

  const endpoint =
    (argv.endpoint as string | undefined) ?? 'http://127.0.0.1:8788/hint'
  const headers = Array.isArray(argv.header)
    ? argv.header.reduce<Record<string, string>>((acc, item) => {
        if (typeof item === 'string') {
          const [key, ...rest] = item.split('=')
          const value = rest.join('=')
          if (key && value) {
            acc[key.trim()] = value.trim()
          }
        }
        return acc
      }, {})
    : {}

  const result = await requestHint({
    endpoint,
    prompt: argv.prompt as string,
    model: argv.model as string | undefined,
    headers,
  })

  console.log(JSON.stringify(result, null, 2))
}

main().catch((error) => {
  console.error('[assistant-cli] failed to fetch hint', error)
  process.exitCode = 1
})

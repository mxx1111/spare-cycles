#!/usr/bin/env node

import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const PR_URL = /^https:\/\/github\.com\/([A-Za-z\d](?:[A-Za-z\d-]{0,38}))\/([A-Za-z\d._-]+)\/pull\/([1-9]\d*)$/

export function parsePullRequestUrl(value) {
  const match = typeof value === 'string' ? PR_URL.exec(value) : null
  return match ? { owner: match[1], repo: match[2], number: Number(match[3]) } : null
}

function referencesTask(body, ref, pullRepo, boardRepo) {
  const issue = ref.slice(1)
  const escapedRepo = boardRepo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const fullReference = new RegExp(
    `(?:https:\\/\\/github\\.com\\/${escapedRepo}\\/issues\\/${issue}|${escapedRepo}#${issue})(?!\\d)`,
    'i',
  )
  if (fullReference.test(body)) return true

  return pullRepo.toLowerCase() === boardRepo.toLowerCase() && new RegExp(`(^|\\D)#${issue}(?!\\d)`).test(body)
}

export async function verifyPullRequestEvidence(
  entries,
  { fetchImpl = fetch, token = process.env.GITHUB_TOKEN, boardRepo = process.env.GITHUB_REPOSITORY ?? 'mxx1111/spare-cycles' } = {},
) {
  const errors = []

  for (const entry of entries.filter((item) => item.type === 'settle')) {
    const parsed = parsePullRequestUrl(entry.pr)
    if (!parsed) {
      errors.push(`line ${entry.seq}: settle evidence must be a canonical GitHub pull request URL`)
      continue
    }

    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    const response = await fetchImpl(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/pulls/${parsed.number}`,
      { headers },
    )
    if (!response.ok) {
      errors.push(`line ${entry.seq}: pull request evidence returned HTTP ${response.status}`)
      continue
    }

    const pull = await response.json()
    const eventAt = pull.merged_at ?? pull.closed_at
    if (!eventAt) {
      errors.push(`line ${entry.seq}: pull request evidence is still open`)
    } else if (Date.parse(eventAt) !== Date.parse(entry.ts)) {
      errors.push(`line ${entry.seq}: settle timestamp must equal the pull request mergedAt or closedAt`)
    }

    const pullRepo = `${parsed.owner}/${parsed.repo}`
    if (!referencesTask(pull.body ?? '', entry.ref, pullRepo, boardRepo)) {
      errors.push(`line ${entry.seq}: pull request does not reference ${boardRepo}${entry.ref}`)
    }
  }

  return errors
}

async function main() {
  const pathArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'))
  const ledgerPath = pathArg ? resolve(pathArg) : join(HERE, 'ledger.jsonl')
  const entries = readFileSync(ledgerPath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('//'))
    .map((line) => JSON.parse(line))
  const errors = await verifyPullRequestEvidence(entries)

  if (errors.length) {
    for (const error of errors) console.error(error)
    process.exit(1)
  }
  console.log(`Verified ${entries.filter((entry) => entry.type === 'settle').length} settlement pull request(s).`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main()

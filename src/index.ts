#!/usr/bin/env node
import pLimit from 'p-limit'
import { intro, note, outro, select } from '@clack/prompts'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'
import clipboard from 'clipboardy'
import minimist from 'minimist'
import { summarizeDiff, summarizePullRequest } from './api'
import { createBar } from './progress'
import { getGitDiff } from './git'
const { log } = console

/**
 * The maximum number of commits that can be summarized.
 */
const MAX_COMMITS = 10

async function main() {
    const args = minimist(process.argv.slice(2))

    const numberOfCommits = args.last ? parseInt(args.last, 10) : undefined
    const gitDiffFiles = await getGitDiff((numberOfCommits && numberOfCommits >= 1 && numberOfCommits <= MAX_COMMITS) ? numberOfCommits + 1 : undefined)

    const limit = pLimit(10)
    intro('deto')
    note(`Summarizing ${gitDiffFiles.length} files.`)

    const diffProgress = createBar({ barSize: 15, format: '→ {bar} Understanding changes' })
    diffProgress.start(gitDiffFiles.length, 0)
    const diffSummaryList = await Promise.all(gitDiffFiles.map(async (gitDiffFile) => {
        const { diff } = gitDiffFile
        const summary = await limit(() => summarizeDiff(diff))
        diffProgress.increment()
        return summary
    }))
    diffProgress.stop()

    const summaryProgress = createBar({ barSize: 15, format: '→ {bar} Summarizing changes', pulse: true })
    summaryProgress.start(1, 0)
    const pullRequestSummary = await summarizePullRequest(diffSummaryList, args.t)
    summaryProgress.increment()
    summaryProgress.stop()

    const renderer = new TerminalRenderer()
    marked.setOptions({
        renderer,
    })

    log(`\n${marked(pullRequestSummary)}\n`)

    const copyToClipboard = await select({
        message: 'Do you want to copy this summary to your clipboard?',
        options: [{ label: 'Yes', value: true }, { label: 'No', value: false }],
    })

    if (copyToClipboard) {
        clipboard.writeSync(pullRequestSummary)
        note('Copied to clipboard!')
    }

    outro('bye bye!')
}

main()

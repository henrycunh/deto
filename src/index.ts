#!/usr/bin/env node
import { style } from 'kleur-template'
import pLimit from 'p-limit'
import { intro, note, outro, select } from '@clack/prompts'
import { marked } from 'marked'
import TerminalRenderer from 'marked-terminal'
import clipboard from 'clipboardy'
import minimist from 'minimist'
import { $, hasBinary } from './command'
import { handle } from './util'
import { summarizeDiff, summarizePullRequest } from './api'
import { createBar } from './progress'
const { log } = console

async function getGitDiff() {
    if (!hasBinary('git')) {
        log(style`[Git is not installed](red.bold)`)
        process.exit(1)
    }
    // Check if we're in a git repository
    const gitStatus = await handle($('git status'))
    if (gitStatus.error) {
        log(style`[Not in a git repository](red.bold)`)
        process.exit(1)
    }

    // Check if we're on a branch
    const gitBranch = await handle($('git branch --show-current'))
    if (gitBranch.error) {
        log(style`[Error getting current branch](red.bold)`)
        log(style`[Error: ${gitBranch.error.message}](gray)`)
        process.exit(1)
    }

    const currentBranch = gitBranch.data.trim()

    // List all the files that have been changed
    const gitDiff = await handle($(`git diff --name-only ${currentBranch}`))
    if (gitDiff.error) {
        log(style`[Error getting git diff](red.bold)`)
        log(style`[Error: ${gitDiff.error.message}](gray)`)
        process.exit(1)
    }

    const files = gitDiff.data.split('\n').filter(Boolean)
    if (files.length === 0) {
        log(style`[No changes found in the repository](red.bold)`)
        process.exit(1)
    }

    // Get the diff for each file
    const gitDiffFiles = await Promise.all(files.map(async (file) => {
        const gitDiffFile = await handle($(`git diff ${currentBranch} -- ${file}`))
        if (gitDiffFile.error) {
            log(style`[Error getting git diff for ${file}](red.bold)`)
            log(style`[Error: ${gitDiffFile.error.message}](gray)`)
            process.exit(1)
        }
        return {
            file,
            diff: gitDiffFile.data,
            tokens: gitDiffFile.data.length / 4,
        }
    }))
    return gitDiffFiles.filter(({ tokens }) => tokens > 0 && tokens < 3000)
}

async function main() {
    const args = minimist(process.argv.slice(2))
    const gitDiffFiles = await getGitDiff()
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

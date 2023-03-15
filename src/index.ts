#!/usr/bin/env node
import { style } from 'kleur-template'
import { $, hasBinary } from './command'
import { handle } from './util'
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
    // Check if there are any changes
    const gitDiff = await handle($('git diff'))
    if (gitDiff.error) {
        log(style`[No changes to commit](red.bold)`)
        process.exit(1)
    }
    return gitDiff.data
}

function main() {
    // getGitDiff().then(console.log)
}

main()

// function createClient(systemMessage: string) {
//     const client = new ChatGPTAPI({
//         apiKey: process.env.OPENAI_API_KEY || '',
//         systemMessage,
//     })
//     return client
// }

// function formatMessage(diff: string) {
//     return [
//         '## Diff',
//         '```diff',
//         diff,
//         '```',
//         '## Summary',
//     ].filter(Boolean).join('\n')
// }

// export default async function main() {
//     const files = CommitDiff.split('diff --git').filter(Boolean).map(file => (`diff --git${file}`).trim())
//     const diffSummarizer = createClient([
//         'You\'re a world expert machine on summarizing diffs and pull requests.',
//         'The user will provide the diff of a file per message, on order of appearance, and you\'ll summarize it.',
//         'Use the context of the previous messages to understand the diff.',
//         'The user will send a final message to ask for the summary of the pull request.',
//     ].join(' '))
//     let lastMessageId = ''
//     const context = []

//     for (const file of files) {
//         const message = formatMessage(file)
//         const response = await diffSummarizer.sendMessage(
//             message,
//             { parentMessageId: lastMessageId },
//         )
//         lastMessageId = response.id
//         context.push(response.text)
//         console.log(`${response.text}\n\n`)
//     }

//     const pullRequestSummarizer = createClient([
//         'You\'re a world expert machine on summarizing pull requests.',
//         'The user will provide a list of changes.',
//         'Summarize the changes in a way thats easy to understand.',
//         'Both product and engineering teams will use this summary to understand the changes.',
//         'Explain following this format:\n## what\n## why\n## how',
//     ].join(' '))
//     const response = await pullRequestSummarizer.sendMessage(
//         context.map(change => `- ${change}`).join('\n\n'),
//     )
//     console.log(`### SUMMARY ###\n\n${response.text}\n\n`)
// }

// main()

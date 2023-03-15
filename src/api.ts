import { ChatGPTAPI } from 'chatgpt'

function createClient(systemMessage: string) {
    const client = new ChatGPTAPI({
        apiKey: process.env.OPENAI_API_KEY || '',
        systemMessage,
        completionParams: {
            temperature: 0,
        },
    })
    return client
}

export async function summarizeDiff(diff: string) {
    const client = createClient([
        'You are a machine that summarizes diffs, the user always inputs a git diff.',
        'You only output the summary of the diff.',
        'It\'s readable and understandable by both engineers and product managers.',
        'Give only a very high-level summary of the diff.',
    ].join(' '))
    const { text: summary } = await client.sendMessage(diff)
    return summary
}

export async function summarizePullRequest(diff: string[], extraContext?: string) {
    const client = createClient([
        'You are a machine that summarizes pull requests, the user always inputs a list of descriptions of changes, separated by ---.',
        'Think of the changes one by one, and predict the context that emerges from the changes made.',
        'Always give a very high-level summary of the pull request, in markdown, using headings and lists where possible, if necessary.',
        extraContext,
    ].filter(Boolean).join(' '))
    const { text: summary } = await client.sendMessage(diff.join('\n---\n'))
    return summary
}

import { style } from 'kleur-template'
import { $, hasBinary } from './command'
import { handle } from './util'
const { log } = console

/**
 * Validate if the current directory is a git repository
 * and that git is installed.
 */
async function validate() {
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
}

/**
 * Returns the current branch name. Assumes that the current
 * directory is a git repository, and that git is installed.
 */
async function getCurrentBranch(): Promise<string> {
    const gitBranch = await handle($('git branch --show-current'))
    if (gitBranch.error) {
        log(style`[Error getting current branch](red.bold)`)
        log(style`[Error: ${gitBranch.error.message}](gray)`)
        process.exit(1)
    }

    return gitBranch.data.trim()
}

interface GitDiff {
    file: string
    diff: string
    tokens: number
}

async function getUnstagedFiles(branch: string): Promise<GitDiff[]> {
    // List all the files that have been changed
    const gitDiff = await handle($(`git diff --name-only ${branch}`))
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

    const gitDiffFiles = await Promise.all(files.map(async (file) => {
        const gitDiffFile = await handle($(`git diff ${branch} -- ${file}`))
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

async function getDiffFromCommitsHistoryFiles(numberOfCommits: number): Promise<GitDiff[]> {
    const gitCommits = await handle($(`git log -n ${numberOfCommits} --pretty=format:%H`))
    if (gitCommits.error) {
        log(style`[Error getting git commits](red.bold)`)
        log(style`[Error: ${gitCommits.error.message}](gray)`)
        process.exit(1)
    }

    const commits = gitCommits.data.split('\n').filter(Boolean)

    const diffFiles = await Promise.all(
        commits.map(async (commit) => {
            const gitFiles = await handle($(`git diff ${commit} --name-only`))
            if (gitFiles.error) {
                log(style`[Error getting git diff](red.bold)`)
                log(style`[Error: ${gitFiles.error.message}](gray)`)
                process.exit(1)
            }

            const files = gitFiles.data.split('\n').filter(Boolean)

            const gitDiffFiles = await Promise.all(
                files.map(async (file) => {
                    const gitDiffFile = await handle($(`git diff ${commit} -- ${file}`))
                    if (gitDiffFile.error) {
                        log(style`[Error getting git diff for ${file}](red.bold)`)
                        log(style`[Error: ${gitDiffFile.error.message}](gray)`)
                        process.exit(1)
                    }
                    const diff = gitDiffFile.data
                    const tokens = diff.split(/\s+/).length
                    return {
                        file,
                        diff,
                        tokens,
                    }
                }),
            )
            return gitDiffFiles.filter(({ tokens }) => tokens > 0 && tokens < 3000)
        }),
    )

    const files = diffFiles.flat()

    if (files.length === 0) {
        log(style`[No changes found in the repository](red.bold)`)
        process.exit(1)
    }

    // Merge files with the same name
    const mergedFiles: GitDiff[] = []

    // We need to verify to check if there is a better way to do this.
    files.forEach((file) => {
        const index = mergedFiles.findIndex((f: GitDiff) => f.file === file.file)
        if (index === -1) {
            mergedFiles.push(file)
        }
        else {
            mergedFiles[index].diff += file.diff
            mergedFiles[index].tokens += file.tokens
        }
    })

    return mergedFiles
}

export async function getGitDiff(numberOfCommits?: number) {
    await validate()
    const currentBranch = await getCurrentBranch()

    if (numberOfCommits && numberOfCommits > 0)
        return await getDiffFromCommitsHistoryFiles(numberOfCommits)

    return await getUnstagedFiles(currentBranch)
}

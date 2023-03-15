import { exec } from 'child_process'
import which from 'which'

export function $(command: string) {
    return new Promise<string>((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error)
                return
            }
            if (stderr) {
                reject(stderr)
                return
            }
            resolve(stdout)
        })
    })
}

export function hasBinary(binary: string) {
    try {
        which.sync(binary)
        return true
    }
    catch (error) {
        return false
    }
}

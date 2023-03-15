export async function handle<T>(promise: Promise<T>): Promise<{
    error: Error
    data: null
} | {
    error: null
    data: T
}> {
    try {
        const data = await promise
        return { error: null, data }
    }
    catch (error) {
        return { error: error as Error, data: null }
    }
}

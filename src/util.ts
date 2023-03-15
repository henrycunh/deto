export async function handle<T>(promise: Promise<T>): Promise<{
    error: Error | null
    data: T | null
}> {
    try {
        const data = await promise
        return { error: null, data }
    }
    catch (error) {
        return { error: error as Error, data: null }
    }
}

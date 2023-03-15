import CliProgress from 'cli-progress'

export const colorize = (text: string, color: string) => {
    color = color.replace('#', '')
    color = color.length === 3 ? color.split('').map(c => c + c).join('') : color
    const [r, g, b] = color.match(/.{2}/g)!.map(c => parseInt(c, 16))
    const setColorString = `\x1B[38;2;${r};${g};${b}m`
    const resetFormatString = '\x1B[0m'
    return `${setColorString}${text}${resetFormatString}`
}

export const createBar = (options?: {
    barSize?: number
    pulse?: boolean
    speed?: number
    format?: string
}) => {
    let frame = 0
    let interval: NodeJS.Timer | undefined

    const pulseColorList = [
        '#3a3a3a', '#3e393b', '#4c383f', '#613545', '#7b334d', '#b72c5e', '#d12a66', '#e6276c',
        '#f42670', '#f92672', '#f42670', '#e6276c', '#d12a66', '#b72c5e', '#993056', '#7b334d',
        '#613545', '#4c383f',
    ]

    const completeColor = '#f92672'
    const incompleteColor = '#525252'
    const finishedColor = '#729c1f'

    const bar = new CliProgress.SingleBar({
        formatBar: (progress) => {
            const char = '━'
            const barSize = options?.barSize || 10
            if (options?.pulse) {
                if (progress === 1)
                    return colorize(char.repeat(barSize), finishedColor)

                const speed = options?.speed || 10
                const bar = new Array(barSize).fill(0).map((_, i) => {
                    const color = pulseColorList[(Math.round(frame * speed / 100) + i) % pulseColorList.length]
                    return colorize(char, color)
                }).join('')
                return bar
            }

            const complete = Math.round(progress * barSize)

            if (progress === 1)
                return colorize(char.repeat(barSize), finishedColor)

            const bar = new Array(barSize).fill(0).map((_, i) => {
                if (i < complete)
                    return colorize(char, completeColor)

                else if (i < complete + 1)
                    return colorize('╸', completeColor)

                else
                    return colorize(char, incompleteColor)
            }).join('')

            return bar
        },
        fps: 60,
        barsize: 10,
        format: options?.format || '{bar} {percentage}% | {value}/{total}',
    })

    bar.on('start', () => {
        interval = setInterval(() => {
            bar.render()
            frame++
        }, 10)
    })

    bar.on('stop', () => {
        clearInterval(interval)
    })
    return bar
}

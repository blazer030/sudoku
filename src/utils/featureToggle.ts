type FeatureEnvironment = 'all' | 'develop'

const features: Partial<Record<string, FeatureEnvironment>> = {
    walkthroughTestButtons: 'develop',
}

export const isDevelop = (): boolean =>
    import.meta.env.VITE_APP_ENV === 'develop'

export const isFeatureEnabled = (name: string): boolean => {
    const env = features[name]
    if (env == null) return false
    if (env === 'all') return true
    return isDevelop()
}

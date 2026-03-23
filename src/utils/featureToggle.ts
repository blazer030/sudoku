type FeatureEnvironment = 'all' | 'develop'

const features: Partial<Record<string, FeatureEnvironment>> = {
    // 'featureName': 'develop',  // develop 環境才有
    // 'featureName': 'all',      // 所有環境都有
}

export const isDevelop = (): boolean =>
    import.meta.env.VITE_APP_ENV === 'develop'

export const isFeatureEnabled = (name: string): boolean => {
    const env = features[name]
    if (env == null) return false
    if (env === 'all') return true
    return isDevelop()
}

type FeatureEnvironment = 'all' | 'develop'

const features = {
    // The changes waiting for the next release, on top of the changelog
    changelogUnreleased: 'develop',
} as const satisfies Record<string, FeatureEnvironment>

export type FeatureName = keyof typeof features

// Looked up as a plain map, so a feature's environment is not narrowed to the one it has today
const environments: Partial<Record<string, FeatureEnvironment>> = features

export const isDevelop = (): boolean =>
    import.meta.env.VITE_APP_ENV === 'develop'

export const isFeatureEnabled = (name: FeatureName): boolean => {
    const env = environments[name]
    if (env == null) return false
    if (env === 'all') return true
    return isDevelop()
}

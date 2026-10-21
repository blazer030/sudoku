# Release Process

Every release ships two artifacts from the same commit:

- **Web** — GitHub Pages, deployed automatically by `.github/workflows/gh-pages.yml` on every push to `master`.
- **Android** — an AAB uploaded to Google Play by hand. The web assets are bundled inside the AAB, so the app on users' phones only changes when a new AAB is uploaded.

Branching follows git flow (`master` / `develop`, `release/*`, `hotfix/*`, tags without a `v` prefix).

## Version Numbers

- `package.json` is the single source of truth. Bump it **on the release or hotfix branch**, never on `develop`.
- `android/app/build.gradle` reads it: `versionName` = the version string, `versionCode` = `major * 10000 + minor * 100 + patch` (e.g. `2.1.3` → `20103`).
- Versions must be plain `MAJOR.MINOR.PATCH` with minor and patch ≤ 99; anything else fails the Android build on purpose.
- Use `npm version <x.y.z> --no-git-tag-version` so the only tag is the one git flow creates.

## Prerequisites (per machine)

These are gitignored and must exist before building a release AAB:

- `android/key.properties` + the upload keystore it points to
- `android/app/google-services.json` (Firebase Console, project `sudoku-1878c`)
- JDK 21 for Gradle (`JAVA_HOME`), Android SDK in `android/local.properties`

## Steps

1. **Check `develop`** — `npx vitest run`, `npm run lint`, `npx vue-tsc --noEmit` all pass.
2. **Start the release**
   ```bash
   git flow release start <x.y.z>
   npm version <x.y.z> --no-git-tag-version
   ```
3. **Update the changelog** — add an entry (version, release date, user-facing changes) at the top of `src/presentation/pages/settings/changelogData.ts`; mark Android-only items with `(App)`.
   Commit: `🚧 chore: release <x.y.z>`.
4. **Build and smoke-test Android**
   ```bash
   npm run android:build:release
   cd android && ./gradlew bundleRelease
   ```
   Output: `android/app/build/outputs/bundle/release/app-release.aab`.
   Upload to Play Console → Testing → **Internal testing**, install on a device and check: game start / complete, saved game survives an app restart, statistics, donate purchase (License Tester account), launcher icon toggle.
   Fixes found here are committed on the release branch; rebuild and re-upload after each fix.
5. **Finish the release**
   ```bash
   git flow release finish <x.y.z>
   git push origin master develop --tags
   ```
   The push to `master` deploys the web version; confirm the site loads and Settings → Changelog shows the new version.
6. **Promote Android** — in Play Console, promote the tested Internal testing release to Production. Do not rebuild: the AAB already tested is the one that ships.

## Hotfix

Same as above, with `git flow hotfix start <x.y.z>` / `git flow hotfix finish <x.y.z>` and a patch bump. If the fix only affects one platform, the other may skip its upload; `versionCode` values do not need to be consecutive.

#!/usr/bin/env bash
# Builds the working tree as a develop build and copies it to the test server on the NAS.
# Usage: npm run deploy:nas [-- --skip-tests]
# Settings come from .env.nas.local; see deploy/nas/README.md.
set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
settings_file="$project_root/.env.nas.local"
run_tests=true

for argument in "$@"; do
    case "$argument" in
        --skip-tests) run_tests=false ;;
        *) echo "Unknown option: $argument" >&2; exit 1 ;;
    esac
done

if [[ ! -f "$settings_file" ]]; then
    echo "Missing $settings_file; see deploy/nas/README.md." >&2
    exit 1
fi
# shellcheck disable=SC1090
source "$settings_file"
: "${NAS_HOST:?Set NAS_HOST in .env.nas.local}"
: "${NAS_DIR:?Set NAS_DIR in .env.nas.local}"
nas_port="${NAS_PORT:-22}"

cd "$project_root"

if [[ "$run_tests" == true ]]; then
    npx vitest run
fi

# Not .env.production's settings: they report to the real analytics.
VITE_BASE_URL=/ VITE_APP_ENV=develop npm run build

# index.html goes last, so a page loaded mid-copy never names a file that isn't there yet.
remote_shell="ssh -p $nas_port"
rsync -rtz --delete-after --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r --exclude=index.html -e "$remote_shell" \
    dist/ "$NAS_HOST:$NAS_DIR/site/"
rsync -tz --chmod=Fu=rw,Fgo=r -e "$remote_shell" dist/index.html "$NAS_HOST:$NAS_DIR/site/index.html"
rsync -tz --chmod=Fu=rw,Fgo=r -e "$remote_shell" deploy/nas/compose.yaml deploy/nas/nginx.conf "$NAS_HOST:$NAS_DIR/"

# The tunnel's token, readable by the owner only; sent on stdin so it never shows in a process list.
if [[ -n "${NAS_TUNNEL_TOKEN:-}" ]]; then
    printf 'TUNNEL_TOKEN=%s\n' "$NAS_TUNNEL_TOKEN" | ssh -p "$nas_port" "$NAS_HOST" "umask 077 && cat > '$NAS_DIR/.env'"
fi

echo "Deployed $(git rev-parse --short HEAD)$(git diff --quiet HEAD || echo ' with uncommitted changes') to $NAS_HOST:$NAS_DIR"

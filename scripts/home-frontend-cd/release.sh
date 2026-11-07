#!/bin/sh
# Installed, reviewed controller code only. Never execute code from the artifact.
set -eu
root=${RELEASE_ROOT:-/releases}
source_dir=${ARTIFACT_ROOT:-/incoming}
control=${CONTROL_ROOT:-/control}
health=${HEALTH_ORIGIN:-http://fileisland-web-candidate:8080}
sha=${1:?Expected SHA}
run=${2:?Expected workflow run ID}
case "$sha" in *[!a-f0-9]*|'') echo 'Invalid SHA' >&2; exit 2;; esac
[ "${#sha}" -eq 40 ] || exit 2
case "$run" in *[!0-9]*|'') echo 'Invalid run ID' >&2; exit 2;; esac
[ -d "$root" ] && [ ! -L "$root" ] || exit 2
mkdir "$root/.deploy-lock" || { echo 'Deployment locked; inspect prior attempt' >&2; exit 3; }
switched=0
committed=0
previous=''
next="$root/.next-$sha-$$"
cleanup(){
  status=$?
  trap - EXIT INT TERM
  if [ "$switched" -eq 1 ] && [ "$committed" -eq 0 ]; then
    ln -s "$previous" "$next.rollback"
    if ! mv -Tf "$next.rollback" "$root/current"; then echo 'ROLLBACK FAILED; lock retained' >&2; exit 90; fi
    echo 'ROLLED_BACK' >&2
  fi
  rm -f "$next"
  rm -f "$root/.deploy-lock/version.json" "$root/.deploy-lock/index.html"
  rmdir "$root/.deploy-lock"
  exit "$status"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
[ -L "$root/current" ] || { echo 'Bootstrap current release before enabling CD' >&2; exit 4; }
previous=$(readlink "$root/current")
case "$previous" in releases/*) old_sha=${previous#releases/};; *) exit 4;; esac
case "$old_sha" in *[!a-f0-9]*|'') exit 4;; esac
[ "${#old_sha}" -eq 40 ] && [ -d "$root/$previous" ] || exit 4
if [ -f "$root/last-successful-run" ]; then last=$(cat "$root/last-successful-run");case "$last" in *[!0-9]*|'') exit 4;; esac;[ "$run" -ge "$last" ] || { echo 'Stale CI run rejected' >&2;exit 5; };fi
stage="$root/.staged-$sha-$$"
mkdir -p "$root/releases"
mkdir "$stage"
while IFS= read -r rel; do
  [ -n "$rel" ] || exit 6
  mkdir -p "$stage/$(dirname "$rel")"
  cp "$source_dir/$rel" "$stage/$rel"
done < "$control/FILES"
(cd "$stage"; sha256sum -c "$control/SHA256SUMS" >/dev/null)
if [ -e "$root/releases/$sha" ]; then
  (cd "$root/releases/$sha"; sha256sum -c "$control/SHA256SUMS" >/dev/null)
  [ "$(find "$root/releases/$sha" -type f | wc -l)" -eq "$(wc -l < "$control/FILES")" ] || exit 6
  [ -z "$(find "$root/releases/$sha" -mindepth 1 ! -type d ! -type f -print)" ] || exit 6
  # Only this invocation's freshly created, verified temporary stage is removed.
  rm -rf "$stage"
else
  mv "$stage" "$root/releases/$sha"
fi
printf '%s\n%s\n%s\n' "$previous" "releases/$sha" "$run" > "$root/deployment-journal"
ln -s "releases/$sha" "$next"
mv -Tf "$next" "$root/current"
switched=1
health_path=$(cat "$control/HEALTH_PATH")
case "$health_path" in /|/auth/login.html) ;; *) exit 7;; esac
ok=0
for attempt in 1 2 3; do
  if wget -q -T 5 -O "$root/.deploy-lock/version.json" "$health/app-version.json" && cmp -s "$root/.deploy-lock/version.json" "$root/releases/$sha/app-version.json" && wget -q -T 5 -O "$root/.deploy-lock/index.html" "$health$health_path"; then
    actual=$(sha256sum "$root/.deploy-lock/index.html" | cut -d ' ' -f 1)
    if [ "$actual" = "$(cat "$control/HEALTH_SHA256")" ]; then ok=1;break;fi
  fi
  sleep 1
done
[ "$ok" -eq 1 ] || { echo 'New release health verification failed' >&2;exit 7; }
printf '%s\n' "$run" > "$root/.last-successful-run-$run"
mv -f "$root/.last-successful-run-$run" "$root/last-successful-run"
committed=1
rm -f "$root/.deploy-lock/version.json" "$root/.deploy-lock/index.html"
printf 'DEPLOYED %s\n' "$sha"

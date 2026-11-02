#!/bin/sh
# One-time approved initialization of an EMPTY dedicated FE volume only.
set -eu
root=${RELEASE_ROOT:-/releases}
source_dir=${ARTIFACT_ROOT:-/incoming}
control=${CONTROL_ROOT:-/control}
sha=${1:?Expected bootstrap SHA}
case "$sha" in *[!a-f0-9]*|'') exit 2;; esac
[ "${#sha}" -eq 40 ] && [ -d "$root" ] && [ ! -L "$root" ] || exit 2
[ -z "$(find "$root" -mindepth 1 -maxdepth 1 -print)" ] || { echo 'Bootstrap requires an empty FE volume' >&2;exit 3; }
mkdir "$root/.bootstrap-lock"
trap 'rmdir "$root/.bootstrap-lock"' EXIT
[ "$(find "$root" -mindepth 1 -maxdepth 1 -print)" = "$root/.bootstrap-lock" ] || exit 3
stage="$root/.bootstrap-$sha"
mkdir -p "$root/releases" "$stage"
while IFS= read -r rel;do mkdir -p "$stage/$(dirname "$rel")";cp "$source_dir/$rel" "$stage/$rel";done < "$control/FILES"
(cd "$stage";sha256sum -c "$control/SHA256SUMS" >/dev/null)
mv "$stage" "$root/releases/$sha"
ln -s "releases/$sha" "$root/current"
printf 'BOOTSTRAPPED %s\n' "$sha"

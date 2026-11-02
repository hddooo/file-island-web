#!/bin/sh
set -eu
export RELEASE_ROOT=/tmp/fe-store
export HEALTH_ORIGIN=http://127.0.0.1:8080
a=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
b=bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
c=cccccccccccccccccccccccccccccccccccccccc
d=dddddddddddddddddddddddddddddddddddddddd
mkdir -p "$RELEASE_ROOT"
ARTIFACT_ROOT=/fixtures/a/site CONTROL_ROOT=/fixtures/a/control /bin/sh /tests/bootstrap.sh "$a"
if ARTIFACT_ROOT=/fixtures/a/site CONTROL_ROOT=/fixtures/a/control /bin/sh /tests/bootstrap.sh "$a";then exit 1;fi
echo 'PASS verified bootstrap refuses existing release store'
nginx -c /tests/integration-nginx.conf
for n in 1 2 3 4 5; do wget -q -O /tmp/ready "$HEALTH_ORIGIN/app-version.json" && break || sleep 1;done
run(){ ARTIFACT_ROOT="/fixtures/$1/site" CONTROL_ROOT="/fixtures/$1/control" /bin/sh /tests/release.sh "$2" "$3"; }
if run d "$d" 2; then echo 'Tampered stage accepted' >&2;exit 1;fi
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$a" ]
echo 'PASS post-copy checksum failure preserves old release'
if HEALTH_ORIGIN=http://127.0.0.1:1 run b "$b" 2; then exit 1;fi
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$a" ] && [ ! -d "$RELEASE_ROOT/.deploy-lock" ]
echo 'PASS failed post-switch health rolls back and unlocks'
run b "$b" 2
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$b" ]
wget -q -O /tmp/old-asset "$HEALTH_ORIGIN/media/app.js?build=$a"
cmp /tmp/old-asset "/fixtures/a/site/media/app.js"
echo 'PASS atomic success and previous build asset retention'
if run a "$a" 1; then exit 1;fi
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$b" ]
echo 'PASS stale CI run rejected'
HEALTH_ORIGIN=http://127.0.0.1:1 ARTIFACT_ROOT=/fixtures/c/site CONTROL_ROOT=/fixtures/c/control /bin/sh /tests/release.sh "$c" 3 &
pending=$!
for n in $(seq 1 40);do [ "$(readlink "$RELEASE_ROOT/current")" = "releases/$c" ] && break || sleep .05;done
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$c" ]
if run b "$b" 4; then exit 1;fi
kill -TERM "$pending"
if wait "$pending";then exit 1;fi
[ "$(readlink "$RELEASE_ROOT/current")" = "releases/$b" ] && [ ! -d "$RELEASE_ROOT/.deploy-lock" ]
echo 'PASS concurrent deploy rejected; interrupted activation restores previous release'
run b "$b" 2
echo 'PASS idempotent verified redeploy'
nginx -s quit -c /tests/integration-nginx.conf

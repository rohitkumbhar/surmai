#!/usr/bin/env sh
# Runs the Go tests with coverage measured across all packages (so that e.g.
# route tests count towards the hooks they trigger) and prints the total.
#
# Migrations and test helpers are excluded since every test app runs all migrations.
#
# Usage: scripts/coverage.sh [min-total-percent]
set -eu

cd "$(dirname "$0")/.."

packages=$(go list ./... | grep -v -e '/migrations$' -e '/testutil$' | paste -sd, -)

go test -race -coverpkg="$packages" -coverprofile=coverage.out ./...

total=$(go tool cover -func=coverage.out | awk '/^total:/ { sub("%", "", $3); print $3 }')
echo "Total Go coverage: ${total}%"

if [ $# -gt 0 ]; then
  if awk -v total="$total" -v min="$1" 'BEGIN { exit !(total < min) }'; then
    echo "Coverage ${total}% is below the required ${1}%"
    exit 1
  fi
fi

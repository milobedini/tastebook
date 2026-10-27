#!/usr/bin/env bash
# Vercel's Ignored Build Step, the top-level ignoreCommand in vercel.json: exit 0 skips the build, exit 1 builds.
# Builds unless it can show that nothing Vercel serves changed since the branch's last successful deployment.
# One check covers the whole deployment, so a preview's two services build, or skip, together.

set -u

if [ -z "${VERCEL_GIT_PREVIOUS_SHA:-}" ]; then
  echo "No earlier deployment on this branch: building."
  exit 1
fi

# The paths below are from the repo's root, wherever Vercel runs the command from.
cd "$(git rev-parse --show-toplevel)" || exit 1

git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- \
  frontend backend vercel.json package.json pnpm-lock.yaml pnpm-workspace.yaml tools/vercel
status=$?

if [ "$status" -eq 0 ]; then
  echo "Nothing the app is built from changed since $VERCEL_GIT_PREVIOUS_SHA: skipping the build."
  exit 0
fi

# 1 means a change; anything else is git failing, for example on a commit missing from Vercel's shallow clone.
echo "The app changed since $VERCEL_GIT_PREVIOUS_SHA, or git couldn't tell: building."
exit 1

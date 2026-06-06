#!/usr/bin/env bash
# Source before running go commands if `go` is not on PATH:
#   source scripts/env-go.sh

if command -v go >/dev/null 2>&1; then
  return 0 2>/dev/null || exit 0
fi

if [ -x "$HOME/.local/go-toolchain/bin/go" ]; then
  export PATH="$HOME/.local/go-toolchain/bin:$PATH"
  export GOROOT="$HOME/.local/go-toolchain"
elif [ -x "$HOME/go/bin/go" ]; then
  export PATH="$HOME/go/bin:$PATH"
fi

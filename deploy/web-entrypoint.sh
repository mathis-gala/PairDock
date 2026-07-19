#!/bin/sh
set -eu

if [ -z "${PAIRDOCK_API_URL:-}" ]; then
  echo "PAIRDOCK_API_URL is required" >&2
  exit 1
fi

case "$PAIRDOCK_API_URL" in
  http://* | https://*) ;;
  *)
    echo "PAIRDOCK_API_URL must be an absolute HTTP(S) URL" >&2
    exit 1
    ;;
esac

if printf '%s' "$PAIRDOCK_API_URL" | LC_ALL=C grep -q '[\\"[:space:][:cntrl:]]'; then
  echo "PAIRDOCK_API_URL contains unsupported characters" >&2
  exit 1
fi

umask 077
printf 'window.__PAIRDOCK_CONFIG__ = {"apiBaseUrl":"%s"};\n' "$PAIRDOCK_API_URL" > /tmp/pairdock-config.js

exec nginx -g 'daemon off;'

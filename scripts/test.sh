#!/usr/bin/env bash
set -e

echo ">>> Running Backend Tests..."
cd apps/api
source .venv/bin/activate 2>/dev/null || true
pytest -v
cd ../..

echo ">>> Running Frontend Tests..."
cd apps/web
npm run test
cd ../..

echo ">>> ALL TESTS PASSED!"

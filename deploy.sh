#!/bin/bash
# ─────────────────────────────────────────────
#  TastyBites — Deploy to Vercel
#  Usage:
#    ./deploy.sh           → deploy both frontend + backend
#    ./deploy.sh frontend  → deploy frontend only
#    ./deploy.sh backend   → deploy backend only
# ─────────────────────────────────────────────

set -e

NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
nvm use 20 --silent 2>/dev/null || true

TARGET=${1:-both}

deploy_frontend() {
  echo ""
  echo "🚀 Deploying frontend..."
  (cd apps/frontend && npx vercel deploy --prod --yes)
  echo "✅ Frontend deployed → https://tastybites-almhult.vercel.app"
}

deploy_backend() {
  echo ""
  echo "🚀 Deploying backend..."
  (cd apps/backend && npx vercel deploy --prod --yes)
  echo "✅ Backend deployed → https://backend-omega-ten-16.vercel.app"
}

case "$TARGET" in
  frontend) deploy_frontend ;;
  backend)  deploy_backend ;;
  both)
    deploy_frontend
    deploy_backend
    echo ""
    echo "🎉 All done!"
    echo "   Frontend: https://tastybites-almhult.vercel.app"
    echo "   Backend:  https://backend-omega-ten-16.vercel.app"
    ;;
  *)
    echo "Unknown target: $TARGET. Use: frontend | backend | both"
    exit 1
    ;;
esac

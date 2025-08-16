#!/bin/bash

echo "🧹 Starting endpoint cleanup..."

# Function to safely remove file after confirmation
safe_remove() {
  local file="$1"
  local reason="$2"
  
  if [ -f "$file" ]; then
    echo "📄 Found: $file"
    echo "   Reason: $reason"
    echo "   Content preview:"
    head -10 "$file" | sed 's/^/     /'
    
    read -p "   Remove this file? (y/N): " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
      rm "$file"
      echo "   ✅ Removed"
    else
      echo "   ⏭️  Skipped"
    fi
    echo ""
  fi
}

# Remove duplicate auth endpoints
safe_remove "apps/web/src/app/api/auth/login/route.ts" "Replaced by unified-login"
safe_remove "apps/web/src/app/api/auth/register/route.ts" "Replaced by unified-register"
safe_remove "apps/web/src/app/api/auth/signin/route.ts" "Replaced by unified-login"
safe_remove "apps/web/src/app/api/mobile/v1/auth/register/route.ts" "Using redirect to unified"

echo "🎉 Endpoint cleanup complete!"
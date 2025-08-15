#!/bin/bash

echo "🚀 Setting up StarTynk monorepo..."

# Check Node version
NODE_VERSION=$(node -v | cut -d 'v' -f 2)
MIN_NODE_VERSION="18.17.0"

if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
  echo "❌ Node version must be >= $MIN_NODE_VERSION"
  exit 1
fi

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
  echo "📦 Installing pnpm..."
  npm install -g pnpm
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy env file if not exists
if [ ! -f .env ]; then
  echo "📝 Creating .env file..."
  cp .env.example .env
  echo "⚠️  Please update .env with your configuration"
fi

# Generate Prisma client
echo "🔨 Generating Prisma client..."
pnpm db:generate

# Build packages
echo "📦 Building packages..."
pnpm build:packages

echo "✅ Setup complete!"
echo "📱 Run 'pnpm dev:mobile' to start mobile app"
echo "💻 Run 'pnpm dev:web' to start web app"
echo "🚀 Run 'pnpm dev' to start both"
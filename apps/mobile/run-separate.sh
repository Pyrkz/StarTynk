#!/bin/bash

echo "Starting backend and frontend in separate terminals..."

# Start backend in new terminal
osascript -e 'tell app "Terminal" to do script "cd '$PWD'/backend && npm run dev"'

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "Starting Expo..."
npm start --clear
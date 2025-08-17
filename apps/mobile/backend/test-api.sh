#!/bin/bash

echo "Testing API endpoints..."

# Test health endpoint
echo "1. Testing health endpoint:"
curl -s http://localhost:3000/health | jq .

# Test login with correct credentials
echo -e "\n2. Testing login with admin@startynk.com:"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "admin@startynk.com",
    "password": "password123"
  }' | jq .

# Test login with phone
echo -e "\n3. Testing login with phone:"
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+48123456789",
    "password": "password123"
  }' | jq .
# Vercel Deployment Instructions

## Environment Variables Required

### Minimum Required for Build:
```
DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
NEXTAUTH_SECRET=any-random-string-for-demo
NEXTAUTH_URL=https://your-app.vercel.app
```

### For Production (with real database):
```
DATABASE_URL=your-real-database-url
NEXTAUTH_SECRET=generate-secure-secret-key
NEXTAUTH_URL=https://your-app.vercel.app
```

## Steps to Deploy:

1. **In Vercel Dashboard:**
   - Add the environment variables above
   - For demo without database, use dummy DATABASE_URL

2. **Deploy:**
   - Push changes to GitHub
   - Vercel will auto-deploy with `prisma generate && next build`

## Notes:
- Authentication is disabled for demo
- ESLint and TypeScript checks are disabled
- All dashboard pages are accessible without login
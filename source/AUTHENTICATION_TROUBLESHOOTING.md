# Authentication Troubleshooting Guide

## Issues Fixed

### 1. Environment Variables
Created `.env.local` file with required variables. **You need to update with your actual values:**

```bash
# NextAuth Configuration
NEXTAUTH_SECRET=your-nextauth-secret-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Apple OAuth (if using)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_CLIENT_SECRET=your-apple-client-secret

# Xata Database
XATA_API_KEY=your-xata-api-key
XATA_BRANCH=main
```

### 2. Database Schema Issue
Fixed the `expires_att` field name to `expires_at_timestamp` in the accounts table creation.

### 3. Duplicate Login Pages
Removed the duplicate login page in `src/app/(auth)/login/page.tsx` to avoid routing conflicts.

### 4. NextAuth Configuration
- Added proper redirect callback
- Enhanced error handling and logging
- Fixed callback structure

### 5. Debugging Enhancements
Added comprehensive logging throughout the authentication flow to help identify issues.

## Steps to Complete Setup

### 1. Set Up Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client IDs
5. Set authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy Client ID and Client Secret to `.env.local`

### 2. Generate NextAuth Secret
```bash
openssl rand -base64 32
```
Add this to `NEXTAUTH_SECRET` in `.env.local`

### 3. Verify Xata Database
1. Check that your Xata database is properly set up
2. Ensure the `users` and `accounts` tables exist
3. Update `XATA_API_KEY` in `.env.local`

### 4. Test the Authentication Flow

1. Start the development server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/auth/login`
3. Click "Continue with Google"
4. Check the console for detailed logs

## Common Issues and Solutions

### Issue: "Missing environment variables"
**Solution:** Ensure all variables in `.env.local` are set with actual values.

### Issue: "OAuth error" or "redirect_uri_mismatch"
**Solution:** Check that your Google OAuth redirect URI exactly matches:
`http://localhost:3000/api/auth/callback/google`

### Issue: "User not saved to database"
**Solution:** 
1. Check Xata database connection
2. Verify the `users` table schema matches the code
3. Check console logs for database errors

### Issue: "Redirect loop" or "Session not found"
**Solution:**
1. Clear browser cookies for localhost:3000
2. Check that NEXTAUTH_SECRET is set
3. Verify NEXTAUTH_URL matches your domain

### Issue: "Database connection failed"
**Solution:**
1. Check XATA_API_KEY is correct
2. Verify database URL in `.xatarc`
3. Ensure Xata service is accessible

## Debugging Commands

View the authentication flow logs:
```bash
# Start the dev server and watch the console
npm run dev

# In another terminal, monitor the logs
tail -f .next/trace
```

## Database Schema Verification

Your Xata database should have these tables:

**users table:**
- `id` (string)
- `email` (string, unique)
- `name` (string)
- `image` (string, nullable)
- `role` (string, default: "member")
- `phone` (string, nullable)
- `emailVerified` (datetime, nullable)
- `createdAt` (datetime)
- `updatedAt` (datetime)

**accounts table:**
- `userId` (link to users)
- `provider` (string)
- `providerAccountId` (string)
- `type` (string)
- `access_token` (string, nullable)
- `expires_at` (number, nullable)
- `expires_at_timestamp` (number, nullable)
- `token_type` (string, nullable)
- `scope` (string, nullable)
- `id_token` (string, nullable)
- `createdAt` (datetime)
- `updatedAt` (datetime)

## Next Steps After Setup

1. Update `.env.local` with real credentials
2. Test authentication flow
3. Check console logs for any remaining issues
4. Verify user data is being saved to database
5. Test the redirect to dashboard after successful login

## Support

If issues persist after following this guide:
1. Check the browser console for JavaScript errors
2. Check the server console for authentication errors
3. Verify all environment variables are correctly set
4. Test with a different browser or incognito mode
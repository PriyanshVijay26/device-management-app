import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
    // Request an access token for our API so the backend accepts it
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email phone',
      // Force account selection - user can choose different email or confirm current one
      prompt: 'select_account'
    }
  }),
  // Use default callback without custom typing to satisfy strict builds
  callback: handleCallback(),
  logout: handleLogout({
    returnTo: '/',
    logoutParams: {
      // Force logout from Auth0 session to ensure account selection on next login
      federated: ''
    }
  })
});

import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  login: handleLogin({
    returnTo: '/dashboard',
    // Request an access token for our API so the backend accepts it
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email phone'
    }
  }),
  callback: handleCallback(),
  logout: handleLogout({
    returnTo: '/',
    logoutParams: {
      // Force logout from Auth0 session to ensure account selection on next login
      federated: ''
    }
  })
});

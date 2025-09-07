import { handleAuth, handleLogin, handleLogout } from '@auth0/nextjs-auth0';

export const GET = handleAuth({
  // Force the Universal Login prompt every time (prevents silent re-login)
  login: handleLogin({
    returnTo: '/dashboard',
    authorizationParams: {
      audience: process.env.AUTH0_AUDIENCE,
      scope: 'openid profile email phone',
      prompt: 'login'
    }
  }),
  // Clear Auth0 session too (federated) so subsequent visits don't auto-login
  logout: handleLogout({
    returnTo: '/',
    logoutParams: {
      federated: true
    }
  })
});

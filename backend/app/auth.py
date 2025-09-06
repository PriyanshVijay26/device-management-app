from fastapi import HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import httpx
import os
from dotenv import load_dotenv
from typing import Dict, Optional
import time

load_dotenv()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_API_AUDIENCE = os.getenv("AUTH0_AUDIENCE")  # Fixed: should be AUTH0_AUDIENCE
AUTH0_ISSUER = os.getenv("AUTH0_ISSUER")
AUTH0_ALGORITHMS = os.getenv("AUTH0_ALGORITHMS", "RS256")

security = HTTPBearer()

# Cache for JWKS keys (production optimization)
_jwks_cache = None
_jwks_cache_time = 0
_jwks_cache_ttl = 300  # 5 minutes

class Auth0JWTBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True):
        super(Auth0JWTBearer, self).__init__(auto_error=auto_error)

    async def __call__(self, credentials: HTTPAuthorizationCredentials = Security(security)):
        if credentials:
            if not credentials.scheme == "Bearer":
                raise HTTPException(status_code=403, detail="Invalid authentication scheme.")
            if not self.verify_jwt(credentials.credentials):
                raise HTTPException(status_code=403, detail="Invalid token or expired token.")
            return credentials.credentials
        else:
            raise HTTPException(status_code=403, detail="Invalid authorization code.")

    def verify_jwt(self, jwtoken: str) -> bool:
        is_token_valid: bool = False
        try:
            payload = self.decode_jwt(jwtoken)
        except:
            payload = None
        if payload:
            is_token_valid = True
        return is_token_valid

    def decode_jwt(self, token: str) -> Optional[Dict]:
        try:
            # Get the public key from Auth0 (with caching for production)
            global _jwks_cache, _jwks_cache_time
            current_time = time.time()
            
            if _jwks_cache is None or (current_time - _jwks_cache_time) > _jwks_cache_ttl:
                jwks_url = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
                with httpx.Client() as client:
                    _jwks_cache = client.get(jwks_url).json()
                    _jwks_cache_time = current_time
            
            jwks = _jwks_cache
            
            # Decode the token
            unverified_header = jwt.get_unverified_header(token)
            rsa_key = {}
            
            for key in jwks["keys"]:
                if key["kid"] == unverified_header["kid"]:
                    rsa_key = {
                        "kty": key["kty"],
                        "kid": key["kid"],
                        "use": key["use"],
                        "n": key["n"],
                        "e": key["e"]
                    }
            
            if rsa_key:
                payload = jwt.decode(
                    token,
                    rsa_key,
                    algorithms=[AUTH0_ALGORITHMS],
                    audience=AUTH0_API_AUDIENCE,
                    issuer=AUTH0_ISSUER
                )
                return payload
        except JWTError:
            return None
        return None

auth_handler = Auth0JWTBearer()

async def get_current_user(token: str = Security(auth_handler)):
    """Get current user from JWT token"""
    try:
        payload = auth_handler.decode_jwt(token)
        if payload is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import json
import httpx
import os
from dotenv import load_dotenv

from app.database import get_db
from app.auth import get_current_user
from app.device_manager import DeviceManager
from app.websocket_manager import manager

load_dotenv()

app = FastAPI(title="Device Management API", version="1.0.0")

# CORS middleware - Dynamic origins based on environment
allowed_origins = [
    "http://localhost:3000",  # Development
    "http://127.0.0.1:3000",  # Development alternative
]

# Add production frontend URL if specified
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)

# For production, also allow common deployment patterns
if os.getenv("RAILWAY_ENVIRONMENT") == "production" or os.getenv("DATABASE_URL", "").startswith("postgresql"):
    # Add Netlify deployment URLs
    netlify_url = os.getenv("NETLIFY_URL")
    if netlify_url:
        allowed_origins.extend([
            f"https://{netlify_url}",
            f"https://{netlify_url.replace('.netlify.app', '')}.netlify.app"
        ])
    
    # Also support Vercel if someone prefers it
    vercel_url = os.getenv("VERCEL_URL")
    if vercel_url:
        allowed_origins.extend([
            f"https://{vercel_url}",
            f"https://{vercel_url.replace('.vercel.app', '')}.vercel.app"
        ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    device_info: str
    device_id: Optional[str] = None

class ForceLogoutRequest(BaseModel):
    target_device_id: str
    current_device_id: str

@app.get("/")
async def root():
    return {"message": "Device Management API is running"}

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    return {
        "status": "healthy",
        "service": "Device Management API",
        "version": "1.0.0",
        "environment": "production" if os.getenv("DATABASE_URL", "").startswith("postgresql") else "development"
    }

@app.get("/api/user/profile")
async def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get user profile information"""
    try:
        # Get additional user info from Auth0 Management API if needed
        # For now, return what we have from the JWT token
        return {
            "sub": current_user.get("sub"),
            "name": current_user.get("name", ""),
            "email": current_user.get("email", ""),
            "phone_number": current_user.get("phone_number", ""),
            "picture": current_user.get("picture", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login_device(
    request: LoginRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Login a device"""
    try:
        user_id = current_user["sub"]
        device_manager = DeviceManager(db)
        
        result = device_manager.login_device(
            user_id=user_id,
            device_info=request.device_info,
            device_id=request.device_id
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/force-logout")
async def force_logout_device(
    request: ForceLogoutRequest,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Force logout a specific device"""
    try:
        user_id = current_user["sub"]
        device_manager = DeviceManager(db)
        
        result = device_manager.force_logout_device(
            user_id=user_id,
            target_device_id=request.target_device_id,
            current_device_id=request.current_device_id
        )
        
        if result["success"]:
            # Send logout notification via WebSocket
            await manager.send_logout_notification(
                request.target_device_id,
                "You have been logged out by another device"
            )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/logout")
async def logout_device(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout current device"""
    try:
        device_manager = DeviceManager(db)
        result = device_manager.logout_device(device_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/devices/active")
async def get_active_devices(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active devices for current user"""
    try:
        user_id = current_user["sub"]
        device_manager = DeviceManager(db)
        devices = device_manager.get_active_devices(user_id)
        
        return {
            "devices": [
                {
                    "device_id": device.device_id,
                    "device_info": device.device_info,
                    "login_time": device.login_time.isoformat(),
                    "last_activity": device.last_activity.isoformat()
                } for device in devices
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/devices/check/{device_id}")
async def check_device_status(
    device_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if device is still active"""
    try:
        device_manager = DeviceManager(db)
        is_active = device_manager.is_device_active(device_id)
        return {"device_id": device_id, "is_active": is_active}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str, token: str = Query(...)):
    """WebSocket endpoint for real-time notifications"""
    try:
        # Verify token (simplified for demo)
        # In production, you'd want to properly verify the JWT token here
        user_id = "user_" + device_id  # Simplified user identification
        
        await manager.connect(websocket, device_id, user_id)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                elif message.get("type") == "activity":
                    # Update device activity in database
                    db = next(get_db())
                    device_manager = DeviceManager(db)
                    device_manager.update_activity(device_id)
                    
        except WebSocketDisconnect:
            manager.disconnect(device_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(device_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

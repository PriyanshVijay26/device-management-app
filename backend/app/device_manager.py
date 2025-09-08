from sqlalchemy.orm import Session
from app.database import DeviceSession
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import uuid
import os

MAX_DEVICES = int(os.getenv("MAX_CONCURRENT_DEVICES", "3"))

class DeviceManager:
    def __init__(self, db: Session):
        self.db = db
    
    def generate_device_id(self) -> str:
        """Generate a unique device ID"""
        return str(uuid.uuid4())
    
    def get_active_devices(self, user_id: str) -> List[DeviceSession]:
        """Get all active devices for a user"""
        return self.db.query(DeviceSession).filter(
            DeviceSession.user_id == user_id,
            DeviceSession.is_active == "true"
        ).order_by(DeviceSession.login_time.desc()).all()
    
    def can_login(self, user_id: str) -> bool:
        """Check if user can login on a new device"""
        active_devices = self.get_active_devices(user_id)
        return len(active_devices) < MAX_DEVICES
    
    def login_device(self, user_id: str, device_info: str, device_id: str = None) -> dict:
        """Login a new device"""
        if not device_id:
            device_id = self.generate_device_id()
        
        # Normalize device info label for India timezone
        if isinstance(device_info, str):
            device_info = device_info.replace("(Asia/Kolkata)", "(IST)").replace("(Asia/Calcutta)", "(IST)")

        active_devices = self.get_active_devices(user_id)
        
        # Check if device already exists (active or inactive)
        existing_device = self.db.query(DeviceSession).filter(
            DeviceSession.device_id == device_id
        ).first()
        
        if existing_device:
            # If the device exists but is currently inactive, enforce the limit
            if existing_device.is_active != "true":
                if len(active_devices) >= MAX_DEVICES:
                    # Do NOT reactivate; return the list for modal selection
                    return {
                        "success": False,
                        "device_id": device_id,
                        "message": f"Maximum {MAX_DEVICES} devices allowed",
                        "active_devices": len(active_devices),
                        "devices": [
                            {
                                "device_id": d.device_id,
                                "device_info": d.device_info,
                                "login_time": d.login_time.replace(tzinfo=timezone.utc).isoformat(),
                                "last_activity": d.last_activity.replace(tzinfo=timezone.utc).isoformat(),
                            }
                            for d in active_devices
                        ],
                    }

            # Reactivate or refresh existing device session
            existing_device.user_id = user_id  # Ensure ownership
            existing_device.device_info = device_info  # Update device info
            existing_device.login_time = datetime.utcnow()  # Update login time
            existing_device.last_activity = datetime.utcnow()
            existing_device.is_active = "true"
            self.db.commit()

            # Recalculate active devices after (re)activation
            active_devices = self.get_active_devices(user_id)

            return {
                "success": True,
                "device_id": device_id,
                "message": "Device reactivated successfully",
                "active_devices": len(active_devices),
            }
        
        if len(active_devices) >= MAX_DEVICES:
            return {
                "success": False,
                "device_id": device_id,
                "message": f"Maximum {MAX_DEVICES} devices allowed",
                "active_devices": len(active_devices),
                "devices": [
                    {
                        "device_id": device.device_id,
                        "device_info": device.device_info,
                        # Explicitly tag UTC so clients can safely render in local TZ (IST)
                        "login_time": device.login_time.replace(tzinfo=timezone.utc).isoformat(),
                        "last_activity": device.last_activity.replace(tzinfo=timezone.utc).isoformat(),
                    } for device in active_devices
                ]
            }
        
        # Create new device session
        new_device = DeviceSession(
            user_id=user_id,
            device_id=device_id,
            device_info=device_info,
            login_time=datetime.utcnow(),
            last_activity=datetime.utcnow(),
            is_active="true"
        )
        
        self.db.add(new_device)
        self.db.commit()
        
        return {
            "success": True,
            "device_id": device_id,
            "message": "Device logged in successfully",
            "active_devices": len(active_devices) + 1
        }
    
    def force_logout_device(self, user_id: str, target_device_id: str, current_device_id: str) -> dict:
        """Force logout a specific device.

        Authorization: relies on the caller's JWT (user_id). We intentionally
        do NOT require the "current_device_id" to already be active in the DB
        because this endpoint is also used when the user hits the device limit
        and is not yet logged in on the current device.
        """
        # Verify the target device belongs to the same user and is active
        target_device = self.db.query(DeviceSession).filter(
            DeviceSession.device_id == target_device_id,
            DeviceSession.user_id == user_id,
            DeviceSession.is_active == "true",
        ).first()

        if not target_device:
            return {"success": False, "message": "Target device not found or already logged out"}

        # Deactivate target device
        target_device.is_active = "false"
        self.db.commit()

        return {
            "success": True,
            "message": "Device logged out successfully",
            "logged_out_device": target_device_id,
        }
    
    def logout_device(self, device_id: str) -> dict:
        """Logout current device"""
        device = self.db.query(DeviceSession).filter(
            DeviceSession.device_id == device_id,
            DeviceSession.is_active == "true"
        ).first()
        
        if not device:
            return {"success": False, "message": "Device not found"}
        
        device.is_active = "false"
        self.db.commit()
        
        return {"success": True, "message": "Device logged out successfully"}
    
    def is_device_active(self, device_id: str) -> bool:
        """Check if a device is still active"""
        device = self.db.query(DeviceSession).filter(
            DeviceSession.device_id == device_id,
            DeviceSession.is_active == "true"
        ).first()
        
        return device is not None
    
    def update_activity(self, device_id: str):
        """Update last activity for a device"""
        device = self.db.query(DeviceSession).filter(
            DeviceSession.device_id == device_id,
            DeviceSession.is_active == "true"
        ).first()
        
        if device:
            device.last_activity = datetime.utcnow()
            self.db.commit()

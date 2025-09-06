from fastapi import WebSocket
from typing import Dict, List
import json
import asyncio

class ConnectionManager:
    def __init__(self):
        # Store connections by device_id
        self.active_connections: Dict[str, WebSocket] = {}
        # Store device_id to user_id mapping
        self.device_user_mapping: Dict[str, str] = {}
    
    async def connect(self, websocket: WebSocket, device_id: str, user_id: str):
        await websocket.accept()
        self.active_connections[device_id] = websocket
        self.device_user_mapping[device_id] = user_id
        print(f"Device {device_id} connected for user {user_id}")
    
    def disconnect(self, device_id: str):
        if device_id in self.active_connections:
            del self.active_connections[device_id]
        if device_id in self.device_user_mapping:
            del self.device_user_mapping[device_id]
        print(f"Device {device_id} disconnected")
    
    async def send_personal_message(self, message: str, device_id: str):
        if device_id in self.active_connections:
            try:
                await self.active_connections[device_id].send_text(message)
            except:
                # Connection might be closed, remove it
                self.disconnect(device_id)
    
    async def send_logout_notification(self, device_id: str, message: str = "You have been logged out from another device"):
        """Send logout notification to a specific device"""
        if device_id in self.active_connections:
            logout_message = {
                "type": "force_logout",
                "message": message,
                "timestamp": str(asyncio.get_event_loop().time())
            }
            try:
                await self.active_connections[device_id].send_text(json.dumps(logout_message))
                # Give some time for the message to be received
                await asyncio.sleep(1)
            except:
                pass
            finally:
                # Close the connection
                try:
                    await self.active_connections[device_id].close()
                except:
                    pass
                self.disconnect(device_id)
    
    async def notify_user_devices(self, user_id: str, message: dict):
        """Send notification to all devices of a user"""
        devices_to_notify = [
            device_id for device_id, uid in self.device_user_mapping.items() 
            if uid == user_id
        ]
        
        for device_id in devices_to_notify:
            await self.send_personal_message(json.dumps(message), device_id)

manager = ConnectionManager()

# Gunicorn configuration for production deployment
import os

# Server socket
bind = f"0.0.0.0:{os.getenv('PORT', '8000')}"

# Worker processes
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000

# Restart workers after this many requests, to help prevent memory leaks
max_requests = 1000
max_requests_jitter = 100

# Timeout for workers
timeout = 120
keepalive = 5

# Logging
loglevel = "info"
accesslog = "-"
errorlog = "-"

# Process naming
proc_name = "device-management-api"

# Worker tmp directory
worker_tmp_dir = "/dev/shm"

# Preload app for better performance
preload_app = True

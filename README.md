# Device Management Web App

A comprehensive web application built with FastAPI (backend) and Next.js (frontend) that provides secure device management with N-device concurrent login functionality using Auth0 authentication.

## 🚀 Features

- **Secure Authentication**: Auth0 integration with JWT tokens
- **N-Device Limit Control**: Configure maximum concurrent devices per user (default: 3)
- **Force Logout Capability**: Remote device logout with real-time notifications
- **Graceful Logout Notifications**: WebSocket-based real-time notifications for forced logouts
- **User Profile Management**: Display user information including name and phone number
- **Professional UI**: Modern, responsive design with Tailwind CSS
- **Real-time Device Monitoring**: Live device session tracking and management

## 🏗️ Architecture

### Backend (FastAPI)
- **Authentication**: Auth0 JWT token verification
- **Database**: SQLite for development (easily upgradable to PostgreSQL)
- **WebSockets**: Real-time communication for device notifications
- **Device Management**: Session tracking and concurrent login control

### Frontend (Next.js)
- **Authentication**: Auth0 Next.js SDK
- **State Management**: React hooks and context
- **UI Framework**: Tailwind CSS with custom components
- **Real-time Updates**: WebSocket client for live notifications

## 📋 Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- Auth0 account (free tier available)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd law&verdict
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp env.example .env

# Configure your .env file with Auth0 credentials:
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_API_AUDIENCE=your-api-audience
AUTH0_ISSUER=https://your-domain.auth0.com/
AUTH0_ALGORITHMS=RS256
MAX_CONCURRENT_DEVICES=3
DATABASE_URL=sqlite:///./devices.db

# Run the server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp env.local.example .env.local

# Configure your .env.local file:
AUTH0_SECRET=your-secret-key
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
AUTH0_AUDIENCE=your-api-audience
NEXT_PUBLIC_API_URL=http://localhost:8000

# Run the development server
npm run dev
```

### 4. Auth0 Configuration

1. Create an Auth0 application (Single Page Application)
2. Configure the following URLs:
   - **Allowed Callback URLs**: `http://localhost:3000/api/auth/callback`
   - **Allowed Logout URLs**: `http://localhost:3000`
   - **Allowed Web Origins**: `http://localhost:3000`
3. Create an API in Auth0 for the backend
4. Update your environment variables with the Auth0 credentials

## 🎯 How It Works

### Device Limit Enforcement

1. **Login Attempt**: When a user tries to log in, the system checks current active devices
2. **Limit Check**: If the user has reached the maximum device limit (N=3), they're presented with options
3. **Force Logout**: User can choose to force logout an existing device to make room for the new login
4. **Real-time Notification**: The logged-out device receives an immediate WebSocket notification
5. **Graceful Handling**: The forced-out device shows a user-friendly logout message

### WebSocket Communication

- Real-time notifications for device status changes
- Graceful logout messages for forced disconnections
- Connection health monitoring with automatic reconnection

### Security Features

- JWT token validation on all API endpoints
- Device fingerprinting for unique device identification
- Session activity tracking
- Secure WebSocket connections with token authentication

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login device
- `POST /api/auth/logout` - Logout current device
- `POST /api/auth/force-logout` - Force logout specific device

### User Management
- `GET /api/user/profile` - Get user profile information

### Device Management
- `GET /api/devices/active` - Get all active devices for user
- `GET /api/devices/check/{device_id}` - Check device status

### WebSocket
- `WS /ws/{device_id}` - Real-time device notifications

## 🚀 Deployment

See `DEPLOYMENT.md` for detailed deployment instructions using:
- **Railway** (Backend) - Free tier available
- **Vercel** (Frontend) - Free tier available
- **Auth0** (Authentication) - Free tier: 7,000 users

## 🛠️ Technologies Used

### Backend
- **FastAPI**: Modern, fast web framework for building APIs
- **SQLAlchemy**: SQL toolkit and ORM
- **python-jose**: JWT token handling
- **WebSockets**: Real-time communication
- **SQLite**: Database (development)

### Frontend
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **Auth0 Next.js SDK**: Authentication integration
- **Headless UI**: Accessible UI components
- **React Hot Toast**: Toast notifications

## 🔒 Security Considerations

- All API endpoints are protected with JWT authentication
- Device IDs are generated using UUID v4 for uniqueness
- WebSocket connections require valid authentication tokens
- Session data is securely stored and managed
- CORS is properly configured for cross-origin requests

## 🎨 UI/UX Features

- **Responsive Design**: Works on all device sizes
- **Professional Styling**: Modern gradient backgrounds and glass effects
- **Interactive Components**: Hover effects and smooth transitions
- **Loading States**: Proper loading indicators throughout the app
- **Error Handling**: User-friendly error messages and toast notifications
- **Accessibility**: WCAG compliant components with proper ARIA labels

## 📊 Device Management Features

- **Real-time Device List**: See all active devices with details
- **Current Device Highlighting**: Clearly identify the current device
- **Device Information Display**: Browser, OS, login time, and last activity
- **Force Logout Modal**: User-friendly device selection for logout
- **Activity Tracking**: Monitor device usage patterns

## 🔄 Real-time Features

- **WebSocket Notifications**: Instant device status updates
- **Graceful Logout Messages**: Friendly notifications for forced logouts
- **Connection Health**: Automatic reconnection with exponential backoff
- **Activity Heartbeat**: Regular activity updates to maintain session health

## 📈 Scalability Considerations

- **Database**: Easily upgradable from SQLite to PostgreSQL
- **Caching**: Redis integration ready for session caching
- **Load Balancing**: Stateless design supports horizontal scaling
- **Monitoring**: Structured logging for production monitoring

## 🧪 Testing

The application includes comprehensive error handling and graceful degradation:
- Network connectivity issues
- Authentication failures
- WebSocket disconnections
- Database connection problems
- Invalid device states

## 📞 Support

For issues or questions regarding the device management functionality:
1. Check the browser console for detailed error messages
2. Verify Auth0 configuration and credentials
3. Ensure WebSocket connections are not blocked by firewalls
4. Check device storage permissions for localStorage access

## 🔮 Future Enhancements

- **Device Geolocation**: Track login locations
- **Security Alerts**: Email notifications for suspicious activity
- **Device Approval**: Manual device approval workflow
- **Session Analytics**: Detailed usage statistics and reporting
- **Mobile App**: Native mobile application support
- **SSO Integration**: Enterprise single sign-on capabilities

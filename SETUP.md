# Quick Start Guide

## Prerequisites
- Node.js (v16 or higher)
- npm
- Modern web browser

## Installation Steps

### Option 1: Standard Installation (Recommended)

#### Backend
```bash
cd backend
npm install
```

If you encounter errors, try:
```bash
npm install --legacy-peer-deps
```

Or:
```bash
npm install --force
```

#### Frontend
```bash
cd frontend
npm install
```

### Option 2: Manual Dependency Installation

If npm install fails, you can install dependencies individually:

#### Backend Dependencies
```bash
cd backend
npm init -y
npm install express
npm install sqlite3
npm install jsonwebtoken
npm install bcrypt
npm install multer
npm install cors
npm install dotenv
npm install nodemon --save-dev
```

#### Frontend Dependencies
```bash
cd frontend
npm install react react-dom
npm install react-router-dom
npm install axios
npm install recharts
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm start
```
**Backend URL**: http://localhost:5000

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
**Frontend URL**: http://localhost:5173

## Testing the Application

1. Open http://localhost:5173 in your browser
2. Register a new account
3. Upload a health report with vitals
4. View the vitals chart
5. Share a report with another user

## Troubleshooting

### Backend won't start
- Check if port 5000 is already in use
- Verify all dependencies are installed
- Check `.env` file exists

### Frontend won't start
- Check if port 5173 is already in use
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

### Database errors
- Delete `health_wallet.db` if it exists
- Restart the backend server to recreate database

### File upload errors
- Ensure `uploads` directory has write permissions
- Check file size is under 10MB
- Verify file type is PDF, JPG, or PNG

## Next Steps

1. Review the [README.md](README.md) for full documentation
2. Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. See [walkthrough.md](walkthrough.md) for feature demonstrations

## For Production Deployment

1. Change JWT_SECRET in `.env`
2. Use PostgreSQL instead of SQLite
3. Move uploads to cloud storage (S3, GCS)
4. Enable HTTPS
5. Add rate limiting
6. Set up monitoring and logging

# Digital Health Wallet 🏥

A comprehensive health management system that allows users to store, track, and share medical reports and vitals data with granular access control.

## ✨ Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Report Management**: Upload and store medical reports (PDFs/images)
- **Vitals Tracking**: Record and track health vitals over time
- **Interactive Charts**: Visualize vitals trends with interactive graphs
- **Search & Filter**: Find reports by date, type, or vital measurements
- **Access Control**: Share specific reports with family, friends, or doctors
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Dark mode with glassmorphism effects and smooth animations

## 🛠️ Technology Stack

### Frontend
- **React** (v18) - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **Vite** - Build tool

### Backend
- **Node.js** (v16+) - Runtime environment
- **Express.js** (v4) - Web framework
- **SQLite** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Modern web browser

## 🚀 Setup Instructions

### 1. Clone the Repository

\`\`\`bash
git clone <your-repository-url>
cd 2careai
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend
npm install
\`\`\`

Create a \`.env\` file (or use the existing one):
\`\`\`env
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
UPLOAD_DIR=./uploads
\`\`\`

Start the backend server:
\`\`\`bash
npm start
\`\`\`

The backend will run on **http://localhost:5000**

### 3. Frontend Setup

Open a new terminal:

\`\`\`bash
cd frontend
npm install
\`\`\`

Start the frontend development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will run on **http://localhost:5173**

## 📖 Usage

### First Time Setup

1. Navigate to http://localhost:5173
2.  Create an account by clicking "Create one"
3. Enter your details and register
4. You'll be automatically logged in

### Uploading Reports

1. Click **Upload** in the navigation
2. Fill in report details (title, type, date)
3. Select a PDF or image file
4. Optionally add vitals (Blood Pressure, Sugar, Heart Rate, etc.)
5. Click **Upload Report**

### Viewing Reports

1. Click **My Reports** to see all your reports
2. Use filters to search by type, date range, or keywords
3. Click **View** to open the report file
4. Click **Share** to grant access to others
5. Click **Delete** to remove a report

### Tracking Vitals

1. Click **Vitals** in the navigation
2. Select a vital type to view trends
3. Use date filters to narrow down the time range
4. Interactive charts show your health progress over time

### Sharing Reports

1. Go to **My Reports**
2. Click **Share** on any report
3. Enter the recipient's email address
4. They can view the report under **Shared** tab

## 📚 API Documentation

### Authentication

#### Register
\`\`\`http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",  
  "fullName": "John Doe"
}
\`\`\`

#### Login
\`\`\`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
\`\`\`

### Reports

#### Upload Report
\`\`\`http
POST /api/reports/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- file: <file>
- title: "Blood Test Report"
- reportType: "Blood Test"
- reportDate: "2024-01-15"
- notes: "Annual checkup"
- vitals: JSON array of vitals
\`\`\`

#### Get All Reports
\`\`\`http
GET /api/reports
Authorization: Bearer <token>
\`\`\`

#### Get Report by ID
\`\`\`http
GET /api/reports/:id
Authorization: Bearer <token>
\`\`\`

#### Search Reports
\`\`\`http
GET /api/reports/search/filter?startDate=2024-01-01&reportType=Blood Test
Authorization: Bearer <token>
\`\`\`

### Vitals

#### Get Vitals Trends
\`\`\`http
GET /api/vitals/trends?vitalType=Blood Pressure&startDate=2024-01-01
Authorization: Bearer <token>
\`\`\`

#### Get Vitals Summary
\`\`\`http
GET /api/vitals/summary
Authorization: Bearer <token>
\`\`\`

### Sharing

#### Share Report
\`\`\`http
POST /api/sharing/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "reportId": 1,
  "email": "doctor@example.com"
}
\`\`\`

#### Get Shared Reports
\`\`\`http
GET /api/sharing/received
Authorization: Bearer <token>
\`\`\`

## 🗄️ Database Schema

### users
- `id` - Primary key
- `email` - Unique user email
- `password_hash` - Hashed password
- `full_name` - User's full name
- `created_at` - Timestamp

### reports
- `id` - Primary key
- `user_id` - Foreign key to users
- `title` - Report title
- `report_type` - Type of report
- `file_path` - Path to uploaded file
- `file_type` - MIME type
- `upload_date` - Upload timestamp
- `report_date` - Date of medical report
- `notes` - Additional notes

### vitals
- `id` - Primary key
- `report_id` - Foreign key to reports
- `vital_type` - Type of vital (BP, Sugar, etc.)
- `value` - Measurement value
- `unit` - Unit of measurement
- `measured_at` - Timestamp

### shared_access
- `id` - Primary key
- `report_id` - Foreign key to reports
- `shared_by` - Foreign key to users (owner)
- `shared_with_email` - Email of recipient
- `shared_with_user_id` - Foreign key to users (nullable)
- `access_level` - Read access
- `shared_at` - Timestamp

## 🔒 Security Considerations

### Authentication
- Passwords are hashed using **bcrypt** (10 salt rounds)
- JWT tokens expire after 24 hours
- Tokens are stored in localStorage (client-side)

### Authorization
- All API endpoints (except auth) require valid JWT token
- Users can only access their own reports
- Shared reports are verified through access control table

### File Security
- Uploaded files are validated for type (PDF, JPG, PNG only)
- File size limited to 10MB
- Files stored with unique names to prevent conflicts

### Production Recommendations
1. Use HTTPS in production
2. Store files in cloud storage (AWS S3, Google Cloud Storage)
3. Implement rate limiting
4. Add CSRF protection
5. Use environment-specific secrets
6. Enable database encryption
7. Implement audit logging

## 🎨 Design System

- **Dark Mode**: Premium dark theme with vibrant accents
- **Glassmorphism**: Frosted glass effect on cards and modals
- **Gradient Buttons**: Eye-catching gradient backgrounds
- **Smooth Animations**: 250ms transitions for polished UX
- **Responsive Grid**: Mobile-first responsive layout
- **Custom Scrollbars**: Styled scrollbars matching theme

## 📱 Future Enhancements

- [ ] WhatsApp integration for report upload
- [ ] Real-time notifications
- [ ] Advanced analytics and insights
- [ ] Export reports as PDF
- [ ] Multi-factor authentication
- [ ] Doctor dashboard
- [ ] Appointment scheduling
- [ ] Medicine reminders
- [ ] Health goals and tracking
- [ ] Integration with wearable devices

## 🐛 Known Issues

- File uploads larger than 10MB will be rejected
- PDF preview not available in-browser (opens in new tab)
- Shared users must be registered to receive notifications

## 👥 Contributors

- Your Name - Initial work

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React team for the amazing framework
- Recharts for beautiful charts
- Express.js community
- SQLite for the lightweight database

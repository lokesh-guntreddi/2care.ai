# System Architecture

## Overview

The Digital Health Wallet is a full-stack web application built using a three-tier architecture: Client (Frontend), Server (Backend), and Database layers.

## Architecture Diagram

\`\`\`mermaid
graph TB
    subgraph "Client Layer"
        A["React Frontend<br/>(Port 5173)"]
        A1["Auth Components"]
        A2["Dashboard"]
        A3["Report Management"]
        A4["Vitals Visualization"]
        A5["Sharing Features"]
        A --> A1
        A --> A2
        A --> A3
        A --> A4
        A --> A5
    end
    
    subgraph "Server Layer"
        B["Express.js API<br/>(Port 5000)"]
        B1["Auth Routes"]
        B2["Reports API"]
        B3["Vitals API"]
        B4["Sharing API"]
        B5["JWT Middleware"]
        B --> B1
        B --> B2
        B --> B3
        B --> B4
        B --> B5
    end
    
    subgraph "Data Layer"
        C[(SQLite Database)]
        C1[("users")]
        C2[("reports")]
        C3[("vitals")]
        C4[("shared_access")]
        C --> C1
        C --> C2
        C --> C3
        C --> C4
    end
    
    subgraph "File Storage"
        D[Local File System<br/>/uploads]
    end
    
    A -->|HTTP/HTTPS| B
    B -->|SQL Queries| C
    B -->|Read/Write| D
    A1 -.->|JWT Token| B5
    
    style A fill:#667eea
    style B fill:#764ba2
    style C fill:#f093fb
    style D fill:#4facfe
\`\`\`

## Component Descriptions

### Frontend (React)

#### Technology Stack
- **React 18**: Component-based UI framework
- **React Router**: Client-side routing
- **Axios**: HTTP client with interceptors
- **Recharts**: Interactive data visualization
- **Vite**: Fast build tool and dev server

#### Key Components

**Authentication**
- `Login.jsx`: User login form
- `Register.jsx`: User registration form
- Stores JWT token in localStorage
- Persists user session across page reloads

**Dashboard**
- `Dashboard.jsx`: Main application layout
- Tab-based navigation (Reports, Upload, Vitals, Shared)
- User profile display and logout functionality

**Reports Management**
- `UploadReport.jsx`: Multi-step form for uploading reports with vitals
- `ReportList.jsx`: Grid display with search and filter capabilities
- File type validation (PDF, JPG, PNG)
- Dynamic vital entry system

**Vitals Tracking**
- `VitalsChart.jsx`: Interactive line charts using Recharts
- Summary cards for each vital type
- Date range filtering
- Support for multiple vital types

**Sharing System**
- `ShareModal.jsx`: Modal dialog for sharing reports
- Email-based access control
- View shared reports from others

#### State Management
- Component-level state using React hooks
- localStorage for authentication persistence
- API calls for server synchronization

---

### Backend (Node.js + Express)

#### Technology Stack
- **Express 4**: Web application framework
- **SQLite3**: Embedded relational database
- **JWT**: Stateless authentication
- **Bcrypt**: Password hashing (10 rounds)
- **Multer**: Multipart form data handling
- **CORS**: Cross-origin resource sharing

#### API Routes

**Authentication (`/api/auth`)**
- POST `/register` - Create new user account
- POST `/login` - Authenticate and receive JWT

**Reports (`/api/reports`)**
- POST `/upload` - Upload report with file and metadata
- GET `/` - Get all user reports
- GET `/:id` - Get specific report (with access check)
- GET `/:id/file` - Download/view report file
- DELETE `/:id` - Delete report and associated data
- GET `/search/filter` - Search with query parameters

**Vitals (`/api/vitals`)**
- POST `/` - Add vital to a report
- GET `/report/:reportId` - Get all vitals for a report
- GET `/trends` - Get time-series data for charting
- GET `/summary` - Get aggregated vital statistics
- DELETE `/:id` - Remove a vital entry

**Sharing (`/api/sharing`)**
- POST `/share` - Grant access to a report
- DELETE `/share/:shareId` - Revoke access
- GET `/received` - Get reports shared with user
- GET `/sent` - Get sharing history
- GET `/report/:reportId` - Get access list for report

#### Middleware
- **CORS**: Allows frontend to make requests
- **Express JSON**: Parses JSON request bodies
- **JWT Verification**: Protects routes requiring authentication
- **Error Handling**: Catches and formats errors

---

### Database (SQLite)

#### Schema Design

**users table**
\`\`\`sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
\`\`\`

**reports table**
\`\`\`sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  report_date DATE NOT NULL,
  notes TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
\`\`\`

**vitals table**
\`\`\`sql
CREATE TABLE vitals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  vital_type TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  measured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
)
\`\`\`

**shared_access table**
\`\`\`sql
CREATE TABLE shared_access (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  shared_by INTEGER NOT NULL,
  shared_with_email TEXT NOT NULL,
  shared_with_user_id INTEGER,
  access_level TEXT DEFAULT 'read',
  shared_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE SET NULL
)
\`\`\`

#### Relationships
- One user has many reports (1:N)
- One report has many vitals (1:N)
- One report can be shared with many users (1:N)
- Cascade deletion ensures data integrity

---

### File Storage

#### Current Implementation
- **Location**: Local file system (`/backend/uploads`)
- **Naming**: Timestamp + random number + original extension
- **Size Limit**: 10MB per file
- **Allowed Types**: PDF, JPG, JPEG, PNG

#### Production Recommendations
- Migrate to cloud storage (AWS S3, Google Cloud Storage, Azure Blob)
- Implement CDN for faster delivery
- Add virus scanning
- Enable automated backups
- Implement lifecycle policies for archival

---

## Data Flow

### User Registration Flow
1. User submits registration form
2. Frontend sends POST to `/api/auth/register`
3. Backend hashes password with bcrypt
4. User record inserted into SQLite
5. JWT token generated and returned
6. Frontend stores token in localStorage
7. User redirected to dashboard

### Report Upload Flow
1. User selects file and enters metadata
2. Frontend creates FormData with file and data
3. POST request to `/api/reports/upload`
4. Multer middleware processes file upload
5. File saved to `/uploads` directory
6. Report metadata saved to database
7. Associated vitals saved (if provided)
8. Success response returned
9. Frontend refreshes report list

### Vitals Trend Visualization Flow
1. User selects vital type and date range
2. GET request to `/api/vitals/trends`
3. Backend queries vitals table with filters
4. Results ordered by measurement date
5. Data returned as JSON array
6. Recharts renders line chart
7. Interactive tooltips show details

### Report Sharing Flow
1. Owner clicks "Share" on a report
2. Enters recipient email in modal
3. POST to `/api/sharing/share`
4. Backend checks report ownership
5. Creates shared_access record
6. Recipient can view under "Shared" tab
7. Access can be revoked by owner

---

## Security Measures

### Authentication & Authorization
- JWT-based stateless authentication
- Tokens expire after 24 hours
- Bcrypt password hashing (10 rounds)
- Protected routes require valid token
- Role-based access control for shared reports

### Data Protection
- SQL injection prevention via parameterized queries
- XSS protection through React's built-in escaping
- File type validation on upload
- CORS configured for specific origins

### API Security
- Input validation on all endpoints
- Error messages don't leak sensitive info
- File upload size limits
- Rate limiting recommended for production

---

## Scalability Considerations

### Current Limitations
- SQLite is single-file, not suitable for high concurrency
- Local file storage doesn't scale horizontally
- No caching layer
- No load balancing

### Production Scaling Strategy

**Database**
- Migrate to PostgreSQL or MySQL for better concurrency
- Implement read replicas
- Add database connection pooling
- Consider sharding for large datasets

**File Storage**
- Move to object storage (S3, GCS)
- Implement CDN for global distribution
- Add image optimization pipeline
- Enable automatic backups

**Application**
- Deploy multiple backend instances
- Add load balancer (NGINX, HAProxy)
- Implement Redis for session storage
- Use message queues for async processing

**Monitoring**
- Application performance monitoring (APM)
- Error tracking (Sentry)
- Log aggregation (ELK stack)
- Health check endpoints

---

## Deployment Architecture (Recommended)

\`\`\`mermaid
graph LR
    A[User Browser] -->|HTTPS| B[CloudFlare CDN]
    B --> C[Load Balancer]
    C --> D1[App Server 1]
    C --> D2[App Server 2]
    C --> D3[App Server N]
    D1 --> E[PostgreSQL RDS]
    D2 --> E
    D3 --> E
    D1 --> F[S3 Bucket]
    D2 --> F
    D3 --> F
    D1 --> G[Redis Cache]
    D2 --> G
    D3 --> G
    
    style A fill:#667eea
    style B fill:#764ba2
    style C fill:#f093fb
    style E fill:#4facfe
    style F fill:#00f2fe
    style G fill:#f5576c
\`\`\`

---

## Technology Choices

### Why React?
- Component reusability
- Large ecosystem
- Virtual DOM for performance
- Great developer experience

### Why Express?
- Minimalist and flexible
- Vast middleware ecosystem
- Easy to learn and deploy
- Great for RESTful APIs

### Why SQLite?
- Zero configuration
- Perfect for prototypes
- Single file database
- Sufficient for assignment scope

### Why JWT?
- Stateless authentication
- Scales horizontally
- Works across domains
- Industry standard

---

## Conclusion

This architecture provides a solid foundation for a health management system with room for growth. The modular design allows individual components to be upgraded (e.g., SQLite → PostgreSQL) without major rewrites.

# FinanceAI - AI-Powered Balance Sheet Analysis

A comprehensive web application for intelligent financial analysis using AI to process balance sheet PDFs, generate insights, and provide actionable recommendations for top management.

## 🎯 Overview

FinanceAI is a complete solution for financial analysts and top management to:
- **Upload and Process** balance sheet PDFs automatically
- **Extract Financial Data** using AI-powered text analysis
- **Generate Insights** with Google Gemini AI integration
- **Chat with AI** about financial performance and analysis
- **Role-Based Access** for different user types (Analyst, CEO, Group Executive)
- **Multi-Company Support** with hierarchical access control

## 🏗 Architecture

```
FinanceAI/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main app with routing
│   │   └── index.css      # Tailwind CSS styles
│   └── package.json       # Frontend dependencies
├── server/                 # Node.js Backend
│   ├── models/            # MongoDB models
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication & authorization
│   ├── utils/             # AI & PDF processing utilities
│   └── server.js          # Express server
└── README.md              # This file
```

## 🚀 Features

### Frontend Features
- **Modern UI/UX**: Clean, professional design with Tailwind CSS
- **Responsive Design**: Works on all devices and screen sizes
- **Interactive Charts**: Financial data visualization with Recharts
- **Real-time Updates**: Live dashboard with key metrics
- **Role-Based Interface**: Different views for different user roles

### Backend Features
- **PDF Processing**: Extract financial data from uploaded PDFs
- **AI Integration**: Google Gemini API for intelligent analysis
- **Role-Based Access Control**: Secure permissions system
- **Company Hierarchy**: Support for parent-subsidiary relationships
- **Real-time Chat**: AI-powered financial conversations
- **Comprehensive APIs**: RESTful endpoints for all functionality

### User Roles & Permissions
- **Financial Analyst**: View and analyze balance sheets, generate reports
- **Company CEO**: Full access to their company's data, can edit balance sheets
- **Group Executive**: Access to all companies in the group hierarchy

## 🛠 Tech Stack

### Frontend
- **React 19** with modern hooks
- **React Router DOM** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Recharts** for data visualization

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** authentication with bcryptjs
- **Multer** for file uploads
- **pdf-parse** for PDF processing
- **Google Gemini API** for AI analysis

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FinanceAI
```

### 2. Backend Setup
```bash
cd server
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration
```

### 3. Frontend Setup
```bash
cd ../client
npm install
```

### 4. Environment Configuration

#### Backend (.env)
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/financeai

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Google Gemini API
GEMINI_API_KEY=your-gemini-api-key-here

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### 5. Start the Application

#### Start Backend
```bash
cd server
npm run dev
# Server will run on http://localhost:5000
```

#### Start Frontend
```bash
cd client
npm run dev
# Frontend will run on http://localhost:5173
```

## 🎨 User Interface

### Landing Page
- Professional hero section with feature highlights
- Feature cards showcasing AI capabilities
- Call-to-action buttons for registration/login

### Authentication
- **Login Page**: Email, password, and role selection
- **Signup Page**: Complete registration with company assignment
- **Demo Credentials**: Pre-filled for testing

### Dashboard
- **Key Metrics Cards**: Revenue, assets, growth rate, companies
- **Navigation Tabs**: Overview, AI Assistant, Upload Data, Reports
- **Financial Performance Chart**: Interactive line charts
- **Recent Activity**: Real-time updates and notifications
- **Accessible Companies**: Company management section

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Balance Sheets
- `POST /api/balance-sheets/upload` - Upload PDF balance sheet
- `GET /api/balance-sheets/company/:companyId` - Get company balance sheets
- `GET /api/balance-sheets/:id` - Get balance sheet by ID

### Chat & AI
- `POST /api/chat` - Create new chat session
- `POST /api/chat/:id/message` - Send message to AI
- `GET /api/chat/:id` - Get chat with messages

### Analysis
- `POST /api/analysis/compare` - Generate comparative analysis
- `GET /api/analysis/ratios/:companyId` - Financial ratios report
- `GET /api/analysis/growth/:companyId` - Growth analysis
- `GET /api/analysis/risk/:companyId` - Risk assessment

## 🤖 AI Integration

### Google Gemini API Features
- **Financial Data Extraction**: Extract structured data from PDF balance sheets
- **Intelligent Analysis**: Generate insights, risk assessments, and recommendations
- **Natural Language Chat**: AI-powered conversations about financial data
- **Comparative Analysis**: Multi-year trend analysis and projections

### Analysis Types
- **Balance Sheet Analysis**: Asset, liability, and equity analysis
- **Financial Ratios**: Current ratio, quick ratio, debt-to-equity, etc.
- **Growth Analysis**: Year-over-year growth rates and CAGR
- **Risk Assessment**: Liquidity, solvency, and operational risk evaluation

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Different access levels based on user roles
- **Company Access Control**: Users can only access their assigned companies
- **Password Hashing**: bcryptjs for secure password storage
- **File Upload Security**: File type validation and size limits

## 📊 Data Models

### User Model
- Role-based permissions (Analyst, CEO, Group Executive)
- Company assignments and access control
- Password hashing and security

### Company Model
- Hierarchical structure (Parent-Subsidiary relationships)
- Industry classification and metadata
- Contact information and address

### Balance Sheet Model
- Comprehensive financial data extraction
- AI-generated analysis and insights
- Processing status and validation
- File metadata and storage

### Chat Model
- AI conversation sessions
- Context-aware responses
- Message history and metadata

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB (local or cloud)
2. Configure environment variables
3. Install dependencies: `npm install`
4. Start server: `npm start`

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy to your preferred hosting service
3. Configure API endpoints for production

### Production Considerations
- Use environment-specific configurations
- Implement proper logging and monitoring
- Set up database backups
- Configure CORS for production domains
- Use secure file storage (AWS S3, etc.)
- Implement rate limiting

## 🧪 Testing

### Demo Credentials
```
Analyst: analyst@financeai.com / password
CEO: ceo@reliance.com / password
Executive: executive@ambani.com / password
```

### Sample Data
The application includes sample financial data for demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**FinanceAI** - Empowering financial analysis with AI

*Built with React, Node.js, MongoDB, and Google Gemini AI*

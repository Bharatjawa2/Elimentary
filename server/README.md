# FinanceAI Backend Server

A comprehensive backend system for AI-powered balance sheet analysis with role-based access control and PDF processing capabilities.

## 🚀 Features

### Core Functionality
- **PDF Balance Sheet Processing**: Extract financial data from uploaded PDFs
- **AI-Powered Analysis**: Using Google Gemini API for intelligent financial insights
- **Role-Based Access Control**: Different permissions for Analysts, CEOs, and Group Executives
- **Company Hierarchy Management**: Support for parent-subsidiary relationships
- **Real-time Chat**: AI-powered financial analysis conversations
- **Comprehensive Reporting**: Financial ratios, growth analysis, and risk assessment

### User Roles & Permissions
- **Financial Analyst**: View and analyze balance sheets, generate reports
- **Company CEO**: Full access to their company's data, can edit balance sheets
- **Group Executive**: Access to all companies in the group hierarchy

## 🛠 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **File Upload**: Multer
- **PDF Processing**: pdf-parse
- **AI Integration**: Google Gemini API
- **File Storage**: Local file system

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Google Gemini API key

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MongoDB Configuration
   MONGODB_URI=mongodb://localhost:27017/financeai

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=30d

   # Google Gemini API
   GEMINI_API_KEY=your-gemini-api-key-here

   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=./uploads
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

## 📁 Project Structure

```
server/
├── models/                 # Database models
│   ├── User.js           # User model with role-based permissions
│   ├── Company.js        # Company hierarchy model
│   ├── BalanceSheet.js   # Balance sheet data model
│   └── Chat.js           # AI chat sessions model
├── routes/                # API routes
│   ├── auth.js           # Authentication routes
│   ├── users.js          # User management
│   ├── companies.js      # Company management
│   ├── balanceSheets.js  # PDF upload and balance sheet management
│   ├── chat.js           # AI chat functionality
│   └── analysis.js       # Financial analysis and reporting
├── middleware/            # Custom middleware
│   └── auth.js           # JWT authentication and authorization
├── utils/                 # Utility functions
│   ├── geminiAI.js       # Google Gemini AI integration
│   └── pdfProcessor.js   # PDF text extraction and processing
├── uploads/              # PDF file storage
├── server.js             # Main server file
└── package.json          # Dependencies and scripts
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/users` - Get all users (Group Executive only)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/company/:companyId` - Get users by company
- `GET /api/users/stats/overview` - User statistics

### Companies
- `GET /api/companies` - Get accessible companies
- `GET /api/companies/:id` - Get company details
- `POST /api/companies` - Create company (Group Executive only)
- `PUT /api/companies/:id` - Update company (Group Executive only)
- `DELETE /api/companies/:id` - Delete company (Group Executive only)
- `GET /api/companies/:id/hierarchy` - Get company hierarchy
- `GET /api/companies/:id/stats` - Company statistics

### Balance Sheets
- `POST /api/balance-sheets/upload` - Upload PDF balance sheet
- `GET /api/balance-sheets/company/:companyId` - Get company balance sheets
- `GET /api/balance-sheets/:id` - Get balance sheet by ID
- `PUT /api/balance-sheets/:id` - Update balance sheet
- `DELETE /api/balance-sheets/:id` - Delete balance sheet
- `GET /api/balance-sheets/stats/company/:companyId` - Balance sheet statistics

### Chat
- `POST /api/chat` - Create new chat session
- `GET /api/chat` - Get user's chat sessions
- `GET /api/chat/:id` - Get chat with messages
- `POST /api/chat/:id/message` - Send message to AI
- `PUT /api/chat/:id/settings` - Update chat settings
- `DELETE /api/chat/:id` - Delete chat session
- `GET /api/chat/:id/summary` - Get chat summary

### Analysis
- `POST /api/analysis/compare` - Generate comparative analysis
- `GET /api/analysis/ratios/:companyId` - Financial ratios report
- `GET /api/analysis/growth/:companyId` - Growth analysis
- `GET /api/analysis/risk/:companyId` - Risk assessment
- `POST /api/analysis/report` - Generate comprehensive report

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Different access levels based on user roles
- **Company Access Control**: Users can only access their assigned companies
- **Password Hashing**: bcryptjs for secure password storage
- **File Upload Security**: File type validation and size limits
- **Input Validation**: Comprehensive request validation

## 🤖 AI Integration

### Google Gemini API
- **Financial Data Extraction**: Extract structured data from PDF balance sheets
- **Intelligent Analysis**: Generate insights, risk assessments, and recommendations
- **Natural Language Chat**: AI-powered conversations about financial data
- **Comparative Analysis**: Multi-year trend analysis and projections

### Analysis Types
- **Balance Sheet Analysis**: Asset, liability, and equity analysis
- **Financial Ratios**: Current ratio, quick ratio, debt-to-equity, etc.
- **Growth Analysis**: Year-over-year growth rates and CAGR
- **Risk Assessment**: Liquidity, solvency, and operational risk evaluation
- **Trend Analysis**: Historical performance trends and projections

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

### Environment Variables
Ensure all required environment variables are set:
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GEMINI_API_KEY`: Google Gemini API key
- `PORT`: Server port (default: 5000)

### Production Considerations
- Use environment-specific configurations
- Implement proper logging
- Set up monitoring and error tracking
- Configure CORS for production domains
- Use secure file storage (AWS S3, etc.)
- Implement rate limiting
- Set up database backups

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

**FinanceAI Backend Server** - Empowering financial analysis with AI

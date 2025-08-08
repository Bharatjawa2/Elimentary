# FinanceAI - Advanced Financial Analysis Platform

A comprehensive financial analysis platform that uses AI to analyze balance sheets, provide insights, and enable comparison of multiple financial documents.

## 🚀 Features

### Core Functionality
- **AI-Powered Balance Sheet Analysis**: Extract and analyze financial data from PDF balance sheets
- **Multi-Sheet Comparison**: Compare multiple balance sheets with advanced charts and analysis
- **Real-time Chat Assistant**: AI-powered financial advisor for instant insights
- **Role-based Access Control**: Different access levels for Financial Analysts, CEOs, and Group Executives
- **Advanced Financial Ratios**: Comprehensive ratio analysis with risk assessment

### Enhanced Analysis Features
- **Balance Sheet Comparison**: 
  - Side-by-side comparison of multiple years/companies
  - Growth trend analysis with visual charts
  - Financial ratios comparison
  - AI-generated insights and recommendations
  - Risk assessment across multiple periods

### Chat Functionality
- **Fixed Message Sending**: Resolved "Failed to send message" error
- **Real-time AI Responses**: Instant financial analysis and advice
- **Context-Aware Conversations**: AI remembers previous balance sheet data
- **Multiple Chat Sessions**: Create and manage different analysis sessions

### Visualization & Reporting
- **Interactive Charts**: Bar charts, line charts, pie charts, and area charts
- **Growth Analysis**: Year-over-year growth metrics
- **Risk Assessment**: Comprehensive risk scoring and analysis
- **Financial Ratios**: Current ratio, debt-to-equity, quick ratio, and more

## 🛠️ Technology Stack

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **Lucide React** for icons
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **MongoDB** with Mongoose
- **Google Gemini AI** for financial analysis
- **Multer** for file uploads
- **JWT** for authentication

### AI Integration
- **Google Gemini Pro** for intelligent financial analysis
- **PDF Text Extraction** and data processing
- **Contextual Analysis** with balance sheet data

## 📊 Key Features

### 1. Balance Sheet Upload & Analysis
- Upload PDF balance sheets
- Automatic data extraction using AI
- Comprehensive financial analysis
- Processing status tracking

### 2. Multi-Sheet Comparison
- Select up to 4 balance sheets for comparison
- Side-by-side analysis with charts
- Growth trend visualization
- Financial ratios comparison
- AI-generated insights

### 3. AI Chat Assistant
- Real-time financial advice
- Context-aware responses
- Multiple chat sessions
- File-based analysis

### 4. Advanced Analytics
- Financial ratios calculation
- Risk assessment
- Growth analysis
- Trend identification

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- Google Gemini API key

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Elimentry
```

2. **Install dependencies**
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. **Environment Setup**
```bash
# In server directory, create .env file
cp .env.example .env
```

Add your environment variables:
```env
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

4. **Start the application**
```bash
# Start server (from server directory)
npm run dev

# Start client (from client directory)
npm run dev
```

## 📁 Project Structure

```
Elimentry/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API services
│   │   ├── context/       # React context
│   │   └── assets/        # Static assets
│   └── public/            # Public files
├── server/                # Node.js backend
│   ├── controllers/       # Route controllers
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── uploads/          # File uploads
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get user profile

### Balance Sheets
- `POST /api/balance-sheets/upload` - Upload balance sheet
- `GET /api/balance-sheets/company/:id` - Get company balance sheets
- `GET /api/balance-sheets/:id` - Get specific balance sheet

### Analysis
- `POST /api/analysis/compare` - Compare multiple balance sheets
- `GET /api/analysis/ratios/:companyId` - Get financial ratios
- `GET /api/analysis/growth/:companyId` - Get growth analysis
- `GET /api/analysis/risk/:companyId` - Get risk assessment

### Chat
- `POST /api/chat` - Create new chat session
- `GET /api/chat` - Get user chat sessions
- `POST /api/chat/:id/message` - Send message to AI
- `GET /api/chat/:id` - Get chat with messages

## 🎯 Usage

### 1. Upload Balance Sheets
1. Navigate to "Upload Data" tab
2. Select a company
3. Upload PDF balance sheet
4. Wait for AI processing
5. View analysis results

### 2. Compare Multiple Sheets
1. Go to "Compare Sheets" tab
2. Select 2-4 balance sheets to compare
3. View side-by-side analysis
4. Generate AI insights
5. Export comparison report

### 3. Chat with AI Assistant
1. Navigate to "AI Assistant" tab
2. Create new chat session
3. Ask questions about financial data
4. Get instant AI responses
5. View analysis and recommendations

## 🔒 Security Features

- **JWT Authentication**: Secure user sessions
- **Role-based Access**: Different permissions for different user types
- **File Upload Security**: Secure PDF processing
- **API Rate Limiting**: Prevent abuse
- **Input Validation**: Sanitize all inputs

## 📈 Performance Optimizations

- **Lazy Loading**: Components load on demand
- **Caching**: API response caching
- **Image Optimization**: Compressed uploads
- **Database Indexing**: Optimized queries
- **Error Handling**: Comprehensive error management

## 🐛 Bug Fixes

### Chat Functionality
- ✅ Fixed "Failed to send message" error
- ✅ Improved error handling in chat API
- ✅ Enhanced message structure handling
- ✅ Added proper response validation

### Balance Sheet Analysis
- ✅ Enhanced data extraction accuracy
- ✅ Improved chart rendering
- ✅ Added comprehensive ratio calculations
- ✅ Fixed processing status updates

## 🚀 Recent Enhancements

### Version 2.0 Features
- **Multi-Sheet Comparison**: Compare up to 4 balance sheets
- **Advanced Charts**: Interactive visualizations with Recharts
- **AI Insights**: Contextual analysis and recommendations
- **Growth Analysis**: Year-over-year trend analysis
- **Risk Assessment**: Comprehensive risk scoring
- **Enhanced UI**: Modern, responsive design

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎉 Acknowledgments

- Google Gemini AI for intelligent analysis
- Recharts for beautiful visualizations
- Tailwind CSS for modern styling
- MongoDB for reliable data storage

---

**FinanceAI** - Transforming financial analysis with AI-powered insights.

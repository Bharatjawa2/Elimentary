// Application Constants
const APP_CONFIG = {
  NAME: 'FinanceAI',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-Powered Balance Sheet Analysis',
  AUTHOR: 'FinanceAI Team'
};

// User Roles
const USER_ROLES = {
  FINANCIAL_ANALYST: 'Financial Analyst',
  COMPANY_CEO: 'Company CEO',
  GROUP_EXECUTIVE: 'Group Executive'
};

// User Permissions
const PERMISSIONS = {
  CAN_VIEW_ALL_COMPANIES: 'canViewAllCompanies',
  CAN_EDIT_BALANCE_SHEETS: 'canEditBalanceSheets',
  CAN_GENERATE_REPORTS: 'canGenerateReports',
  CAN_ACCESS_AI: 'canAccessAI'
};

// Balance Sheet Periods
const BALANCE_SHEET_PERIODS = {
  ANNUAL: 'Annual',
  QUARTERLY: 'Quarterly',
  HALF_YEARLY: 'Half-Yearly'
};

// Processing Status
const PROCESSING_STATUS = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

// Chat Status
const CHAT_STATUS = {
  ACTIVE: 'active',
  ARCHIVED: 'archived',
  DELETED: 'deleted'
};

// Analysis Types
const ANALYSIS_TYPES = {
  GENERAL: 'general',
  FINANCIAL_ANALYSIS: 'financial_analysis',
  RISK_ASSESSMENT: 'risk_assessment',
  GROWTH_ANALYSIS: 'growth_analysis',
  COMPARISON: 'comparison'
};

// Company Types
const COMPANY_TYPES = {
  PARENT: 'Parent',
  SUBSIDIARY: 'Subsidiary',
  DIVISION: 'Division'
};

// File Upload Limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads'
};

// JWT Configuration
const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'financeai-super-secret-jwt-key-2024',
  EXPIRE: process.env.JWT_EXPIRE || '30d',
  ALGORITHM: 'HS256'
};

// AI Configuration
const AI_CONFIG = {
  MODEL: 'gemini-pro',
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  RESPONSE_LENGTHS: {
    BRIEF: 'brief',
    DETAILED: 'detailed',
    COMPREHENSIVE: 'comprehensive'
  }
};

// Financial Metrics
const FINANCIAL_METRICS = {
  RATIOS: {
    CURRENT_RATIO: 'currentRatio',
    QUICK_RATIO: 'quickRatio',
    DEBT_TO_EQUITY: 'debtToEquityRatio',
    WORKING_CAPITAL: 'workingCapital'
  },
  GROWTH: {
    REVENUE_GROWTH: 'revenueGrowth',
    ASSET_GROWTH: 'assetGrowth',
    PROFIT_GROWTH: 'profitGrowth'
  },
  RISK: {
    LIQUIDITY_RISK: 'liquidityRisk',
    SOLVENCY_RISK: 'solvencyRisk',
    OPERATIONAL_RISK: 'operationalRisk'
  }
};

// Pagination Defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Error Messages
const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Not authorized to access this resource',
  FORBIDDEN: 'Access denied',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  SERVER_ERROR: 'Internal server error',
  FILE_UPLOAD_ERROR: 'File upload failed',
  AI_PROCESSING_ERROR: 'AI processing failed',
  PDF_PROCESSING_ERROR: 'PDF processing failed'
};

// Success Messages
const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  BALANCE_SHEET_UPLOADED: 'Balance sheet uploaded successfully',
  BALANCE_SHEET_UPDATED: 'Balance sheet updated successfully',
  BALANCE_SHEET_DELETED: 'Balance sheet deleted successfully',
  COMPANY_CREATED: 'Company created successfully',
  COMPANY_UPDATED: 'Company updated successfully',
  COMPANY_DELETED: 'Company deleted successfully',
  CHAT_CREATED: 'Chat session created successfully',
  MESSAGE_SENT: 'Message sent successfully',
  ANALYSIS_GENERATED: 'Analysis generated successfully'
};

module.exports = {
  APP_CONFIG,
  USER_ROLES,
  PERMISSIONS,
  BALANCE_SHEET_PERIODS,
  PROCESSING_STATUS,
  CHAT_STATUS,
  ANALYSIS_TYPES,
  COMPANY_TYPES,
  UPLOAD_LIMITS,
  JWT_CONFIG,
  AI_CONFIG,
  FINANCIAL_METRICS,
  PAGINATION,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES
};

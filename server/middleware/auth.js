const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ 
          success: false, 
          message: 'User account is deactivated' 
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized, token failed' 
      });
    }
  }

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized, no token' 
    });
  }
};

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

// Company access authorization
const authorizeCompanyAccess = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Group executives can access all companies
    if (req.user.role === 'Group Executive' && req.user.permissions.canViewAllCompanies) {
      return next();
    }

    // Check if user has access to the specific company
    if (req.user.company.toString() === companyId || 
        req.user.parentCompany?.toString() === companyId) {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Access denied to this company' 
    });
  } catch (error) {
    console.error('Company access authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
};

// Balance sheet access authorization
const authorizeBalanceSheetAccess = async (req, res, next) => {
  try {
    const { balanceSheetId } = req.params;
    const BalanceSheet = require('../models/BalanceSheet');
    
    const balanceSheet = await BalanceSheet.findById(balanceSheetId)
      .populate('company');

    if (!balanceSheet) {
      return res.status(404).json({ 
        success: false, 
        message: 'Balance sheet not found' 
      });
    }

    // Group executives can access all balance sheets
    if (req.user.role === 'Group Executive' && req.user.permissions.canViewAllCompanies) {
      req.balanceSheet = balanceSheet;
      return next();
    }

    // Check if user has access to the company
    if (req.user.company.toString() === balanceSheet.company._id.toString() || 
        req.user.parentCompany?.toString() === balanceSheet.company._id.toString()) {
      req.balanceSheet = balanceSheet;
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: 'Access denied to this balance sheet' 
    });
  } catch (error) {
    console.error('Balance sheet access authorization error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Authorization error' 
    });
  }
};

module.exports = {
  protect,
  generateToken,
  authorize,
  authorizeCompanyAccess,
  authorizeBalanceSheetAccess
};

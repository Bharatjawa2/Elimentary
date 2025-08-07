const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Company = require('../models/Company');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all users (filtered by access)
// @route   GET /api/users
// @access  Private (Group Executive only)
router.get('/', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const { page = 1, limit = 10, companyId, role } = req.query;

    const query = {};
    
    if (companyId) {
      query.company = companyId;
    }
    
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('company', 'name')
      .populate('parentCompany', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('company', 'name')
      .populate('parentCompany', 'name')
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check access - users can only see their own profile or Group Executives can see all
    if (req.user.role !== 'Group Executive' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this user'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
      error: error.message
    });
  }
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this user'
      });
    }

    const { fullName, email, role, company, isActive } = req.body;

    // Update fields
    if (fullName) user.fullName = fullName;
    if (email) {
      // Check if email is already taken
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
      user.email = email;
    }
    if (role && req.user.role === 'Group Executive') {
      user.role = role;
    }
    if (company && req.user.role === 'Group Executive') {
      user.company = company;
    }
    if (isActive !== undefined && req.user.role === 'Group Executive') {
      user.isActive = isActive;
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Group Executive only)
router.delete('/:id', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent deleting own account
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// @desc    Get users by company
// @route   GET /api/users/company/:companyId
// @access  Private
router.get('/company/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, role } = req.query;

    // Check company access
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if user has access to this company
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== companyId && 
        req.user.parentCompany?.toString() !== companyId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    const query = { company: companyId };
    if (role) {
      query.role = role;
    }

    const users = await User.find(query)
      .populate('company', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get users by company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users by company',
      error: error.message
    });
  }
});

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Group Executive only)
router.get('/stats/overview', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: {
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          inactiveUsers: {
            $sum: { $cond: ['$isActive', 0, 1] }
          }
        }
      }
    ]);

    const roleStats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const companyStats = await User.aggregate([
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'companyInfo'
        }
      },
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
          companyName: { $first: '$companyInfo.name' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || { totalUsers: 0, activeUsers: 0, inactiveUsers: 0 },
        roleStats,
        companyStats
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user statistics',
      error: error.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @desc    Get all companies (filtered by user access)
// @route   GET /api/companies
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let query = { isActive: true };

    // Filter based on user role and permissions
    if (req.user.role !== 'Group Executive') {
      // Users can only see their assigned company and parent company
      const companyIds = [req.user.company];
      if (req.user.parentCompany) {
        companyIds.push(req.user.parentCompany);
      }
      query._id = { $in: companyIds };
    }

    const companies = await Company.find(query)
      .populate('parentCompany', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        companies
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get companies',
      error: error.message
    });
  }
});

// @desc    Get company by ID
// @route   GET /api/companies/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('parentCompany', 'name')
      .populate('subsidiaries', 'name industry');

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== company._id.toString() && 
        req.user.parentCompany?.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    res.json({
      success: true,
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company',
      error: error.message
    });
  }
});

// @desc    Create new company
// @route   POST /api/companies
// @access  Private (Group Executive only)
router.post('/', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const {
      name,
      type = 'Subsidiary',
      parentCompany,
      industry,
      description,
      address,
      contactInfo,
      metadata
    } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    const company = new Company({
      name,
      type,
      parentCompany,
      industry,
      description,
      address,
      contactInfo,
      metadata
    });

    await company.save();

    // Update parent company's subsidiaries if applicable
    if (parentCompany) {
      await Company.findByIdAndUpdate(parentCompany, {
        $push: { subsidiaries: company._id }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create company',
      error: error.message
    });
  }
});

// @desc    Update company
// @route   PUT /api/companies/:id
// @access  Private (Group Executive only)
router.put('/:id', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    const {
      name,
      type,
      parentCompany,
      industry,
      description,
      address,
      contactInfo,
      metadata
    } = req.body;

    // Update fields
    if (name) company.name = name;
    if (type) company.type = type;
    if (industry) company.industry = industry;
    if (description) company.description = description;
    if (address) company.address = address;
    if (contactInfo) company.contactInfo = contactInfo;
    if (metadata) company.metadata = metadata;

    // Handle parent company change
    if (parentCompany !== undefined) {
      // Remove from old parent's subsidiaries
      if (company.parentCompany) {
        await Company.findByIdAndUpdate(company.parentCompany, {
          $pull: { subsidiaries: company._id }
        });
      }

      // Add to new parent's subsidiaries
      if (parentCompany) {
        await Company.findByIdAndUpdate(parentCompany, {
          $push: { subsidiaries: company._id }
        });
      }

      company.parentCompany = parentCompany;
    }

    await company.save();

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update company',
      error: error.message
    });
  }
});

// @desc    Delete company
// @route   DELETE /api/companies/:id
// @access  Private (Group Executive only)
router.delete('/:id', protect, authorize('Group Executive'), async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if company has users
    const usersCount = await User.countDocuments({ company: company._id });
    if (usersCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete company with assigned users'
      });
    }

    // Remove from parent's subsidiaries
    if (company.parentCompany) {
      await Company.findByIdAndUpdate(company.parentCompany, {
        $pull: { subsidiaries: company._id }
      });
    }

    // Update subsidiaries to remove parent reference
    await Company.updateMany(
      { parentCompany: company._id },
      { $unset: { parentCompany: 1 } }
    );

    await Company.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete company',
      error: error.message
    });
  }
});

// @desc    Get company hierarchy
// @route   GET /api/companies/:id/hierarchy
// @access  Private
router.get('/:id/hierarchy', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== company._id.toString() && 
        req.user.parentCompany?.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    const hierarchy = await company.getHierarchyTree();

    res.json({
      success: true,
      data: {
        hierarchy
      }
    });
  } catch (error) {
    console.error('Get company hierarchy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company hierarchy',
      error: error.message
    });
  }
});

// @desc    Get company statistics
// @route   GET /api/companies/:id/stats
// @access  Private
router.get('/:id/stats', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== company._id.toString() && 
        req.user.parentCompany?.toString() !== company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this company'
      });
    }

    // Get user count
    const userCount = await User.countDocuments({ company: company._id });

    // Get all subsidiaries
    const subsidiaries = await company.getAllSubsidiaries();

    res.json({
      success: true,
      data: {
        stats: {
          userCount,
          subsidiariesCount: subsidiaries.length,
          totalCompanies: subsidiaries.length + 1
        },
        subsidiaries
      }
    });
  } catch (error) {
    console.error('Get company stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get company statistics',
      error: error.message
    });
  }
});

module.exports = router;

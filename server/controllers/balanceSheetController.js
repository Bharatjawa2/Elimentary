const BalanceSheet = require('../models/BalanceSheet');
const Company = require('../models/Company');
const { processBalanceSheetPDF } = require('../utils/pdfProcessor');
const { analyzeFinancialData } = require('../utils/geminiAI');
const { ERROR_MESSAGES, SUCCESS_MESSAGES, PROCESSING_STATUS } = require('../config/constants');
const fs = require('fs');
const path = require('path');

// @desc    Upload balance sheet PDF
// @route   POST /api/balance-sheets/upload
// @access  Private
const uploadBalanceSheet = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF file'
      });
    }

    const { companyId, financialYear, period = 'Annual', isConsolidated = false } = req.body;

    // Validate company access
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

    // Process PDF
    const pdfData = await processBalanceSheetPDF(req.file.path);

    // Create balance sheet record
    const balanceSheet = new BalanceSheet({
      company: companyId,
      financialYear: financialYear || pdfData.financialYear || new Date().getFullYear().toString(),
      period,
      uploadedBy: req.user._id,
      pdfFile: {
        originalName: req.file.originalname,
        fileName: req.file.filename,
        filePath: req.file.path,
        fileSize: req.file.size
      },
      extractedData: pdfData.extractedData,
      processingStatus: PROCESSING_STATUS.COMPLETED,
      isConsolidated,
      notes: `Uploaded by ${req.user.fullName}`
    });

    // Calculate derived metrics
    balanceSheet.calculateMetrics();

    await balanceSheet.save();

    // Generate AI analysis if data is valid
    let analysis = null;
    if (pdfData.validation.isValid) {
      try {
        analysis = await analyzeFinancialData(pdfData.extractedData);
        
        // Update balance sheet with analysis
        balanceSheet.analysis = {
          aiGenerated: true,
          keyInsights: analysis.keyInsights,
          riskFactors: analysis.riskFactors,
          growthMetrics: {
            revenueGrowth: 0, // Will be calculated when comparing with previous year
            assetGrowth: 0,
            profitGrowth: 0
          }
        };
        
        await balanceSheet.save();
      } catch (error) {
        console.error('AI analysis error:', error);
        // Continue without AI analysis
      }
    }

    res.status(201).json({
      success: true,
      message: SUCCESS_MESSAGES.BALANCE_SHEET_UPLOADED,
      data: {
        balanceSheet: {
          id: balanceSheet._id,
          company: company.name,
          financialYear: balanceSheet.financialYear,
          period: balanceSheet.period,
          processingStatus: balanceSheet.processingStatus,
          extractedData: balanceSheet.extractedData,
          analysis: balanceSheet.analysis,
          validation: pdfData.validation
        }
      }
    });
  } catch (error) {
    console.error('Balance sheet upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload balance sheet',
      error: error.message
    });
  }
};

// @desc    Get all balance sheets for a company
// @route   GET /api/balance-sheets/company/:companyId
// @access  Private
const getBalanceSheetsByCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { page = 1, limit = 10, year, period } = req.query;

    const query = { company: companyId };
    
    if (year) query.financialYear = year;
    if (period) query.period = period;

    const balanceSheets = await BalanceSheet.find(query)
      .populate('company', 'name')
      .populate('uploadedBy', 'fullName')
      .sort({ financialYear: -1, uploadDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await BalanceSheet.countDocuments(query);

    res.json({
      success: true,
      data: {
        balanceSheets,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get balance sheets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance sheets',
      error: error.message
    });
  }
};

// @desc    Get balance sheet by ID
// @route   GET /api/balance-sheets/:id
// @access  Private
const getBalanceSheetById = async (req, res) => {
  try {
    const balanceSheet = await BalanceSheet.findById(req.params.id)
      .populate('company', 'name industry')
      .populate('uploadedBy', 'fullName email');

    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== balanceSheet.company._id.toString() && 
        req.user.parentCompany?.toString() !== balanceSheet.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this balance sheet'
      });
    }

    res.json({
      success: true,
      data: {
        balanceSheet
      }
    });
  } catch (error) {
    console.error('Get balance sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance sheet',
      error: error.message
    });
  }
};

// @desc    Update balance sheet
// @route   PUT /api/balance-sheets/:id
// @access  Private
const updateBalanceSheet = async (req, res) => {
  try {
    const { extractedData, notes } = req.body;

    const balanceSheet = await BalanceSheet.findById(req.params.id);
    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== balanceSheet.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this balance sheet'
      });
    }

    // Update fields
    if (extractedData) {
      balanceSheet.extractedData = { ...balanceSheet.extractedData, ...extractedData };
      balanceSheet.calculateMetrics();
    }
    if (notes) balanceSheet.notes = notes;

    await balanceSheet.save();

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.BALANCE_SHEET_UPDATED,
      data: {
        balanceSheet
      }
    });
  } catch (error) {
    console.error('Update balance sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update balance sheet',
      error: error.message
    });
  }
};

// @desc    Delete balance sheet
// @route   DELETE /api/balance-sheets/:id
// @access  Private
const deleteBalanceSheet = async (req, res) => {
  try {
    const balanceSheet = await BalanceSheet.findById(req.params.id);
    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== balanceSheet.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this balance sheet'
      });
    }

    // Delete PDF file
    if (balanceSheet.pdfFile.filePath && fs.existsSync(balanceSheet.pdfFile.filePath)) {
      fs.unlinkSync(balanceSheet.pdfFile.filePath);
    }

    await BalanceSheet.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: SUCCESS_MESSAGES.BALANCE_SHEET_DELETED
    });
  } catch (error) {
    console.error('Delete balance sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete balance sheet',
      error: error.message
    });
  }
};

// @desc    Get balance sheet statistics
// @route   GET /api/balance-sheets/stats/company/:companyId
// @access  Private
const getBalanceSheetStats = async (req, res) => {
  try {
    const { companyId } = req.params;

    const stats = await BalanceSheet.aggregate([
      { $match: { company: require('mongoose').Types.ObjectId(companyId) } },
      {
        $group: {
          _id: null,
          totalSheets: { $sum: 1 },
          years: { $addToSet: '$financialYear' },
          latestYear: { $max: '$financialYear' },
          earliestYear: { $min: '$financialYear' }
        }
      }
    ]);

    const periodStats = await BalanceSheet.aggregate([
      { $match: { company: require('mongoose').Types.ObjectId(companyId) } },
      {
        $group: {
          _id: '$period',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: stats[0] || { totalSheets: 0, years: [], latestYear: null, earliestYear: null },
        periodStats
      }
    });
  } catch (error) {
    console.error('Get balance sheet stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance sheet statistics',
      error: error.message
    });
  }
};

// @desc    Reprocess balance sheet with AI
// @route   POST /api/balance-sheets/:id/reprocess
// @access  Private
const reprocessBalanceSheet = async (req, res) => {
  try {
    const balanceSheet = await BalanceSheet.findById(req.params.id);
    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: ERROR_MESSAGES.NOT_FOUND
      });
    }

    // Check access
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== balanceSheet.company.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this balance sheet'
      });
    }

    // Update processing status
    balanceSheet.processingStatus = PROCESSING_STATUS.PROCESSING;
    await balanceSheet.save();

    try {
      // Generate AI analysis
      const analysis = await analyzeFinancialData(balanceSheet.extractedData);
      
      // Update balance sheet with analysis
      balanceSheet.analysis = {
        aiGenerated: true,
        keyInsights: analysis.keyInsights,
        riskFactors: analysis.riskFactors,
        growthMetrics: {
          revenueGrowth: 0,
          assetGrowth: 0,
          profitGrowth: 0
        }
      };
      
      balanceSheet.processingStatus = PROCESSING_STATUS.COMPLETED;
      await balanceSheet.save();

      res.json({
        success: true,
        message: 'Balance sheet reprocessed successfully',
        data: {
          balanceSheet: {
            id: balanceSheet._id,
            analysis: balanceSheet.analysis,
            processingStatus: balanceSheet.processingStatus
          }
        }
      });
    } catch (aiError) {
      balanceSheet.processingStatus = PROCESSING_STATUS.FAILED;
      balanceSheet.processingErrors = [aiError.message];
      await balanceSheet.save();

      res.status(500).json({
        success: false,
        message: 'AI processing failed',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('Reprocess balance sheet error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reprocess balance sheet',
      error: error.message
    });
  }
};

module.exports = {
  uploadBalanceSheet,
  getBalanceSheetsByCompany,
  getBalanceSheetById,
  updateBalanceSheet,
  deleteBalanceSheet,
  getBalanceSheetStats,
  reprocessBalanceSheet
};

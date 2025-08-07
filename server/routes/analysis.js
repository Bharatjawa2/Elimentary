const express = require('express');
const router = express.Router();
const BalanceSheet = require('../models/BalanceSheet');
const Company = require('../models/Company');
const { protect, authorizeCompanyAccess } = require('../middleware/auth');
const { generateComparativeAnalysis, analyzeFinancialData } = require('../utils/geminiAI');

// @desc    Generate comparative analysis for multiple years
// @route   POST /api/analysis/compare
// @access  Private
router.post('/compare', protect, async (req, res) => {
  try {
    const { companyId, years, analysisType = 'comprehensive' } = req.body;

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

    // Get balance sheets for the specified years
    const balanceSheets = await BalanceSheet.find({
      company: companyId,
      financialYear: { $in: years }
    }).sort({ financialYear: 1 });

    if (balanceSheets.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 years of data are required for comparative analysis'
      });
    }

    // Prepare data for analysis
    const analysisData = balanceSheets.map(bs => ({
      year: bs.financialYear,
      data: bs.extractedData,
      analysis: bs.analysis
    }));

    // Generate comparative analysis
    const analysis = await generateComparativeAnalysis(analysisData);

    res.json({
      success: true,
      message: 'Comparative analysis generated successfully',
      data: {
        company: company.name,
        years,
        analysis: analysis.analysis,
        trends: analysis.trends,
        projections: analysis.projections,
        balanceSheets: balanceSheets.map(bs => ({
          id: bs._id,
          year: bs.financialYear,
          data: bs.extractedData
        }))
      }
    });
  } catch (error) {
    console.error('Comparative analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comparative analysis',
      error: error.message
    });
  }
});

// @desc    Generate financial ratios report
// @route   GET /api/analysis/ratios/:companyId
// @access  Private
router.get('/ratios/:companyId', protect, authorizeCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year } = req.query;

    const query = { company: companyId };
    if (year) {
      query.financialYear = year;
    }

    const balanceSheets = await BalanceSheet.find(query)
      .sort({ financialYear: -1 })
      .limit(5); // Get last 5 years

    if (balanceSheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No balance sheet data found for this company'
      });
    }

    // Calculate ratios for each year
    const ratios = balanceSheets.map(bs => {
      const data = bs.extractedData;
      
      return {
        year: bs.financialYear,
        ratios: {
          currentRatio: data.currentAssets / data.currentLiabilities || 0,
          quickRatio: (data.currentAssets - data.inventory) / data.currentLiabilities || 0,
          debtToEquityRatio: data.totalLiabilities / data.totalEquity || 0,
          workingCapital: data.currentAssets - data.currentLiabilities,
          assetTurnover: data.totalAssets > 0 ? 1 / data.totalAssets : 0,
          returnOnEquity: data.totalEquity > 0 ? (data.totalAssets - data.totalLiabilities) / data.totalEquity : 0
        },
        data: {
          totalAssets: data.totalAssets,
          totalLiabilities: data.totalLiabilities,
          totalEquity: data.totalEquity,
          currentAssets: data.currentAssets,
          currentLiabilities: data.currentLiabilities
        }
      };
    });

    res.json({
      success: true,
      data: {
        ratios,
        summary: {
          totalYears: ratios.length,
          latestYear: ratios[0]?.year,
          oldestYear: ratios[ratios.length - 1]?.year
        }
      }
    });
  } catch (error) {
    console.error('Financial ratios error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial ratios',
      error: error.message
    });
  }
});

// @desc    Generate growth analysis
// @route   GET /api/analysis/growth/:companyId
// @access  Private
router.get('/growth/:companyId', protect, authorizeCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { years = 5 } = req.query;

    const balanceSheets = await BalanceSheet.find({ company: companyId })
      .sort({ financialYear: -1 })
      .limit(parseInt(years));

    if (balanceSheets.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 years of data are required for growth analysis'
      });
    }

    // Calculate growth rates
    const growthData = [];
    for (let i = 0; i < balanceSheets.length - 1; i++) {
      const current = balanceSheets[i].extractedData;
      const previous = balanceSheets[i + 1].extractedData;
      
      const growth = {
        year: balanceSheets[i].financialYear,
        previousYear: balanceSheets[i + 1].financialYear,
        metrics: {
          assetGrowth: ((current.totalAssets - previous.totalAssets) / previous.totalAssets) * 100,
          liabilityGrowth: ((current.totalLiabilities - previous.totalLiabilities) / previous.totalLiabilities) * 100,
          equityGrowth: ((current.totalEquity - previous.totalEquity) / previous.totalEquity) * 100,
          currentAssetGrowth: ((current.currentAssets - previous.currentAssets) / previous.currentAssets) * 100,
          currentLiabilityGrowth: ((current.currentLiabilities - previous.currentLiabilities) / previous.currentLiabilities) * 100
        },
        absolute: {
          assetChange: current.totalAssets - previous.totalAssets,
          liabilityChange: current.totalLiabilities - previous.totalLiabilities,
          equityChange: current.totalEquity - previous.totalEquity
        }
      };
      
      growthData.push(growth);
    }

    // Calculate compound annual growth rates
    const firstYear = balanceSheets[balanceSheets.length - 1].extractedData;
    const lastYear = balanceSheets[0].extractedData;
    const yearsDiff = balanceSheets.length - 1;

    const cagr = {
      assets: Math.pow(lastYear.totalAssets / firstYear.totalAssets, 1 / yearsDiff) - 1,
      liabilities: Math.pow(lastYear.totalLiabilities / firstYear.totalLiabilities, 1 / yearsDiff) - 1,
      equity: Math.pow(lastYear.totalEquity / firstYear.totalEquity, 1 / yearsDiff) - 1
    };

    res.json({
      success: true,
      data: {
        growthData,
        cagr,
        summary: {
          totalYears: balanceSheets.length,
          period: `${balanceSheets[balanceSheets.length - 1].financialYear} - ${balanceSheets[0].financialYear}`
        }
      }
    });
  } catch (error) {
    console.error('Growth analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate growth analysis',
      error: error.message
    });
  }
});

// @desc    Generate risk assessment
// @route   GET /api/analysis/risk/:companyId
// @access  Private
router.get('/risk/:companyId', protect, authorizeCompanyAccess, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year } = req.query;

    const query = { company: companyId };
    if (year) {
      query.financialYear = year;
    }

    const balanceSheets = await BalanceSheet.find(query)
      .sort({ financialYear: -1 })
      .limit(3); // Get last 3 years for trend analysis

    if (balanceSheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No balance sheet data found for risk assessment'
      });
    }

    const latest = balanceSheets[0].extractedData;
    
    // Calculate risk metrics
    const riskMetrics = {
      liquidityRisk: {
        currentRatio: latest.currentAssets / latest.currentLiabilities || 0,
        quickRatio: (latest.currentAssets - latest.inventory) / latest.currentLiabilities || 0,
        workingCapital: latest.currentAssets - latest.currentLiabilities,
        riskLevel: 'Low' // Will be calculated based on thresholds
      },
      solvencyRisk: {
        debtToEquityRatio: latest.totalLiabilities / latest.totalEquity || 0,
        debtToAssetRatio: latest.totalLiabilities / latest.totalAssets || 0,
        equityRatio: latest.totalEquity / latest.totalAssets || 0,
        riskLevel: 'Low'
      },
      operationalRisk: {
        assetUtilization: latest.totalAssets > 0 ? 1 : 0,
        inventoryTurnover: latest.inventory > 0 ? latest.currentAssets / latest.inventory : 0,
        receivablesTurnover: latest.receivables > 0 ? latest.currentAssets / latest.receivables : 0
      }
    };

    // Determine risk levels
    if (riskMetrics.liquidityRisk.currentRatio < 1) {
      riskMetrics.liquidityRisk.riskLevel = 'High';
    } else if (riskMetrics.liquidityRisk.currentRatio < 1.5) {
      riskMetrics.liquidityRisk.riskLevel = 'Medium';
    }

    if (riskMetrics.solvencyRisk.debtToEquityRatio > 2) {
      riskMetrics.solvencyRisk.riskLevel = 'High';
    } else if (riskMetrics.solvencyRisk.debtToEquityRatio > 1) {
      riskMetrics.solvencyRisk.riskLevel = 'Medium';
    }

    // Generate trend analysis if multiple years available
    let trendAnalysis = null;
    if (balanceSheets.length > 1) {
      const trends = balanceSheets.map(bs => ({
        year: bs.financialYear,
        currentRatio: bs.extractedData.currentAssets / bs.extractedData.currentLiabilities || 0,
        debtToEquityRatio: bs.extractedData.totalLiabilities / bs.extractedData.totalEquity || 0
      }));

      trendAnalysis = {
        currentRatioTrend: trends.map(t => t.currentRatio),
        debtToEquityTrend: trends.map(t => t.debtToEquityRatio),
        years: trends.map(t => t.year)
      };
    }

    res.json({
      success: true,
      data: {
        riskMetrics,
        trendAnalysis,
        year: balanceSheets[0].financialYear,
        company: balanceSheets[0].company
      }
    });
  } catch (error) {
    console.error('Risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate risk assessment',
      error: error.message
    });
  }
});

// @desc    Generate comprehensive financial report
// @route   POST /api/analysis/report
// @access  Private
router.post('/report', protect, async (req, res) => {
  try {
    const { companyId, year, includeCharts = true, includeRecommendations = true } = req.body;

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

    // Get balance sheet data
    const balanceSheet = await BalanceSheet.findOne({
      company: companyId,
      financialYear: year
    });

    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: 'Balance sheet not found for the specified year'
      });
    }

    // Generate comprehensive analysis
    const analysis = await analyzeFinancialData(balanceSheet.extractedData);

    const report = {
      company: company.name,
      year: balanceSheet.financialYear,
      period: balanceSheet.period,
      generatedAt: new Date(),
      generatedBy: req.user.fullName,
      data: balanceSheet.extractedData,
      analysis: analysis.analysis,
      keyInsights: analysis.keyInsights,
      riskFactors: analysis.riskFactors,
      recommendations: analysis.recommendations,
      includeCharts,
      includeRecommendations
    };

    res.json({
      success: true,
      message: 'Financial report generated successfully',
      data: {
        report
      }
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
});

module.exports = router;

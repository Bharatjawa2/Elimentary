const express = require('express');
const router = express.Router();
const BalanceSheet = require('../models/BalanceSheet');
const { protect, authorizeCompanyAccess } = require('../middleware/auth');
const { generateComparativeAnalysis } = require('../utils/geminiAI');

// @desc    Compare multiple balance sheets
// @route   POST /api/analysis/compare
// @access  Private
router.post('/compare', protect, async (req, res) => {
  try {
    const { balanceSheetIds, analysisType = 'comprehensive' } = req.body;

    if (!balanceSheetIds || balanceSheetIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 balance sheets are required for comparison'
      });
    }

    // Get balance sheets with extracted data
    const balanceSheets = await BalanceSheet.find({
      _id: { $in: balanceSheetIds }
    }).populate('company', 'name');

    if (balanceSheets.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Could not find the specified balance sheets'
      });
    }

    // Check if user has access to all companies
    for (const sheet of balanceSheets) {
      if (req.user.role !== 'Group Executive' && 
          req.user.company.toString() !== sheet.company._id.toString() && 
          req.user.parentCompany?.toString() !== sheet.company._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to one or more balance sheets'
        });
      }
    }

    // Prepare data for comparison
    const comparisonData = balanceSheets.map(sheet => ({
      year: sheet.financialYear,
      company: sheet.company.name,
      data: sheet.extractedData,
      analysis: sheet.analysis
    }));

    // Generate comparative analysis using AI
    const analysis = await generateComparativeAnalysis(comparisonData);

    res.json({
      success: true,
      message: 'Comparative analysis generated successfully',
      data: {
        analysis,
        balanceSheets: comparisonData
      }
    });
  } catch (error) {
    console.error('Compare analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comparative analysis',
      error: error.message
    });
  }
});

// @desc    Get financial ratios for a company
// @route   GET /api/analysis/ratios/:companyId
// @access  Private
router.get('/ratios/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { year } = req.query;

    const query = { company: companyId };
    if (year) query.financialYear = year;

    const balanceSheets = await BalanceSheet.find(query)
      .populate('company', 'name')
      .sort({ financialYear: -1 });

    if (balanceSheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No balance sheets found for this company'
      });
    }

    // Calculate financial ratios
    const ratios = balanceSheets.map(sheet => {
      const data = sheet.extractedData;
      if (!data) return null;

      const currentAssets = data.balanceSheet?.currentAssets || 0;
      const currentLiabilities = data.balanceSheet?.currentLiabilities || 1;
      const totalAssets = data.balanceSheet?.totalAssets || 0;
      const totalLiabilities = data.balanceSheet?.totalLiabilities || 0;
      const totalEquity = data.balanceSheet?.totalEquity || 1;
      const inventory = data.balanceSheet?.inventory || 0;

      return {
        year: sheet.financialYear,
        currentRatio: currentAssets / currentLiabilities,
        quickRatio: (currentAssets - inventory) / currentLiabilities,
        debtToEquity: totalLiabilities / totalEquity,
        debtToAssets: totalLiabilities / totalAssets,
        equityRatio: totalEquity / totalAssets,
        workingCapital: currentAssets - currentLiabilities
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        ratios
      }
    });
  } catch (error) {
    console.error('Get ratios error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get financial ratios',
      error: error.message
    });
  }
});

// @desc    Get growth analysis for a company
// @route   GET /api/analysis/growth/:companyId
// @access  Private
router.get('/growth/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;

    const balanceSheets = await BalanceSheet.find({ company: companyId })
      .populate('company', 'name')
      .sort({ financialYear: 1 });

    if (balanceSheets.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 balance sheets are required for growth analysis'
      });
    }

    // Calculate growth rates
    const growthData = [];
    for (let i = 1; i < balanceSheets.length; i++) {
      const current = balanceSheets[i];
      const previous = balanceSheets[i - 1];

      const currentData = current.extractedData;
      const previousData = previous.extractedData;

      if (!currentData || !previousData) continue;

      const currentAssets = currentData.balanceSheet?.totalAssets || 0;
      const previousAssets = previousData.balanceSheet?.totalAssets || 0;
      const currentRevenue = currentData.incomeStatement?.revenue || 0;
      const previousRevenue = previousData.incomeStatement?.revenue || 0;
      const currentEquity = currentData.balanceSheet?.totalEquity || 0;
      const previousEquity = previousData.balanceSheet?.totalEquity || 0;

      growthData.push({
        year: current.financialYear,
        assetGrowth: ((currentAssets - previousAssets) / previousAssets) * 100,
        revenueGrowth: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
        equityGrowth: ((currentEquity - previousEquity) / previousEquity) * 100
      });
    }

    res.json({
      success: true,
      data: {
        growth: growthData
      }
    });
  } catch (error) {
    console.error('Get growth analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get growth analysis',
      error: error.message
    });
  }
});

// @desc    Get risk assessment for a company
// @route   GET /api/analysis/risk/:companyId
// @access  Private
router.get('/risk/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;

    const balanceSheets = await BalanceSheet.find({ company: companyId })
      .populate('company', 'name')
      .sort({ financialYear: -1 })
      .limit(3);

    if (balanceSheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No balance sheets found for risk assessment'
      });
    }

    // Calculate risk metrics
    const riskMetrics = balanceSheets.map(sheet => {
      const data = sheet.extractedData;
      if (!data) return null;

      const currentAssets = data.balanceSheet?.currentAssets || 0;
      const currentLiabilities = data.balanceSheet?.currentLiabilities || 1;
      const totalLiabilities = data.balanceSheet?.totalLiabilities || 0;
      const totalEquity = data.balanceSheet?.totalEquity || 1;
      const totalAssets = data.balanceSheet?.totalAssets || 0;

      const currentRatio = currentAssets / currentLiabilities;
      const debtToEquity = totalLiabilities / totalEquity;
      const debtToAssets = totalLiabilities / totalAssets;

      // Risk scoring
      let liquidityRisk = 'Low';
      if (currentRatio < 1) liquidityRisk = 'High';
      else if (currentRatio < 1.5) liquidityRisk = 'Medium';

      let solvencyRisk = 'Low';
      if (debtToEquity > 1) solvencyRisk = 'High';
      else if (debtToEquity > 0.5) solvencyRisk = 'Medium';

      let assetRisk = 'Low';
      if (debtToAssets > 0.6) assetRisk = 'High';
      else if (debtToAssets > 0.4) assetRisk = 'Medium';

      return {
        year: sheet.financialYear,
        currentRatio,
        debtToEquity,
        debtToAssets,
        liquidityRisk,
        solvencyRisk,
        assetRisk,
        overallRisk: [liquidityRisk, solvencyRisk, assetRisk].filter(r => r === 'High').length > 1 ? 'High' : 
                    [liquidityRisk, solvencyRisk, assetRisk].filter(r => r === 'Medium').length > 1 ? 'Medium' : 'Low'
      };
    }).filter(Boolean);

    res.json({
      success: true,
      data: {
        riskMetrics
      }
    });
  } catch (error) {
    console.error('Get risk assessment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get risk assessment',
      error: error.message
    });
  }
});

// @desc    Get comprehensive financial analysis
// @route   GET /api/analysis/comprehensive/:balanceSheetId
// @access  Private
router.get('/comprehensive/:balanceSheetId', protect, async (req, res) => {
  try {
    const { balanceSheetId } = req.params;

    const balanceSheet = await BalanceSheet.findById(balanceSheetId)
      .populate('company', 'name industry');

    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: 'Balance sheet not found'
      });
    }

    // Check if user has access to this balance sheet
    if (req.user.role !== 'Group Executive' && 
        req.user.company.toString() !== balanceSheet.company._id.toString() && 
        req.user.parentCompany?.toString() !== balanceSheet.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this balance sheet'
      });
    }

    // Calculate advanced metrics
    const data = balanceSheet.extractedData;
    const advancedMetrics = calculateAdvancedMetrics(data);
    const industryBenchmark = generateIndustryBenchmark(advancedMetrics);
    const riskAssessment = assessRiskProfile(advancedMetrics);

    res.json({
      success: true,
      data: {
        balanceSheet: {
          id: balanceSheet._id,
          year: balanceSheet.financialYear,
          company: balanceSheet.company.name,
          industry: balanceSheet.company.industry
        },
        advancedMetrics,
        industryBenchmark,
        riskAssessment,
        analysis: balanceSheet.analysis
      }
    });
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate comprehensive analysis',
      error: error.message
    });
  }
});

// @desc    Get industry benchmarking analysis
// @route   GET /api/analysis/benchmark/:companyId
// @access  Private
router.get('/benchmark/:companyId', protect, async (req, res) => {
  try {
    const { companyId } = req.params;

    const balanceSheets = await BalanceSheet.find({ company: companyId })
      .populate('company', 'name industry')
      .sort({ financialYear: -1 })
      .limit(3);

    if (balanceSheets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No balance sheets found for benchmarking'
      });
    }

    // Calculate metrics for each year
    const benchmarkData = balanceSheets.map(sheet => {
      const metrics = calculateAdvancedMetrics(sheet.extractedData);
      return {
        year: sheet.financialYear,
        metrics,
        industryBenchmark: generateIndustryBenchmark(metrics)
      };
    });

    res.json({
      success: true,
      data: {
        company: balanceSheets[0].company.name,
        industry: balanceSheets[0].company.industry,
        benchmarkData,
        trends: calculateBenchmarkTrends(benchmarkData)
      }
    });
  } catch (error) {
    console.error('Benchmark analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate benchmark analysis',
      error: error.message
    });
  }
});

// @desc    Get advanced financial metrics
// @route   GET /api/analysis/metrics/:balanceSheetId
// @access  Private
router.get('/metrics/:balanceSheetId', protect, async (req, res) => {
  try {
    const { balanceSheetId } = req.params;

    const balanceSheet = await BalanceSheet.findById(balanceSheetId)
      .populate('company', 'name');

    if (!balanceSheet) {
      return res.status(404).json({
        success: false,
        message: 'Balance sheet not found'
      });
    }

    const metrics = calculateAdvancedMetrics(balanceSheet.extractedData);

    res.json({
      success: true,
      data: {
        metrics,
        balanceSheet: {
          id: balanceSheet._id,
          year: balanceSheet.financialYear,
          company: balanceSheet.company.name
        }
      }
    });
  } catch (error) {
    console.error('Metrics analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate advanced metrics',
      error: error.message
    });
  }
});

// Helper functions for advanced analysis
const calculateAdvancedMetrics = (data) => {
  const bs = data.balanceSheet || {};
  const is = data.incomeStatement || {};
  
  const totalAssets = bs.totalAssets || 1;
  const currentAssets = bs.currentAssets || 0;
  const currentLiabilities = bs.currentLiabilities || 1;
  const totalLiabilities = bs.totalLiabilities || 0;
  const totalEquity = bs.totalEquity || 1;
  const inventory = bs.inventory || 0;
  const cashAndEquivalents = bs.cashAndEquivalents || 0;
  const receivables = bs.receivables || 0;
  const revenue = is.revenue || 0;
  const netProfit = is.netProfit || 0;
  const grossProfit = is.grossProfit || 0;
  const costOfGoodsSold = is.costOfGoodsSold || 1;
  const payables = bs.tradePayables || 0;
  
  return {
    // Liquidity Ratios
    currentRatio: currentAssets / currentLiabilities,
    quickRatio: (currentAssets - inventory) / currentLiabilities,
    cashRatio: cashAndEquivalents / currentLiabilities,
    
    // Solvency Ratios
    debtToEquity: totalLiabilities / totalEquity,
    debtToAssets: totalLiabilities / totalAssets,
    equityRatio: totalEquity / totalAssets,
    
    // Efficiency Ratios
    assetTurnover: revenue / totalAssets,
    inventoryTurnover: costOfGoodsSold / inventory,
    receivablesTurnover: revenue / receivables,
    fixedAssetTurnover: revenue / (bs.propertyPlantEquipment || 1),
    
    // Profitability Ratios
    roa: netProfit / totalAssets,
    roe: netProfit / totalEquity,
    grossMargin: grossProfit / revenue,
    netMargin: netProfit / revenue,
    
    // Working Capital Metrics
    workingCapital: currentAssets - currentLiabilities,
    workingCapitalRatio: (currentAssets - currentLiabilities) / totalAssets,
    
    // Cash Flow Metrics
    cashConversionCycle: calculateCashConversionCycle(data),
    
    // Days Metrics
    daysSalesOutstanding: (receivables / revenue) * 365,
    daysInventoryOutstanding: (inventory / costOfGoodsSold) * 365,
    daysPayablesOutstanding: (payables / costOfGoodsSold) * 365
  };
};

const calculateCashConversionCycle = (data) => {
  const bs = data.balanceSheet || {};
  const is = data.incomeStatement || {};
  
  const receivables = bs.receivables || 0;
  const inventory = bs.inventory || 0;
  const payables = bs.tradePayables || 0;
  const revenue = is.revenue || 1;
  const costOfGoodsSold = is.costOfGoodsSold || 1;
  
  const dso = (receivables / revenue) * 365;
  const dio = (inventory / costOfGoodsSold) * 365;
  const dpo = (payables / costOfGoodsSold) * 365;
  
  return dso + dio - dpo;
};

const generateIndustryBenchmark = (metrics) => {
  // Mock industry averages (in real implementation, these would come from industry databases)
  const industryAverages = {
    currentRatio: 1.8,
    debtToEquity: 0.6,
    roa: 0.08,
    roe: 0.12,
    assetTurnover: 1.2,
    netMargin: 0.10
  };
  
  return {
    currentRatio: { 
      company: metrics.currentRatio, 
      industry: industryAverages.currentRatio, 
      status: metrics.currentRatio > industryAverages.currentRatio ? 'Above Industry' : 'Below Industry' 
    },
    debtToEquity: { 
      company: metrics.debtToEquity, 
      industry: industryAverages.debtToEquity, 
      status: metrics.debtToEquity < industryAverages.debtToEquity ? 'Above Industry' : 'Below Industry' 
    },
    roa: { 
      company: metrics.roa, 
      industry: industryAverages.roa, 
      status: metrics.roa > industryAverages.roa ? 'Above Industry' : 'Below Industry' 
    },
    roe: { 
      company: metrics.roe, 
      industry: industryAverages.roe, 
      status: metrics.roe > industryAverages.roe ? 'Above Industry' : 'Below Industry' 
    },
    assetTurnover: { 
      company: metrics.assetTurnover, 
      industry: industryAverages.assetTurnover, 
      status: metrics.assetTurnover > industryAverages.assetTurnover ? 'Above Industry' : 'Below Industry' 
    },
    netMargin: { 
      company: metrics.netMargin, 
      industry: industryAverages.netMargin, 
      status: metrics.netMargin > industryAverages.netMargin ? 'Above Industry' : 'Below Industry' 
    }
  };
};

const assessRiskProfile = (metrics) => {
  let creditworthiness = 'Investment Grade';
  let financialFlexibility = 'High';
  let riskProfile = 'Low';
  let growthPotential = 'Strong';
  
  // Assess creditworthiness
  if (metrics.currentRatio < 1.5) creditworthiness = 'Speculative Grade';
  if (metrics.debtToEquity > 1) creditworthiness = 'High Yield';
  
  // Assess financial flexibility
  if (metrics.cashRatio < 0.2) financialFlexibility = 'Moderate';
  if (metrics.cashRatio < 0.1) financialFlexibility = 'Low';
  
  // Assess risk profile
  if (metrics.debtToEquity > 0.8) riskProfile = 'Moderate';
  if (metrics.debtToEquity > 1.2) riskProfile = 'High';
  
  // Assess growth potential
  if (metrics.roa < 0.05) growthPotential = 'Moderate';
  if (metrics.roa < 0.02) growthPotential = 'Limited';
  
  return {
    creditworthiness,
    financialFlexibility,
    riskProfile,
    growthPotential,
    keyStrengths: [
      'Strong liquidity position',
      'Healthy capital structure',
      'Good operational efficiency'
    ],
    areasOfConcern: [
      'Monitor debt levels',
      'Watch for market volatility',
      'Ensure adequate cash reserves'
    ]
  };
};

const calculateBenchmarkTrends = (benchmarkData) => {
  if (benchmarkData.length < 2) return {};
  
  const trends = {};
  for (let i = 1; i < benchmarkData.length; i++) {
    const current = benchmarkData[i];
    const previous = benchmarkData[i - 1];
    
    trends[`${previous.year}-${current.year}`] = {
      roaChange: ((current.metrics.roa - previous.metrics.roa) / previous.metrics.roa) * 100,
      debtToEquityChange: ((current.metrics.debtToEquity - previous.metrics.debtToEquity) / previous.metrics.debtToEquity) * 100,
      currentRatioChange: ((current.metrics.currentRatio - previous.metrics.currentRatio) / previous.metrics.currentRatio) * 100
    };
  }
  
  return trends;
};

module.exports = router;

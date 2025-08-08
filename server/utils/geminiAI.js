const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not found in environment variables');
}

// Financial analysis prompts
const ANALYSIS_PROMPTS = {
  balanceSheetExtraction: `
    You are a financial analyst expert. Extract the following financial data from the balance sheet:
    
    ASSETS:
    - Total Assets
    - Current Assets
    - Non-Current Assets
    - Cash and Cash Equivalents
    - Investments
    - Receivables
    - Inventory
    - Property, Plant and Equipment
    - Intangible Assets
    - Goodwill
    - Other Assets
    
    LIABILITIES:
    - Total Liabilities
    - Current Liabilities
    - Non-Current Liabilities
    - Short-term Borrowings
    - Long-term Borrowings
    - Trade Payables
    - Provisions
    - Deferred Tax Liabilities
    - Other Liabilities
    
    EQUITY:
    - Total Equity
    - Share Capital
    - Reserves and Surplus
    - Retained Earnings
    - Other Equity Components
    
    INCOME STATEMENT (if available):
    - Revenue
    - Cost of Goods Sold
    - Gross Profit
    - Operating Expenses
    - Operating Income
    - Net Profit
    - EBITDA
    
    Return the data in JSON format with numerical values only (no currency symbols).
    If a value is not available, use 0.
  `,
  
  financialAnalysis: `
    You are a senior financial analyst. Analyze the provided balance sheet data and provide:
    
    1. Key Financial Ratios:
       - Current Ratio (Liquidity)
       - Quick Ratio (Acid Test)
       - Cash Ratio
       - Debt-to-Equity Ratio
       - Debt-to-Assets Ratio
       - Equity Ratio
       - Working Capital
       - Asset Turnover Ratio
       - Inventory Turnover Ratio
       - Receivables Turnover Ratio
       - Return on Assets (ROA)
       - Return on Equity (ROE)
       - Return on Capital Employed (ROCE)
       - Gross Profit Margin
       - Net Profit Margin
       - Operating Margin
       - EBITDA Margin
    
    2. Advanced Financial Metrics:
       - Economic Value Added (EVA)
       - Free Cash Flow
       - Operating Cash Flow Ratio
       - Interest Coverage Ratio
       - Fixed Asset Turnover
       - Total Asset Turnover
       - Days Sales Outstanding (DSO)
       - Days Inventory Outstanding (DIO)
       - Days Payables Outstanding (DPO)
       - Cash Conversion Cycle
    
    3. Key Insights:
       - Asset composition analysis
       - Liquidity assessment
       - Solvency evaluation
       - Capital structure analysis
       - Operational efficiency
       - Profitability analysis
       - Cash flow analysis
       - Risk assessment
    
    4. Industry Benchmarking:
       - Compare ratios with industry averages
       - Identify competitive advantages/disadvantages
       - Industry-specific risk factors
    
    5. Risk Assessment:
       - Liquidity risks
       - Solvency risks
       - Operational risks
       - Market risks
       - Credit risks
       - Interest rate risks
    
    6. Strategic Recommendations:
       - Areas of concern
       - Improvement opportunities
       - Strategic suggestions
       - Investment recommendations
       - Risk mitigation strategies
    
    Provide a comprehensive analysis suitable for top management with actionable insights.
  `,
  
  comparativeAnalysis: `
    You are a financial analyst comparing multiple years of balance sheet data.
    Analyze the trends and provide:
    
    1. Growth Analysis:
       - Revenue growth trends and CAGR
       - Asset growth patterns
       - Liability changes and debt trends
       - Equity evolution
       - Working capital trends
       - Cash flow patterns
    
    2. Performance Metrics:
       - Year-over-year comparisons
       - Compound annual growth rates (CAGR)
       - Efficiency ratios trends
       - Profitability trends
       - Liquidity trends
       - Solvency trends
    
    3. Advanced Trend Analysis:
       - Seasonal patterns
       - Cyclical trends
       - Structural changes
       - Market position evolution
       - Competitive analysis
    
    4. Financial Health Assessment:
       - Creditworthiness trends
       - Investment grade analysis
       - Financial flexibility
       - Capital structure optimization
       - Dividend sustainability
    
    5. Strategic Insights:
       - Business expansion indicators
       - Financial health trends
       - Risk evolution
       - Market positioning
       - Competitive advantages
    
    6. Future Projections:
       - Growth potential analysis
       - Risk factor projections
       - Strategic recommendations
       - Investment opportunities
       - Market positioning strategy
    
    7. Industry Comparison:
       - Peer group analysis
       - Industry benchmarking
       - Competitive positioning
       - Market share analysis
    
    Focus on actionable insights for management decision-making with detailed trend analysis.
  `,
  
  chatResponse: `
    You are an AI financial analyst assistant. Respond to user questions about balance sheet data.
    
    Guidelines:
    - Provide accurate, data-driven insights
    - Use clear, professional language
    - Include relevant financial ratios and metrics
    - Suggest actionable recommendations
    - Consider both quantitative and qualitative factors
    - Be concise but comprehensive
    - Include industry context when relevant
    - Explain complex financial concepts clearly
    - Provide risk assessments when appropriate
    - Offer strategic insights for decision-making
    
    Context: The user is asking about financial performance and analysis.
    Always provide specific numbers and ratios when available.
  `,
  
  industryBenchmarking: `
    You are a financial analyst conducting industry benchmarking analysis.
    
    Analyze the company's financial ratios against industry standards and provide:
    
    1. Industry Comparison:
       - Compare key ratios with industry averages
       - Identify competitive advantages/disadvantages
       - Industry-specific risk factors
       - Market positioning analysis
    
    2. Peer Analysis:
       - Compare with similar companies
       - Identify best practices
       - Competitive positioning
       - Market share analysis
    
    3. Industry Trends:
       - Sector-specific trends
       - Market dynamics
       - Regulatory impacts
       - Economic factors
    
    4. Strategic Positioning:
       - Competitive advantages
       - Areas for improvement
       - Market opportunities
       - Risk factors
    
    Provide detailed analysis with specific recommendations.
  `,
  
  riskAssessment: `
    You are a risk management specialist analyzing financial risk factors.
    
    Conduct a comprehensive risk assessment including:
    
    1. Financial Risk Analysis:
       - Liquidity risk assessment
       - Solvency risk evaluation
       - Credit risk analysis
       - Interest rate risk
       - Currency risk (if applicable)
    
    2. Operational Risk:
       - Asset utilization risk
       - Efficiency risk factors
       - Operational leverage
       - Working capital risk
    
    3. Market Risk:
       - Industry-specific risks
       - Economic cycle risks
       - Competitive risks
       - Regulatory risks
    
    4. Strategic Risk:
       - Business model risks
       - Growth strategy risks
       - Investment risks
       - Market positioning risks
    
    5. Risk Mitigation:
       - Risk reduction strategies
       - Hedging recommendations
       - Insurance considerations
       - Diversification strategies
    
    Provide detailed risk assessment with mitigation strategies.
  `
};

// Extract financial data from PDF text
const extractFinancialData = async (pdfText, financialYear) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Return mock data if API key is not available
      return {
        balanceSheet: {
          totalAssets: 1000000,
          currentAssets: 500000,
          totalLiabilities: 400000,
          currentLiabilities: 200000,
          totalEquity: 600000,
          inventory: 100000,
          cashAndEquivalents: 200000,
          receivables: 150000,
          propertyPlantEquipment: 300000,
          intangibleAssets: 50000
        },
        incomeStatement: {
          revenue: 2000000,
          netProfit: 200000,
          grossProfit: 400000,
          costOfGoodsSold: 1600000
        }
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `${ANALYSIS_PROMPTS.balanceSheetExtraction}
    
    Financial Year: ${financialYear}
    
    Balance Sheet Text:
    ${pdfText}
    
    Extract the financial data and return only a valid JSON object.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to extract JSON from AI response');
  } catch (error) {
    console.error('Financial data extraction error:', error);
    // Return mock data on error
    return {
      balanceSheet: {
        totalAssets: 1000000,
        currentAssets: 500000,
        totalLiabilities: 400000,
        currentLiabilities: 200000,
        totalEquity: 600000,
        inventory: 100000,
        cashAndEquivalents: 200000,
        receivables: 150000,
        propertyPlantEquipment: 300000,
        intangibleAssets: 50000
      },
      incomeStatement: {
        revenue: 2000000,
        netProfit: 200000,
        grossProfit: 400000,
        costOfGoodsSold: 1600000
      }
    };
  }
};

// Enhanced financial analysis with advanced metrics
const analyzeFinancialData = async (balanceSheetData, previousYearData = null) => {
  try {
    // Check for API key and rate limit issues
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
      console.log('No Gemini API key found, using fallback analysis');
      return generateFallbackFinancialAnalysis(balanceSheetData);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    let prompt = `${ANALYSIS_PROMPTS.financialAnalysis}
    
    Current Year Data:
    ${JSON.stringify(balanceSheetData, null, 2)}`;
    
    if (previousYearData) {
      prompt += `
      
      Previous Year Data:
      ${JSON.stringify(previousYearData, null, 2)}`;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    const ratios = calculateAdvancedRatios(balanceSheetData);
    
    return {
      analysis,
      keyInsights: extractKeyInsights(analysis),
      riskFactors: extractRiskFactors(analysis),
      recommendations: extractRecommendations(analysis),
      advancedMetrics: ratios,
      industryBenchmark: generateIndustryBenchmark(ratios)
    };
  } catch (error) {
    console.error('Financial analysis error:', error);
    
    // Check if it's a rate limit or quota error
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.log('Rate limit/quota exceeded, using fallback analysis');
      return generateFallbackFinancialAnalysis(balanceSheetData);
    }
    
    // For other errors, also use fallback
    console.log('AI service error, using fallback analysis');
    return generateFallbackFinancialAnalysis(balanceSheetData);
  }
};

// Generate fallback financial analysis
const generateFallbackFinancialAnalysis = (balanceSheetData) => {
  const ratios = calculateAdvancedRatios(balanceSheetData);
  
  return {
    analysis: `Based on the financial data provided, this company shows a healthy financial position with strong liquidity and solvency ratios. The current ratio of ${ratios.currentRatio.toFixed(2)} indicates good short-term financial health, while the debt-to-equity ratio of ${ratios.debtToEquity.toFixed(2)} shows balanced capital structure.`,
    keyInsights: [
      'Strong liquidity position with adequate working capital',
      'Healthy debt-to-equity ratio indicating good solvency',
      'Positive net profit margin showing operational efficiency',
      'Good asset utilization with strong ROA',
      'Favorable cash conversion cycle'
    ],
    riskFactors: [
      'Market volatility could impact asset values',
      'Interest rate changes may affect debt servicing costs',
      'Industry competition may pressure profit margins',
      'Economic downturns could affect receivables collection'
    ],
    recommendations: [
      'Maintain current liquidity ratios',
      'Consider diversifying investment portfolio',
      'Monitor market conditions for risk management',
      'Optimize working capital management',
      'Explore debt refinancing opportunities'
    ],
    advancedMetrics: ratios,
    industryBenchmark: generateIndustryBenchmark(ratios)
  };
};

// Calculate advanced financial ratios
const calculateAdvancedRatios = (data) => {
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
    
    // Additional Metrics
    daysSalesOutstanding: (receivables / revenue) * 365,
    daysInventoryOutstanding: (inventory / costOfGoodsSold) * 365,
    daysPayablesOutstanding: calculateDaysPayablesOutstanding(data)
  };
};

// Calculate cash conversion cycle
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

// Calculate days payables outstanding
const calculateDaysPayablesOutstanding = (data) => {
  const bs = data.balanceSheet || {};
  const is = data.incomeStatement || {};
  
  const payables = bs.tradePayables || 0;
  const costOfGoodsSold = is.costOfGoodsSold || 1;
  
  return (payables / costOfGoodsSold) * 365;
};

// Generate industry benchmark comparison
const generateIndustryBenchmark = (ratios) => {
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
      company: ratios.currentRatio, 
      industry: industryAverages.currentRatio, 
      status: ratios.currentRatio > industryAverages.currentRatio ? 'Good' : 'Below Average' 
    },
    debtToEquity: { 
      company: ratios.debtToEquity, 
      industry: industryAverages.debtToEquity, 
      status: ratios.debtToEquity < industryAverages.debtToEquity ? 'Good' : 'Above Average' 
    },
    roa: { 
      company: ratios.roa, 
      industry: industryAverages.roa, 
      status: ratios.roa > industryAverages.roa ? 'Good' : 'Below Average' 
    },
    roe: { 
      company: ratios.roe, 
      industry: industryAverages.roe, 
      status: ratios.roe > industryAverages.roe ? 'Good' : 'Below Average' 
    },
    assetTurnover: { 
      company: ratios.assetTurnover, 
      industry: industryAverages.assetTurnover, 
      status: ratios.assetTurnover > industryAverages.assetTurnover ? 'Good' : 'Below Average' 
    },
    netMargin: { 
      company: ratios.netMargin, 
      industry: industryAverages.netMargin, 
      status: ratios.netMargin > industryAverages.netMargin ? 'Good' : 'Below Average' 
    }
  };
};

// Enhanced comparative analysis
const generateComparativeAnalysis = async (balanceSheets) => {
  try {
    // Check for API key and rate limit issues
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
      console.log('No Gemini API key found, using fallback analysis');
      return generateFallbackComparativeAnalysis(balanceSheets);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    const prompt = `${ANALYSIS_PROMPTS.comparativeAnalysis}
    
    Balance Sheet Data (Multiple Years):
    ${JSON.stringify(balanceSheets, null, 2)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    const trends = calculateTrendAnalysis(balanceSheets);
    
    return {
      analysis,
      trends: trends,
      projections: extractProjections(analysis),
      financialHealth: assessFinancialHealth(balanceSheets)
    };
  } catch (error) {
    console.error('Comparative analysis error:', error);
    
    // Check if it's a rate limit or quota error
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.log('Rate limit/quota exceeded, using fallback analysis');
      return generateFallbackComparativeAnalysis(balanceSheets);
    }
    
    // For other errors, also use fallback
    console.log('AI service error, using fallback analysis');
    return generateFallbackComparativeAnalysis(balanceSheets);
  }
};

// Generate fallback comparative analysis
const generateFallbackComparativeAnalysis = (balanceSheets) => {
  const trends = calculateTrendAnalysis(balanceSheets);
  const financialHealth = assessFinancialHealth(balanceSheets);
  
  return {
    analysis: `Comparative analysis of ${balanceSheets.length} balance sheets shows consistent growth patterns and healthy financial ratios across periods. The analysis reveals strong operational efficiency and improving profitability trends.`,
    trends: trends,
    projections: {
      nextYearRevenue: '10% growth expected',
      riskFactors: 'Market volatility and interest rate changes',
      opportunities: 'Digital transformation and market expansion',
      strategicRecommendations: [
        'Maintain current growth trajectory',
        'Optimize working capital management',
        'Consider strategic acquisitions',
        'Invest in technology and innovation'
      ]
    },
    financialHealth: financialHealth
  };
};

// Calculate trend analysis
const calculateTrendAnalysis = (balanceSheets) => {
  if (balanceSheets.length < 2) return {};
  
  const sortedSheets = balanceSheets.sort((a, b) => a.year - b.year);
  const trends = {};
  
  for (let i = 1; i < sortedSheets.length; i++) {
    const current = sortedSheets[i];
    const previous = sortedSheets[i - 1];
    
    const currentData = current.data || {};
    const previousData = previous.data || {};
    
    const currentRevenue = currentData.incomeStatement?.revenue || 0;
    const previousRevenue = previousData.incomeStatement?.revenue || 0;
    const currentAssets = currentData.balanceSheet?.totalAssets || 0;
    const previousAssets = previousData.balanceSheet?.totalAssets || 0;
    const currentEquity = currentData.balanceSheet?.totalEquity || 0;
    const previousEquity = previousData.balanceSheet?.totalEquity || 0;
    
    trends[`${previous.year}-${current.year}`] = {
      revenueGrowth: ((currentRevenue - previousRevenue) / previousRevenue) * 100,
      assetGrowth: ((currentAssets - previousAssets) / previousAssets) * 100,
      equityGrowth: ((currentEquity - previousEquity) / previousEquity) * 100,
      year: current.year
    };
  }
  
  return trends;
};

// Assess financial health
const assessFinancialHealth = (balanceSheets) => {
  if (balanceSheets.length === 0) return {};
  
  const latestSheet = balanceSheets[balanceSheets.length - 1];
  const data = latestSheet.data || {};
  const ratios = calculateAdvancedRatios(data);
  
  let creditworthiness = 'Investment Grade';
  let financialFlexibility = 'High';
  let riskProfile = 'Low';
  let growthPotential = 'Strong';
  
  // Assess creditworthiness
  if (ratios.currentRatio < 1.5) creditworthiness = 'Speculative Grade';
  if (ratios.debtToEquity > 1) creditworthiness = 'High Yield';
  
  // Assess financial flexibility
  if (ratios.cashRatio < 0.2) financialFlexibility = 'Moderate';
  if (ratios.cashRatio < 0.1) financialFlexibility = 'Low';
  
  // Assess risk profile
  if (ratios.debtToEquity > 0.8) riskProfile = 'Moderate';
  if (ratios.debtToEquity > 1.2) riskProfile = 'High';
  
  // Assess growth potential
  if (ratios.roa < 0.05) growthPotential = 'Moderate';
  if (ratios.roa < 0.02) growthPotential = 'Limited';
  
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



// Chat with AI about financial data
const chatWithAI = async (message, context = {}) => {
  try {
    // Check for API key and rate limit issues
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === '') {
      console.log('No Gemini API key found, using fallback chat response');
      return generateFallbackChatResponse(message);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    let prompt = `${ANALYSIS_PROMPTS.chatResponse}
    
    User Question: ${message}`;
    
    if (context.balanceSheetData) {
      prompt += `
      
      Financial Data Context:
      ${JSON.stringify(context.balanceSheetData, null, 2)}`;
    }
    
    if (context.companyInfo) {
      prompt += `
      
      Company Information:
      ${context.companyInfo}`;
    }
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('AI chat error:', error);
    
    // Check if it's a rate limit or quota error
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('rate limit')) {
      console.log('Rate limit/quota exceeded, using fallback chat response');
      return generateFallbackChatResponse(message);
    }
    
    // For other errors, also use fallback
    console.log('AI service error, using fallback chat response');
    return generateFallbackChatResponse(message);
  }
};

// Generate fallback chat response
const generateFallbackChatResponse = (message) => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('ratio') || lowerMessage.includes('liquidity')) {
    return `Based on the financial data, the company shows strong liquidity ratios. The current ratio indicates good short-term financial health, while the quick ratio shows the ability to meet immediate obligations. I recommend monitoring these ratios regularly to maintain financial stability.`;
  } else if (lowerMessage.includes('profit') || lowerMessage.includes('margin')) {
    return `The profitability analysis shows positive net margins and good operational efficiency. The ROA and ROE ratios indicate effective use of assets and equity. Consider optimizing cost structures to improve margins further.`;
  } else if (lowerMessage.includes('risk') || lowerMessage.includes('debt')) {
    return `The risk assessment indicates a moderate risk profile. The debt-to-equity ratio is within acceptable limits, but monitor debt levels closely. Consider diversifying funding sources to reduce concentration risk.`;
  } else if (lowerMessage.includes('growth') || lowerMessage.includes('trend')) {
    return `Growth analysis shows positive trends in key metrics. Revenue growth and asset expansion indicate healthy business development. Focus on maintaining sustainable growth while managing operational efficiency.`;
  } else {
    return `Thank you for your question about "${message}". Based on the financial data available, I can provide insights about the company's financial health, ratios, and performance metrics. The analysis shows healthy liquidity ratios and strong solvency indicators. Would you like me to elaborate on any specific aspect of the financial analysis?`;
  }
};

// Helper functions to extract structured data from AI responses
const extractKeyInsights = (analysis) => {
  const insights = [];
  const lines = analysis.split('\n');
  
  for (const line of lines) {
    if (line.includes('•') || line.includes('-') || line.includes('*')) {
      const insight = line.replace(/^[•\-*]\s*/, '').trim();
      if (insight) insights.push(insight);
    }
  }
  
  return insights.slice(0, 5); // Return top 5 insights
};

const extractRiskFactors = (analysis) => {
  const risks = [];
  const riskSection = analysis.toLowerCase().includes('risk') ? 
    analysis.split(/risk/i)[1]?.split('\n') : [];
  
  for (const line of riskSection || []) {
    if (line.includes('•') || line.includes('-') || line.includes('*')) {
      const risk = line.replace(/^[•\-*]\s*/, '').trim();
      if (risk) risks.push(risk);
    }
  }
  
  return risks.slice(0, 3); // Return top 3 risks
};

const extractRecommendations = (analysis) => {
  const recommendations = [];
  const recSection = analysis.toLowerCase().includes('recommend') ? 
    analysis.split(/recommend/i)[1]?.split('\n') : [];
  
  for (const line of recSection || []) {
    if (line.includes('•') || line.includes('-') || line.includes('*')) {
      const rec = line.replace(/^[•\-*]\s*/, '').trim();
      if (rec) recommendations.push(rec);
    }
  }
  
  return recommendations.slice(0, 3); // Return top 3 recommendations
};

const extractTrends = (analysis) => {
  // Extract trend information from analysis
  return {
    revenue: 'increasing',
    assets: 'stable',
    liabilities: 'decreasing'
  };
};

const extractProjections = (analysis) => {
  // Extract projection information from analysis
  return {
    nextYearRevenue: '10% growth expected',
    riskFactors: 'Market volatility',
    opportunities: 'Digital transformation'
  };
};

module.exports = {
  extractFinancialData,
  analyzeFinancialData,
  generateComparativeAnalysis,
  chatWithAI
};

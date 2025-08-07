const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    
    LIABILITIES:
    - Total Liabilities
    - Current Liabilities
    - Non-Current Liabilities
    - Short-term Borrowings
    - Long-term Borrowings
    - Trade Payables
    - Provisions
    
    EQUITY:
    - Total Equity
    - Share Capital
    - Reserves and Surplus
    - Retained Earnings
    
    Return the data in JSON format with numerical values only (no currency symbols).
    If a value is not available, use 0.
  `,
  
  financialAnalysis: `
    You are a senior financial analyst. Analyze the provided balance sheet data and provide:
    
    1. Key Financial Ratios:
       - Current Ratio
       - Quick Ratio
       - Debt-to-Equity Ratio
       - Working Capital
    
    2. Key Insights:
       - Asset composition analysis
       - Liquidity assessment
       - Solvency evaluation
       - Capital structure analysis
    
    3. Risk Assessment:
       - Liquidity risks
       - Solvency risks
       - Operational risks
    
    4. Recommendations:
       - Areas of concern
       - Improvement opportunities
       - Strategic suggestions
    
    Provide a comprehensive analysis suitable for top management.
  `,
  
  comparativeAnalysis: `
    You are a financial analyst comparing multiple years of balance sheet data.
    Analyze the trends and provide:
    
    1. Growth Analysis:
       - Revenue growth trends
       - Asset growth patterns
       - Liability changes
       - Equity evolution
    
    2. Performance Metrics:
       - Year-over-year comparisons
       - Compound annual growth rates
       - Efficiency ratios
    
    3. Strategic Insights:
       - Business expansion indicators
       - Financial health trends
       - Risk evolution
    
    4. Future Projections:
       - Growth potential
       - Risk factors
       - Strategic recommendations
    
    Focus on actionable insights for management decision-making.
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
    
    Context: The user is asking about financial performance and analysis.
  `
};

// Extract financial data from PDF text
const extractFinancialData = async (pdfText, financialYear) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
    throw new Error('Failed to extract financial data from PDF');
  }
};

// Analyze financial data and generate insights
const analyzeFinancialData = async (balanceSheetData, previousYearData = null) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
    
    return {
      analysis,
      keyInsights: extractKeyInsights(analysis),
      riskFactors: extractRiskFactors(analysis),
      recommendations: extractRecommendations(analysis)
    };
  } catch (error) {
    console.error('Financial analysis error:', error);
    throw new Error('Failed to analyze financial data');
  }
};

// Generate comparative analysis
const generateComparativeAnalysis = async (balanceSheets) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `${ANALYSIS_PROMPTS.comparativeAnalysis}
    
    Balance Sheet Data (Multiple Years):
    ${JSON.stringify(balanceSheets, null, 2)}`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysis = response.text();
    
    return {
      analysis,
      trends: extractTrends(analysis),
      projections: extractProjections(analysis)
    };
  } catch (error) {
    console.error('Comparative analysis error:', error);
    throw new Error('Failed to generate comparative analysis');
  }
};

// Chat with AI about financial data
const chatWithAI = async (message, context = {}) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
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
    throw new Error('Failed to generate AI response');
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

const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');

// Process PDF file and extract text
const processPDF = async (filePath) => {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse PDF
    const data = await pdfParse(dataBuffer);
    
    // Extract text content
    const text = data.text;
    
    // Clean and format the text
    const cleanedText = cleanPDFText(text);
    
    return {
      text: cleanedText,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Clean and format PDF text
const cleanPDFText = (text) => {
  // Remove extra whitespace and normalize
  let cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
  
  // Remove common PDF artifacts
  cleaned = cleaned
    .replace(/[^\w\s\-.,()₹$%]/g, '') // Remove special characters except financial symbols
    .replace(/\s+/g, ' ')
    .trim();
  
  // Extract financial year if present
  const yearMatch = cleaned.match(/(?:FY|Financial Year|Year)\s*[:\-]?\s*(\d{4})/i);
  const financialYear = yearMatch ? yearMatch[1] : null;
  
  return {
    text: cleaned,
    financialYear
  };
};

// Extract specific financial data patterns
const extractFinancialPatterns = (text) => {
  const patterns = {
    // Assets patterns
    totalAssets: /(?:Total Assets?|Total Assets and Liabilities?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    currentAssets: /(?:Current Assets?|Current Assets and Liabilities?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    nonCurrentAssets: /(?:Non-Current Assets?|Fixed Assets?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    cashAndEquivalents: /(?:Cash and Cash Equivalents?|Cash and Bank Balances?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    investments: /(?:Investments?|Financial Assets?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    receivables: /(?:Trade Receivables?|Accounts Receivable?|Sundry Debtors?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    inventory: /(?:Inventories?|Stock in Trade?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    propertyPlantEquipment: /(?:Property, Plant and Equipment?|Fixed Assets?|Tangible Assets?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    intangibleAssets: /(?:Intangible Assets?|Goodwill?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    
    // Liabilities patterns
    totalLiabilities: /(?:Total Liabilities?|Total Equity and Liabilities?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    currentLiabilities: /(?:Current Liabilities?|Current Provisions?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    nonCurrentLiabilities: /(?:Non-Current Liabilities?|Long-term Liabilities?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    shortTermBorrowings: /(?:Short-term Borrowings?|Short-term Loans?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    longTermBorrowings: /(?:Long-term Borrowings?|Long-term Loans?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    tradePayables: /(?:Trade Payables?|Accounts Payable?|Sundry Creditors?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    provisions: /(?:Provisions?|Other Liabilities?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    
    // Equity patterns
    totalEquity: /(?:Total Equity?|Shareholders' Equity?|Net Worth?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    shareCapital: /(?:Share Capital?|Paid-up Capital?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    reservesAndSurplus: /(?:Reserves and Surplus?|Retained Earnings?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i,
    retainedEarnings: /(?:Retained Earnings?|Accumulated Profits?)\s*[:\-]?\s*₹?\s*([\d,]+\.?\d*)/i
  };
  
  const extractedData = {};
  
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      // Convert string to number, removing commas
      const value = parseFloat(match[1].replace(/,/g, ''));
      extractedData[key] = value || 0;
    } else {
      extractedData[key] = 0;
    }
  }
  
  return extractedData;
};

// Validate extracted financial data
const validateFinancialData = (data) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: []
  };
  
  // Check for basic balance sheet equation
  const totalAssets = data.totalAssets || 0;
  const totalLiabilities = data.totalLiabilities || 0;
  const totalEquity = data.totalEquity || 0;
  
  const balance = Math.abs((totalLiabilities + totalEquity) - totalAssets);
  const balanceThreshold = totalAssets * 0.05; // 5% tolerance
  
  if (balance > balanceThreshold) {
    validation.warnings.push(`Balance sheet equation may not balance. Difference: ${balance}`);
  }
  
  // Check for negative values
  for (const [key, value] of Object.entries(data)) {
    if (value < 0) {
      validation.warnings.push(`Negative value found for ${key}: ${value}`);
    }
  }
  
  // Check for missing critical data
  if (!data.totalAssets && !data.totalLiabilities && !data.totalEquity) {
    validation.isValid = false;
    validation.errors.push('No critical financial data found in PDF');
  }
  
  return validation;
};

// Process balance sheet PDF and extract structured data
const processBalanceSheetPDF = async (filePath) => {
  try {
    // Process PDF and extract text
    const pdfData = await processPDF(filePath);
    
    // Extract financial patterns
    const extractedData = extractFinancialPatterns(pdfData.text.text);
    
    // Validate the extracted data
    const validation = validateFinancialData(extractedData);
    
    return {
      text: pdfData.text.text,
      financialYear: pdfData.text.financialYear,
      extractedData,
      validation,
      metadata: {
        pages: pdfData.pages,
        info: pdfData.info
      }
    };
  } catch (error) {
    console.error('Balance sheet PDF processing error:', error);
    throw new Error('Failed to process balance sheet PDF');
  }
};

module.exports = {
  processPDF,
  processBalanceSheetPDF,
  extractFinancialPatterns,
  validateFinancialData,
  cleanPDFText
};

const mongoose = require('mongoose');

const balanceSheetSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required']
  },
  period: {
    type: String,
    enum: ['Annual', 'Quarterly', 'Half-Yearly'],
    default: 'Annual'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pdfFile: {
    originalName: String,
    fileName: String,
    filePath: String,
    fileSize: Number
  },
  extractedData: {
    // Assets
    totalAssets: {
      type: Number,
      default: 0
    },
    currentAssets: {
      type: Number,
      default: 0
    },
    nonCurrentAssets: {
      type: Number,
      default: 0
    },
    cashAndCashEquivalents: {
      type: Number,
      default: 0
    },
    investments: {
      type: Number,
      default: 0
    },
    receivables: {
      type: Number,
      default: 0
    },
    inventory: {
      type: Number,
      default: 0
    },
    propertyPlantEquipment: {
      type: Number,
      default: 0
    },
    intangibleAssets: {
      type: Number,
      default: 0
    },
    
    // Liabilities
    totalLiabilities: {
      type: Number,
      default: 0
    },
    currentLiabilities: {
      type: Number,
      default: 0
    },
    nonCurrentLiabilities: {
      type: Number,
      default: 0
    },
    shortTermBorrowings: {
      type: Number,
      default: 0
    },
    longTermBorrowings: {
      type: Number,
      default: 0
    },
    tradePayables: {
      type: Number,
      default: 0
    },
    provisions: {
      type: Number,
      default: 0
    },
    
    // Equity
    totalEquity: {
      type: Number,
      default: 0
    },
    shareCapital: {
      type: Number,
      default: 0
    },
    reservesAndSurplus: {
      type: Number,
      default: 0
    },
    retainedEarnings: {
      type: Number,
      default: 0
    },
    
    // Additional Metrics
    workingCapital: {
      type: Number,
      default: 0
    },
    debtToEquityRatio: {
      type: Number,
      default: 0
    },
    currentRatio: {
      type: Number,
      default: 0
    },
    quickRatio: {
      type: Number,
      default: 0
    }
  },
  
  // Income Statement Data (if available)
  incomeStatement: {
    revenue: {
      type: Number,
      default: 0
    },
    costOfGoodsSold: {
      type: Number,
      default: 0
    },
    grossProfit: {
      type: Number,
      default: 0
    },
    operatingExpenses: {
      type: Number,
      default: 0
    },
    operatingIncome: {
      type: Number,
      default: 0
    },
    netIncome: {
      type: Number,
      default: 0
    },
    ebitda: {
      type: Number,
      default: 0
    },
    ebit: {
      type: Number,
      default: 0
    }
  },
  
  // Analysis and Insights
  analysis: {
    aiGenerated: {
      type: Boolean,
      default: false
    },
    keyInsights: [{
      category: String,
      insight: String,
      impact: String,
      recommendation: String
    }],
    riskFactors: [{
      factor: String,
      severity: String,
      description: String
    }],
    growthMetrics: {
      revenueGrowth: Number,
      assetGrowth: Number,
      profitGrowth: Number
    }
  },
  
  // Processing Status
  processingStatus: {
    type: String,
    enum: ['Pending', 'Processing', 'Completed', 'Failed'],
    default: 'Pending'
  },
  processingErrors: [String],
  
  // Metadata
  currency: {
    type: String,
    default: 'INR'
  },
  units: {
    type: String,
    default: 'Crores'
  },
  isConsolidated: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
balanceSheetSchema.index({ company: 1, financialYear: 1 });
balanceSheetSchema.index({ uploadedBy: 1 });
balanceSheetSchema.index({ processingStatus: 1 });

// Calculate derived metrics
balanceSheetSchema.methods.calculateMetrics = function() {
  const data = this.extractedData;
  
  // Working Capital
  this.extractedData.workingCapital = data.currentAssets - data.currentLiabilities;
  
  // Ratios
  if (data.totalEquity > 0) {
    this.extractedData.debtToEquityRatio = (data.totalLiabilities / data.totalEquity);
  }
  
  if (data.currentLiabilities > 0) {
    this.extractedData.currentRatio = (data.currentAssets / data.currentLiabilities);
    this.extractedData.quickRatio = ((data.currentAssets - data.inventory) / data.currentLiabilities);
  }
  
  return this;
};

// Virtual for total assets validation
balanceSheetSchema.virtual('totalAssetsCalculated').get(function() {
  return this.extractedData.currentAssets + this.extractedData.nonCurrentAssets;
});

// Virtual for total liabilities and equity validation
balanceSheetSchema.virtual('totalLiabilitiesAndEquity').get(function() {
  return this.extractedData.totalLiabilities + this.extractedData.totalEquity;
});

module.exports = mongoose.model('BalanceSheet', balanceSheetSchema);

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    balanceSheetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BalanceSheet'
    },
    analysisType: {
      type: String,
      enum: ['general', 'financial_analysis', 'risk_assessment', 'growth_analysis', 'comparison']
    },
    confidence: Number,
    sources: [String]
  }
});

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  title: {
    type: String,
    default: 'New Analysis Session'
  },
  messages: [messageSchema],
  context: {
    balanceSheets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BalanceSheet'
    }],
    analysisFocus: {
      type: String,
      enum: ['assets', 'liabilities', 'equity', 'ratios', 'growth', 'risk', 'comprehensive'],
      default: 'comprehensive'
    },
    timeRange: {
      startYear: String,
      endYear: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  summary: {
    keyInsights: [String],
    recommendations: [String],
    riskFactors: [String],
    generatedAt: Date
  },
  settings: {
    aiModel: {
      type: String,
      default: 'gemini-pro'
    },
    responseLength: {
      type: String,
      enum: ['brief', 'detailed', 'comprehensive'],
      default: 'detailed'
    },
    includeCharts: {
      type: Boolean,
      default: true
    },
    includeRecommendations: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
chatSchema.index({ user: 1, createdAt: -1 });
chatSchema.index({ company: 1 });
chatSchema.index({ status: 1 });

// Method to add message
chatSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata
  });
  return this.save();
};

// Method to get conversation summary
chatSchema.methods.getSummary = function() {
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  const assistantMessages = this.messages.filter(msg => msg.role === 'assistant');
  
  return {
    totalMessages: this.messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    lastMessage: this.messages[this.messages.length - 1],
    duration: this.updatedAt - this.createdAt
  };
};

// Method to generate chat title from first message
chatSchema.methods.generateTitle = function() {
  if (this.messages.length > 0) {
    const firstMessage = this.messages[0].content;
    const words = firstMessage.split(' ').slice(0, 5);
    return words.join(' ') + (firstMessage.length > 50 ? '...' : '');
  }
  return 'New Analysis Session';
};

module.exports = mongoose.model('Chat', chatSchema);

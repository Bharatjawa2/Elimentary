const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['Parent', 'Subsidiary', 'Division'],
    default: 'Subsidiary'
  },
  parentCompany: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null
  },
  subsidiaries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  }],
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  financialYear: {
    type: String,
    default: 'March'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  metadata: {
    foundedYear: Number,
    employeeCount: Number,
    revenue: Number,
    marketCap: Number
  }
}, {
  timestamps: true
});

// Index for better query performance
companySchema.index({ name: 1 });
companySchema.index({ parentCompany: 1 });
companySchema.index({ type: 1 });

// Virtual for full company hierarchy path
companySchema.virtual('hierarchyPath').get(function() {
  return this.name;
});

// Method to get all subsidiaries recursively
companySchema.methods.getAllSubsidiaries = async function() {
  const subsidiaries = [];
  
  const getSubsidiaries = async (companyId) => {
    const company = await this.constructor.findById(companyId).populate('subsidiaries');
    if (company && company.subsidiaries.length > 0) {
      for (const subsidiary of company.subsidiaries) {
        subsidiaries.push(subsidiary);
        await getSubsidiaries(subsidiary._id);
      }
    }
  };
  
  await getSubsidiaries(this._id);
  return subsidiaries;
};

// Method to get company hierarchy tree
companySchema.methods.getHierarchyTree = async function() {
  const tree = {
    _id: this._id,
    name: this.name,
    type: this.type,
    subsidiaries: []
  };
  
  if (this.subsidiaries.length > 0) {
    for (const subsidiaryId of this.subsidiaries) {
      const subsidiary = await this.constructor.findById(subsidiaryId);
      if (subsidiary) {
        const subsidiaryTree = await subsidiary.getHierarchyTree();
        tree.subsidiaries.push(subsidiaryTree);
      }
    }
  }
  
  return tree;
};

module.exports = mongoose.model('Company', companySchema);

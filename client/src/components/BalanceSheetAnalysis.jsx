import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  DollarSign,
  PieChart as PieChartIcon,
  Activity,
  Target,
  Shield,
  Lightbulb,
  Award,
  TrendingDown,
  Clock,
  Zap,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  Target as TargetIcon,
  Users,
  Globe
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { balanceSheetsAPI, analysisAPI } from '../services/api';

const BalanceSheetAnalysis = ({ balanceSheet, onClose }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [financialRatios, setFinancialRatios] = useState({});
  const [charts, setCharts] = useState([]);
  const [advancedMetrics, setAdvancedMetrics] = useState({});
  const [industryBenchmark, setIndustryBenchmark] = useState({});

  useEffect(() => {
    if (balanceSheet) {
      loadAnalysis();
      calculateFinancialRatios();
      generateCharts();
      calculateAdvancedMetrics();
    }
  }, [balanceSheet]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      
      // Get detailed analysis from the balance sheet
      const response = await balanceSheetsAPI.getById(balanceSheet._id);
      const sheetData = response.data.balanceSheet;
      
      if (sheetData.analysis) {
        setAnalysis(sheetData.analysis);
        if (sheetData.analysis.advancedMetrics) {
          setAdvancedMetrics(sheetData.analysis.advancedMetrics);
        }
        if (sheetData.analysis.industryBenchmark) {
          setIndustryBenchmark(sheetData.analysis.industryBenchmark);
        }
      }
      
    } catch (error) {
      console.error('Error loading analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateFinancialRatios = () => {
    if (!balanceSheet.extractedData) return;

    const data = balanceSheet.extractedData;
    
    const ratios = {
      // Liquidity Ratios
      currentRatio: data.currentAssets / (data.currentLiabilities || 1),
      quickRatio: (data.currentAssets - (data.inventory || 0)) / (data.currentLiabilities || 1),
      cashRatio: (data.cashAndEquivalents || 0) / (data.currentLiabilities || 1),
      
      // Solvency Ratios
      debtToEquity: (data.totalLiabilities || 0) / (data.totalEquity || 1),
      debtToAssets: (data.totalLiabilities || 0) / (data.totalAssets || 1),
      equityRatio: (data.totalEquity || 0) / (data.totalAssets || 1),
      
      // Efficiency Ratios
      assetTurnover: (data.revenue || 0) / (data.totalAssets || 1),
      inventoryTurnover: (data.costOfGoodsSold || 0) / (data.inventory || 1),
      
      // Profitability Ratios
      returnOnAssets: (data.netProfit || 0) / (data.totalAssets || 1),
      returnOnEquity: (data.netProfit || 0) / (data.totalEquity || 1),
      grossMargin: (data.grossProfit || 0) / (data.revenue || 1),
      netMargin: (data.netProfit || 0) / (data.revenue || 1)
    };

    setFinancialRatios(ratios);
  };

  const calculateAdvancedMetrics = () => {
    if (!balanceSheet.extractedData) return;

    const data = balanceSheet.extractedData;
    
    const metrics = {
      // Working Capital Metrics
      workingCapital: (data.currentAssets || 0) - (data.currentLiabilities || 0),
      workingCapitalRatio: ((data.currentAssets || 0) - (data.currentLiabilities || 0)) / (data.totalAssets || 1),
      
      // Cash Flow Metrics
      cashConversionCycle: calculateCashConversionCycle(data),
      
      // Days Metrics
      daysSalesOutstanding: (data.receivables || 0) / (data.revenue || 1) * 365,
      daysInventoryOutstanding: (data.inventory || 0) / (data.costOfGoodsSold || 1) * 365,
      daysPayablesOutstanding: (data.tradePayables || 0) / (data.costOfGoodsSold || 1) * 365,
      
      // Additional Efficiency Metrics
      fixedAssetTurnover: (data.revenue || 0) / (data.propertyPlantEquipment || 1),
      receivablesTurnover: (data.revenue || 0) / (data.receivables || 1)
    };

    setAdvancedMetrics(metrics);
  };

  const calculateCashConversionCycle = (data) => {
    const dso = (data.receivables || 0) / (data.revenue || 1) * 365;
    const dio = (data.inventory || 0) / (data.costOfGoodsSold || 1) * 365;
    const dpo = (data.tradePayables || 0) / (data.costOfGoodsSold || 1) * 365;
    
    return dso + dio - dpo;
  };

  const generateCharts = () => {
    if (!balanceSheet.extractedData) return;

    const data = balanceSheet.extractedData;
    const charts = [];

    // Asset Composition Chart
    if (data.totalAssets) {
      const assetData = [
        { name: 'Current Assets', value: data.currentAssets || 0 },
        { name: 'Fixed Assets', value: (data.totalAssets - (data.currentAssets || 0)) },
        { name: 'Intangible Assets', value: data.intangibleAssets || 0 }
      ].filter(item => item.value > 0);

      if (assetData.length > 0) {
        charts.push({
          id: 'asset-composition',
          title: 'Asset Composition',
          type: 'pie',
          data: assetData
        });
      }
    }

    // Liability Structure Chart
    if (data.totalLiabilities) {
      const liabilityData = [
        { name: 'Current Liabilities', value: data.currentLiabilities || 0 },
        { name: 'Long-term Liabilities', value: (data.totalLiabilities - (data.currentLiabilities || 0)) }
      ].filter(item => item.value > 0);

      if (liabilityData.length > 0) {
        charts.push({
          id: 'liability-structure',
          title: 'Liability Structure',
          type: 'pie',
          data: liabilityData
        });
      }
    }

    // Financial Position Chart
    const positionData = [
      { name: 'Assets', value: data.totalAssets || 0 },
      { name: 'Liabilities', value: data.totalLiabilities || 0 },
      { name: 'Equity', value: data.totalEquity || 0 }
    ].filter(item => item.value > 0);

    if (positionData.length > 0) {
      charts.push({
        id: 'financial-position',
        title: 'Financial Position',
        type: 'bar',
        data: positionData
      });
    }

    // Advanced Metrics Radar Chart
    if (Object.keys(advancedMetrics).length > 0) {
      const radarData = [
        { metric: 'Current Ratio', value: financialRatios.currentRatio || 0, fullMark: 3 },
        { metric: 'Debt/Equity', value: financialRatios.debtToEquity || 0, fullMark: 1 },
        { metric: 'ROA', value: financialRatios.returnOnAssets || 0, fullMark: 0.15 },
        { metric: 'ROE', value: financialRatios.returnOnEquity || 0, fullMark: 0.25 },
        { metric: 'Asset Turnover', value: financialRatios.assetTurnover || 0, fullMark: 2 },
        { metric: 'Net Margin', value: financialRatios.netMargin || 0, fullMark: 0.2 }
      ];

      charts.push({
        id: 'financial-performance',
        title: 'Financial Performance Radar',
        type: 'radar',
        data: radarData
      });
    }

    setCharts(charts);
  };

  const renderChart = (chart) => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    switch (chart.type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chart.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'radar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chart.data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
              <Radar name="Performance" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  const getRatioStatus = (ratio, thresholds) => {
    if (ratio >= thresholds.good) return 'good';
    if (ratio >= thresholds.warning) return 'warning';
    return 'poor';
  };

  const getRatioColor = (status) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getBenchmarkStatus = (company, industry) => {
    if (company > industry) return 'Above Industry';
    if (company < industry) return 'Below Industry';
    return 'Industry Average';
  };

  const getBenchmarkColor = (status) => {
    switch (status) {
      case 'Above Industry': return 'text-green-600';
      case 'Below Industry': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-center text-gray-600">Analyzing balance sheet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Advanced Balance Sheet Analysis</h2>
              <p className="text-gray-600">
                {balanceSheet.company?.name} - {balanceSheet.financialYear} {balanceSheet.period}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-4 border-b">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'ratios', name: 'Financial Ratios', icon: TrendingUp },
              { id: 'advanced', name: 'Advanced Metrics', icon: Zap },
              { id: 'benchmark', name: 'Industry Benchmark', icon: Award },
              { id: 'charts', name: 'Charts', icon: BarChartIcon },
              { id: 'insights', name: 'AI Insights', icon: Lightbulb },
              { id: 'risks', name: 'Risk Analysis', icon: AlertTriangle }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">Total Assets</p>
                      <p className="text-2xl font-bold text-blue-900">
                        ₹{(balanceSheet.extractedData?.totalAssets || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-600">Total Liabilities</p>
                      <p className="text-2xl font-bold text-red-900">
                        ₹{(balanceSheet.extractedData?.totalLiabilities || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600">Total Equity</p>
                      <p className="text-2xl font-bold text-green-900">
                        ₹{(balanceSheet.extractedData?.totalEquity || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600">Working Capital</p>
                      <p className="text-2xl font-bold text-purple-900">
                        ₹{((balanceSheet.extractedData?.currentAssets || 0) - 
                           (balanceSheet.extractedData?.currentLiabilities || 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Health Score */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Health Score</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-gray-600">Overall Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">A+</div>
                    <div className="text-sm text-gray-600">Credit Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">Low</div>
                    <div className="text-sm text-gray-600">Risk Profile</div>
                  </div>
                </div>
              </div>

              {/* Processing Status */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Processing Status</h3>
                <div className="flex items-center">
                  {balanceSheet.processingStatus === 'Completed' ? (
                    <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
                  ) : (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-3"></div>
                  )}
                  <span className="text-sm text-gray-600">
                    {balanceSheet.processingStatus === 'Completed' 
                      ? 'Analysis completed successfully' 
                      : 'Processing balance sheet data...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ratios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Liquidity Ratios */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Liquidity Ratios</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Current Ratio</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.currentRatio, { good: 2, warning: 1.5 }))}`}>
                        {financialRatios.currentRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Quick Ratio</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.quickRatio, { good: 1, warning: 0.8 }))}`}>
                        {financialRatios.quickRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash Ratio</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.cashRatio, { good: 0.5, warning: 0.2 }))}`}>
                        {financialRatios.cashRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Solvency Ratios */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Solvency Ratios</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Debt-to-Equity</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.debtToEquity, { good: 0.5, warning: 1 }))}`}>
                        {financialRatios.debtToEquity?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Debt-to-Assets</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.debtToAssets, { good: 0.4, warning: 0.6 }))}`}>
                        {financialRatios.debtToAssets?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Equity Ratio</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.equityRatio, { good: 0.6, warning: 0.4 }))}`}>
                        {financialRatios.equityRatio?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Profitability Ratios */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Profitability Ratios</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ROA</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.returnOnAssets, { good: 0.1, warning: 0.05 }))}`}>
                        {(financialRatios.returnOnAssets * 100)?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ROE</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.returnOnEquity, { good: 0.15, warning: 0.1 }))}`}>
                        {(financialRatios.returnOnEquity * 100)?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Net Margin</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.netMargin, { good: 0.15, warning: 0.1 }))}`}>
                        {(financialRatios.netMargin * 100)?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Efficiency Ratios */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Efficiency Ratios</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asset Turnover</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.assetTurnover, { good: 1, warning: 0.5 }))}`}>
                        {financialRatios.assetTurnover?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Inventory Turnover</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.inventoryTurnover, { good: 5, warning: 3 }))}`}>
                        {financialRatios.inventoryTurnover?.toFixed(2) || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Working Capital</span>
                      <span className={`font-medium ${getRatioColor(getRatioStatus(financialRatios.workingCapital, { good: 0.2, warning: 0.1 }))}`}>
                        ₹{(financialRatios.workingCapital || 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Working Capital Metrics */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Working Capital Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Working Capital</span>
                      <span className="font-medium text-gray-900">
                        ₹{(advancedMetrics.workingCapital || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Working Capital Ratio</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.workingCapitalRatio * 100)?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash Conversion Cycle</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.cashConversionCycle || 0).toFixed(0)} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Days Metrics */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Days Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days Sales Outstanding</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.daysSalesOutstanding || 0).toFixed(0)} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days Inventory Outstanding</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.daysInventoryOutstanding || 0).toFixed(0)} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Days Payables Outstanding</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.daysPayablesOutstanding || 0).toFixed(0)} days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Efficiency Metrics */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Efficiency Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fixed Asset Turnover</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.fixedAssetTurnover || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Receivables Turnover</span>
                      <span className="font-medium text-gray-900">
                        {(advancedMetrics.receivablesTurnover || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Asset Utilization</span>
                      <span className="font-medium text-gray-900">
                        {(financialRatios.assetTurnover * 100)?.toFixed(2) || 'N/A'}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Cash Flow Metrics */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Cash Flow Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Operating Cash Flow</span>
                      <span className="font-medium text-gray-900">
                        ₹{(balanceSheet.extractedData?.netProfit || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Free Cash Flow</span>
                      <span className="font-medium text-gray-900">
                        ₹{((balanceSheet.extractedData?.netProfit || 0) - (balanceSheet.extractedData?.propertyPlantEquipment || 0)).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Cash Flow Ratio</span>
                      <span className="font-medium text-gray-900">
                        {((balanceSheet.extractedData?.netProfit || 0) / (balanceSheet.extractedData?.currentLiabilities || 1)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Industry Benchmark Comparison</h3>
                <div className="space-y-4">
                  {Object.entries(industryBenchmark).map(([metric, data]) => (
                    <div key={metric} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">{metric.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`font-medium ${getBenchmarkColor(data.status)}`}>
                          {data.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Company: {data.company?.toFixed(2)}</span>
                        <span>Industry: {data.industry?.toFixed(2)}</span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((data.company / data.industry) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'charts' && (
            <div className="space-y-6">
              {charts.map((chart) => (
                <div key={chart.id} className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{chart.title}</h3>
                  {renderChart(chart)}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {analysis?.keyInsights && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Lightbulb className="w-5 h-5 text-yellow-600 mr-2" />
                    Key Insights
                  </h3>
                  <ul className="space-y-2">
                    {analysis.keyInsights.map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-yellow-500 mr-2">•</span>
                        <span className="text-gray-700">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis?.recommendations && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 text-blue-600 mr-2" />
                    Strategic Recommendations
                  </h3>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'risks' && (
            <div className="space-y-6">
              {analysis?.riskFactors && (
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <Shield className="w-5 h-5 text-red-600 mr-2" />
                    Risk Factors
                  </h3>
                  <ul className="space-y-2">
                    {analysis.riskFactors.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-500 mr-2">•</span>
                        <span className="text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Assessment Summary */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Assessment Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {getRatioStatus(financialRatios.currentRatio, { good: 2, warning: 1.5 }) === 'poor' ? 'High' : 'Low'}
                    </div>
                    <div className="text-sm text-red-600">Liquidity Risk</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getRatioStatus(financialRatios.debtToEquity, { good: 0.5, warning: 1 }) === 'poor' ? 'High' : 'Low'}
                    </div>
                    <div className="text-sm text-yellow-600">Solvency Risk</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {getRatioStatus(financialRatios.returnOnAssets, { good: 0.1, warning: 0.05 }) === 'good' ? 'Good' : 'Poor'}
                    </div>
                    <div className="text-sm text-green-600">Performance</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {getRatioStatus(financialRatios.assetTurnover, { good: 1, warning: 0.5 }) === 'good' ? 'Good' : 'Poor'}
                    </div>
                    <div className="text-sm text-blue-600">Efficiency</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetAnalysis;

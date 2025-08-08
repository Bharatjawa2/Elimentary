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
  GitCompare,
  Download,
  Filter,
  X
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
  ComposedChart,
  Legend
} from 'recharts';
import { balanceSheetsAPI, analysisAPI } from '../services/api';

const BalanceSheetComparison = ({ balanceSheets, onClose }) => {
  const [selectedSheets, setSelectedSheets] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [charts, setCharts] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (balanceSheets.length >= 2) {
      setSelectedSheets(balanceSheets.slice(0, 2));
    }
  }, [balanceSheets]);

  useEffect(() => {
    if (selectedSheets.length >= 2) {
      generateComparisonData();
      generateComparisonCharts();
    }
  }, [selectedSheets]);

  const generateComparisonData = () => {
    if (selectedSheets.length < 2) return;

    const data = selectedSheets.map(sheet => ({
      year: sheet.financialYear,
      company: sheet.company?.name || 'Unknown',
      ...sheet.extractedData
    }));

    setComparisonData(data);
  };

  const generateComparisonCharts = () => {
    if (!comparisonData || comparisonData.length < 2) return;

    const charts = [];

    // Revenue Comparison Chart
    const revenueData = comparisonData.map(item => ({
      year: item.year,
      revenue: item.incomeStatement?.revenue || 0,
      profit: item.incomeStatement?.netProfit || 0,
      company: item.company
    }));

    if (revenueData.some(item => item.revenue > 0)) {
      charts.push({
        id: 'revenue-comparison',
        title: 'Revenue & Profit Comparison',
        type: 'bar',
        data: revenueData,
        keys: ['revenue', 'profit']
      });
    }

    // Balance Sheet Comparison
    const balanceData = comparisonData.map(item => ({
      year: item.year,
      assets: item.balanceSheet?.totalAssets || 0,
      liabilities: item.balanceSheet?.totalLiabilities || 0,
      equity: item.balanceSheet?.totalEquity || 0,
      company: item.company
    }));

    if (balanceData.some(item => item.assets > 0)) {
      charts.push({
        id: 'balance-comparison',
        title: 'Balance Sheet Comparison',
        type: 'composed',
        data: balanceData,
        keys: ['assets', 'liabilities', 'equity']
      });
    }

    // Financial Ratios Comparison
    const ratiosData = comparisonData.map(item => {
      const currentAssets = item.balanceSheet?.currentAssets || 0;
      const currentLiabilities = item.balanceSheet?.currentLiabilities || 1;
      const totalLiabilities = item.balanceSheet?.totalLiabilities || 0;
      const totalEquity = item.balanceSheet?.totalEquity || 1;

      return {
        year: item.year,
        currentRatio: currentAssets / currentLiabilities,
        debtToEquity: totalLiabilities / totalEquity,
        equityRatio: totalEquity / (item.balanceSheet?.totalAssets || 1),
        company: item.company
      };
    });

    charts.push({
      id: 'ratios-comparison',
      title: 'Financial Ratios Comparison',
      type: 'line',
      data: ratiosData,
      keys: ['currentRatio', 'debtToEquity', 'equityRatio']
    });

    // Asset Composition Comparison
    const assetCompositionData = comparisonData.map(item => {
      const totalAssets = item.balanceSheet?.totalAssets || 0;
      const currentAssets = item.balanceSheet?.currentAssets || 0;
      const fixedAssets = totalAssets - currentAssets;

      return {
        year: item.year,
        currentAssets: currentAssets,
        fixedAssets: fixedAssets,
        company: item.company
      };
    });

    charts.push({
      id: 'asset-composition',
      title: 'Asset Composition Comparison',
      type: 'area',
      data: assetCompositionData,
      keys: ['currentAssets', 'fixedAssets']
    });

    setCharts(charts);
  };

  const calculateGrowthRates = () => {
    if (!comparisonData || comparisonData.length < 2) return {};

    const sortedData = [...comparisonData].sort((a, b) => a.year - b.year);
    const growthRates = {};

    for (let i = 1; i < sortedData.length; i++) {
      const current = sortedData[i];
      const previous = sortedData[i - 1];

      growthRates.revenue = ((current.incomeStatement?.revenue || 0) - (previous.incomeStatement?.revenue || 0)) / (previous.incomeStatement?.revenue || 1) * 100;
      growthRates.assets = ((current.balanceSheet?.totalAssets || 0) - (previous.balanceSheet?.totalAssets || 0)) / (previous.balanceSheet?.totalAssets || 1) * 100;
      growthRates.equity = ((current.balanceSheet?.totalEquity || 0) - (previous.balanceSheet?.totalEquity || 0)) / (previous.balanceSheet?.totalEquity || 1) * 100;
    }

    return growthRates;
  };

  const renderChart = (chart) => {
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

    switch (chart.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chart.keys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="assets" fill="#3B82F6" />
              <Bar dataKey="liabilities" fill="#EF4444" />
              <Line type="monotone" dataKey="equity" stroke="#10B981" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chart.keys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={2} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              {chart.keys.map((key, index) => (
                <Area 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  fill={COLORS[index % COLORS.length]} 
                  stroke={COLORS[index % COLORS.length]}
                />
              ))}
            </AreaChart>
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

  const handleSheetSelection = (sheet) => {
    if (selectedSheets.find(s => s._id === sheet._id)) {
      setSelectedSheets(selectedSheets.filter(s => s._id !== sheet._id));
    } else if (selectedSheets.length < 4) {
      setSelectedSheets([...selectedSheets, sheet]);
    }
  };

  const generateComparisonReport = async () => {
    if (selectedSheets.length < 2) return;

    setLoading(true);
    try {
      const response = await analysisAPI.compare({
        balanceSheetIds: selectedSheets.map(s => s._id),
        analysisType: 'comprehensive'
      });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Error generating comparison report:', error);
    } finally {
      setLoading(false);
    }
  };

  const growthRates = calculateGrowthRates();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Balance Sheet Comparison</h2>
              <p className="text-gray-600">
                Compare multiple balance sheets for comprehensive analysis
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Sheet Selection */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Select Balance Sheets to Compare</h3>
            <span className="text-sm text-gray-500">
              {selectedSheets.length}/4 selected
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {balanceSheets.map((sheet) => (
              <button
                key={sheet._id}
                onClick={() => handleSheetSelection(sheet)}
                className={`p-3 rounded-lg border-2 text-left transition-colors ${
                  selectedSheets.find(s => s._id === sheet._id)
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{sheet.financialYear}</p>
                    <p className="text-sm text-gray-500">{sheet.company?.name}</p>
                  </div>
                  {selectedSheets.find(s => s._id === sheet._id) && (
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-4 border-b">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'charts', name: 'Charts', icon: PieChartIcon },
              { id: 'ratios', name: 'Financial Ratios', icon: TrendingUp },
              { id: 'growth', name: 'Growth Analysis', icon: Activity },
              { id: 'insights', name: 'AI Insights', icon: Lightbulb }
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
              {/* Growth Metrics */}
              {Object.keys(growthRates).length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-600">Revenue Growth</p>
                        <p className="text-2xl font-bold text-green-900">
                          {growthRates.revenue?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-600">Asset Growth</p>
                        <p className="text-2xl font-bold text-blue-900">
                          {growthRates.assets?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Target className="w-6 h-6 text-purple-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-purple-600">Equity Growth</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {growthRates.equity?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Sheets Summary */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Balance Sheets</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedSheets.map((sheet, index) => (
                    <div key={sheet._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {sheet.financialYear} - {sheet.company?.name}
                        </h4>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Assets:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalAssets || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Liabilities:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalLiabilities || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Equity:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalEquity || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate AI Analysis Button */}
              <div className="text-center">
                <button
                  onClick={generateComparisonReport}
                  disabled={loading || selectedSheets.length < 2}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center mx-auto"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Generating Analysis...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="w-5 h-5 mr-2" />
                      Generate AI Analysis
                    </>
                  )}
                </button>
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

          {activeTab === 'ratios' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Current Ratio Comparison */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Current Ratio Comparison</h3>
                  <div className="space-y-3">
                    {comparisonData?.map((item, index) => {
                      const currentRatio = (item.balanceSheet?.currentAssets || 0) / (item.balanceSheet?.currentLiabilities || 1);
                      const status = getRatioStatus(currentRatio, { good: 2, warning: 1.5 });
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.year}</span>
                          <span className={`font-medium ${getRatioColor(status)}`}>
                            {currentRatio.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Debt-to-Equity Comparison */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Debt-to-Equity Comparison</h3>
                  <div className="space-y-3">
                    {comparisonData?.map((item, index) => {
                      const debtToEquity = (item.balanceSheet?.totalLiabilities || 0) / (item.balanceSheet?.totalEquity || 1);
                      const status = getRatioStatus(debtToEquity, { good: 0.5, warning: 1 });
                      return (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">{item.year}</span>
                          <span className={`font-medium ${getRatioColor(status)}`}>
                            {debtToEquity.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'growth' && (
            <div className="space-y-6">
              {/* Growth Trends */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Growth Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {growthRates.revenue?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-green-600">Revenue Growth</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {growthRates.assets?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-blue-600">Asset Growth</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {growthRates.equity?.toFixed(1)}%
                    </div>
                    <div className="text-sm text-purple-600">Equity Growth</div>
                  </div>
                </div>
              </div>

              {/* Year-over-Year Analysis */}
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Year-over-Year Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Metric</th>
                        {comparisonData?.map((item, index) => (
                          <th key={index} className="text-right py-2">{item.year}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Total Assets</td>
                        {comparisonData?.map((item, index) => (
                          <td key={index} className="text-right py-2">
                            ₹{(item.balanceSheet?.totalAssets || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="py-2 font-medium">Total Liabilities</td>
                        {comparisonData?.map((item, index) => (
                          <td key={index} className="text-right py-2">
                            ₹{(item.balanceSheet?.totalLiabilities || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr>
                        <td className="py-2 font-medium">Total Equity</td>
                        {comparisonData?.map((item, index) => (
                          <td key={index} className="text-right py-2">
                            ₹{(item.balanceSheet?.totalEquity || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              {analysis ? (
                <>
                  {analysis.keyInsights && (
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

                  {analysis.recommendations && (
                    <div className="bg-white p-6 rounded-lg shadow">
                      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                        <Target className="w-5 h-5 text-blue-600 mr-2" />
                        Recommendations
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

                  {analysis.riskFactors && (
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
                </>
              ) : (
                <div className="text-center py-12">
                  <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Analysis Generated</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Click "Generate AI Analysis" to get insights about the selected balance sheets.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BalanceSheetComparison;

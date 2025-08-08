import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Upload, 
  MessageSquare, 
  FileText, 
  TrendingUp, 
  Users, 
  Settings, 
  LogOut,
  Plus,
  Send,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  RefreshCw,
  GitCompare
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { balanceSheetsAPI, chatAPI, companiesAPI } from '../services/api';
import BalanceSheetAnalysis from './BalanceSheetAnalysis';
import BalanceSheetComparison from './BalanceSheetComparison';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [companies, setCompanies] = useState([]);
  const [balanceSheets, setBalanceSheets] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [currentChat, setCurrentChat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [financialCharts, setFinancialCharts] = useState([]);
  const [processingBalanceSheet, setProcessingBalanceSheet] = useState(null);
  const [selectedBalanceSheet, setSelectedBalanceSheet] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (balanceSheets.length > 0) {
      generateFinancialCharts();
    }
  }, [balanceSheets]);

  useEffect(() => {
    if (balanceSheets.length > 0) {
      generateFinancialCharts();
    }
  }, [balanceSheets]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load companies
      const companiesResponse = await companiesAPI.getAll();
      setCompanies(companiesResponse.data.companies || []);
      
      if (companiesResponse.data.companies?.length > 0) {
        setSelectedCompany(companiesResponse.data.companies[0]);
        await loadBalanceSheets(companiesResponse.data.companies[0]._id);
      }
      
      // Load chats
      const chatsResponse = await chatAPI.getAll();
      setChats(chatsResponse.data.chats || []);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalanceSheets = async (companyId) => {
    try {
      const response = await balanceSheetsAPI.getByCompany(companyId);
      setBalanceSheets(response.data.balanceSheets || []);
    } catch (error) {
      console.error('Error loading balance sheets:', error);
    }
  };

  const generateFinancialCharts = () => {
    const charts = [];
    
    // Generate revenue trend chart
    if (balanceSheets.length > 0) {
      const revenueData = balanceSheets
        .filter(bs => bs.extractedData?.incomeStatement?.revenue)
        .map(bs => ({
          year: bs.financialYear,
          revenue: bs.extractedData.incomeStatement.revenue,
          profit: bs.extractedData.incomeStatement.netProfit || 0,
          assets: bs.extractedData.balanceSheet?.totalAssets || 0,
          liabilities: bs.extractedData.balanceSheet?.totalLiabilities || 0
        }))
        .sort((a, b) => a.year - b.year);

      if (revenueData.length > 0) {
        charts.push({
          id: 'revenue-trend',
          title: 'Revenue & Profit Trend',
          type: 'line',
          data: revenueData,
          keys: ['revenue', 'profit']
        });
      }

      // Generate balance sheet chart
      const balanceData = balanceSheets
        .filter(bs => bs.extractedData?.balanceSheet)
        .map(bs => ({
          year: bs.financialYear,
          assets: bs.extractedData.balanceSheet.totalAssets || 0,
          liabilities: bs.extractedData.balanceSheet.totalLiabilities || 0,
          equity: bs.extractedData.balanceSheet.totalEquity || 0
        }))
        .sort((a, b) => a.year - b.year);

      if (balanceData.length > 0) {
        charts.push({
          id: 'balance-sheet',
          title: 'Balance Sheet Overview',
          type: 'bar',
          data: balanceData,
          keys: ['assets', 'liabilities', 'equity']
        });
      }

      // Generate financial ratios pie chart
      const latestSheet = balanceSheets[0];
      if (latestSheet?.extractedData?.balanceSheet) {
        const totalAssets = latestSheet.extractedData.balanceSheet.totalAssets || 0;
        const currentAssets = latestSheet.extractedData.balanceSheet.currentAssets || 0;
        const fixedAssets = totalAssets - currentAssets;
        
        charts.push({
          id: 'asset-composition',
          title: 'Asset Composition',
          type: 'pie',
          data: [
            { name: 'Current Assets', value: currentAssets },
            { name: 'Fixed Assets', value: fixedAssets }
          ]
        });
      }
    }

    setFinancialCharts(charts);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedCompany) {
      console.log('No file or company selected');
      console.log('File:', file);
      console.log('Selected company:', selectedCompany);
      return;
    }

    console.log('Uploading file:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);
    console.log('For company:', selectedCompany._id);

    setUploading(true);
    setProcessingBalanceSheet(null);
    
    try {
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('User not authenticated. Please login again.');
      }

      const formData = new FormData();
      formData.append('pdfFile', file);
      formData.append('companyId', selectedCompany._id);
      formData.append('financialYear', new Date().getFullYear().toString());
      formData.append('period', 'Annual');

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      console.log('Sending upload request...');
      const response = await balanceSheetsAPI.upload(formData);
      console.log('Upload response:', response);
      
      if (response.success) {
        setProcessingBalanceSheet(response.data.balanceSheet);
        
        // Poll for processing completion
        await pollProcessingStatus(response.data.balanceSheet.id);
        
        await loadBalanceSheets(selectedCompany._id);
        alert('Balance sheet uploaded and analyzed successfully!');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
      setProcessingBalanceSheet(null);
    }
  };

  const pollProcessingStatus = async (balanceSheetId) => {
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max
    
    while (attempts < maxAttempts) {
      try {
        const response = await balanceSheetsAPI.getById(balanceSheetId);
        if (response.data.balanceSheet.processingStatus === 'Completed') {
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;
      } catch (error) {
        console.error('Polling error:', error);
        break;
      }
    }
  };

  const createNewChat = async () => {
    if (!selectedCompany) return;

    console.log('Creating new chat for company:', selectedCompany._id);
    console.log('Available balance sheets:', balanceSheets.map(bs => bs._id));

    try {
      const response = await chatAPI.create({
        companyId: selectedCompany._id,
        title: 'New Analysis Session',
        balanceSheetIds: balanceSheets.map(bs => bs._id)
      });

      console.log('Chat creation response:', response);
      const newChat = response.data.chat;
      setChats([newChat, ...chats]);
      setCurrentChat(newChat);
      setActiveTab('chat');
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat: ' + error.message);
    }
  };

  const sendMessage = async () => {
    if (!chatMessage.trim() || !currentChat) return;

    const messageToSend = chatMessage;
    setChatMessage('');

    console.log('Sending message:', messageToSend);
    console.log('Current chat:', currentChat);

    try {
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: messageToSend,
        timestamp: new Date()
      };

      setCurrentChat(prev => ({
        ...prev,
        messages: [...(prev.messages || []), userMessage]
      }));

      console.log('Calling chatAPI.sendMessage with:', currentChat.id, messageToSend);
      const response = await chatAPI.sendMessage(currentChat.id, messageToSend);
      console.log('Chat API response:', response);
      
      // Update chat with AI response
      if (response.data && response.data.aiResponse) {
        setCurrentChat(prev => ({
          ...prev,
          messages: [...(prev.messages || []), response.data.aiResponse]
        }));
      } else {
        // Handle case where response structure is different
        const aiResponse = {
          role: 'assistant',
          content: response.message || 'AI response received',
          timestamp: new Date()
        };
        setCurrentChat(prev => ({
          ...prev,
          messages: [...(prev.messages || []), aiResponse]
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
      
      // Remove the user message if sending failed
      setCurrentChat(prev => ({
        ...prev,
        messages: prev.messages?.slice(0, -1) || []
      }));
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const getFinancialData = () => {
    // Use real data from balance sheets if available
    if (balanceSheets.length > 0) {
      return balanceSheets
        .filter(bs => bs.extractedData?.incomeStatement?.revenue)
        .map(bs => ({
          name: bs.financialYear,
          revenue: bs.extractedData.incomeStatement.revenue,
          assets: bs.extractedData.balanceSheet?.totalAssets || 0,
          liabilities: bs.extractedData.balanceSheet?.totalLiabilities || 0,
        }))
        .sort((a, b) => a.name - b.name);
    }

    // Fallback to mock data
    return [
      { name: 'Jan', revenue: 4000, assets: 2400, liabilities: 2400 },
      { name: 'Feb', revenue: 3000, assets: 1398, liabilities: 2210 },
      { name: 'Mar', revenue: 2000, assets: 9800, liabilities: 2290 },
      { name: 'Apr', revenue: 2780, assets: 3908, liabilities: 2000 },
      { name: 'May', revenue: 1890, assets: 4800, liabilities: 2181 },
      { name: 'Jun', revenue: 2390, assets: 3800, liabilities: 2500 },
    ];
  };

  const getRoleBasedAccess = () => {
    switch (user?.role) {
      case 'Group Executive':
        return { canViewAll: true, canUpload: true, canAnalyze: true };
      case 'Company CEO':
        return { canViewAll: false, canUpload: true, canAnalyze: true };
      case 'Financial Analyst':
        return { canViewAll: false, canUpload: true, canAnalyze: true };
      default:
        return { canViewAll: false, canUpload: false, canAnalyze: false };
    }
  };

  const access = getRoleBasedAccess();

  const renderChart = (chart) => {
    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              {chart.keys.map((key, index) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={['#3B82F6', '#10B981', '#F59E0B'][index]} 
                  strokeWidth={2} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              {chart.keys.map((key, index) => (
                <Bar 
                  key={key}
                  dataKey={key} 
                  fill={['#3B82F6', '#10B981', '#F59E0B'][index]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
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
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <BarChart3 className="w-8 h-8 text-indigo-600 mr-2" />
              <span className="text-xl font-bold text-gray-900">FinanceAI</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.fullName}</span>
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <LogOut className="w-4 h-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'upload', name: 'Upload Data', icon: Upload },
              { id: 'chat', name: 'AI Assistant', icon: MessageSquare },
              { id: 'comparison', name: 'Compare Sheets', icon: GitCompare },
              { id: 'reports', name: 'Reports', icon: FileText },
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

        {/* Company Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Company
          </label>
          <select
            value={selectedCompany?._id || ''}
            onChange={(e) => {
              const company = companies.find(c => c._id === e.target.value);
              setSelectedCompany(company);
              if (company) loadBalanceSheets(company._id);
            }}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Balance Sheets</p>
                    <p className="text-2xl font-bold text-gray-900">{balanceSheets.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                    <p className="text-2xl font-bold text-gray-900">+12.5%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Users className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">AI Sessions</p>
                    <p className="text-2xl font-bold text-gray-900">{chats.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dynamic Financial Charts */}
            {financialCharts.length > 0 && (
              <div className="space-y-6">
                {financialCharts.map((chart) => (
                  <div key={chart.id} className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">{chart.title}</h3>
                    {renderChart(chart)}
                  </div>
                ))}
              </div>
            )}

            {/* Financial Performance Chart */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Performance</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getFinancialData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                  <Line type="monotone" dataKey="assets" stroke="#10B981" strokeWidth={2} />
                  <Line type="monotone" dataKey="liabilities" stroke="#F59E0B" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Balance Sheets */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Balance Sheets</h3>
              <div className="space-y-3">
                {balanceSheets.slice(0, 5).map((sheet) => (
                  <div key={sheet._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{sheet.financialYear} - {sheet.period}</p>
                        <p className="text-sm text-gray-500">Uploaded by {sheet.uploadedBy?.fullName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {sheet.processingStatus === 'Completed' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {sheet.processingStatus === 'Processing' && (
                        <Clock className="w-5 h-5 text-yellow-500" />
                      )}
                      <button 
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          setSelectedBalanceSheet(sheet);
                          setShowAnalysis(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Balance Sheet</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Upload PDF Balance Sheet
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    PDF files only, max 10MB
                  </span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={uploading}
                />
              </div>
              {uploading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Processing...</span>
                </div>
              )}
              {processingBalanceSheet && (
                <div className="mt-4 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  <span className="text-sm">Analysis completed!</span>
                </div>
              )}
              
              {/* Debug Test Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    console.log('Test button clicked');
                    console.log('Selected company:', selectedCompany);
                    console.log('User token:', localStorage.getItem('token'));
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Debug: Check Auth & Company
                </button>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Uploaded Balance Sheets</h4>
              <div className="space-y-2">
                {balanceSheets.map((sheet) => (
                  <div key={sheet._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{sheet.financialYear} - {sheet.period}</p>
                        <p className="text-sm text-gray-500">{sheet.pdfFile?.originalName}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        className="text-indigo-600 hover:text-indigo-800"
                        onClick={() => {
                          setSelectedBalanceSheet(sheet);
                          setShowAnalysis(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-800">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">AI Financial Assistant</h3>
                <button
                  onClick={createNewChat}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Chat
                </button>
              </div>
            </div>

            <div className="flex h-96">
              {/* Chat List */}
              <div className="w-1/3 border-r">
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Chat Sessions</h4>
                  <div className="space-y-2">
                    {chats.map((chat) => (
                      <button
                        key={chat._id}
                        onClick={() => setCurrentChat(chat)}
                        className={`w-full text-left p-3 rounded-lg ${
                          currentChat?._id === chat._id
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-medium text-sm">{chat.title}</p>
                        <p className="text-xs text-gray-500">{chat.company?.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                {currentChat ? (
                  <>
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        {currentChat.messages?.map((message, index) => (
                          <div
                            key={index}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              <p className="text-sm">{message.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 border-t">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          placeholder="Ask about financial analysis..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                        <button
                          onClick={sendMessage}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No chat selected</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start a new chat to begin analyzing balance sheets
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Balance Sheet Comparison</h3>
                <p className="text-gray-600">Compare multiple balance sheets for comprehensive analysis</p>
              </div>
              <button
                onClick={() => setShowComparison(true)}
                disabled={balanceSheets.length < 2}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare Sheets
              </button>
            </div>

            {balanceSheets.length < 2 ? (
              <div className="text-center py-12">
                <GitCompare className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Need Multiple Sheets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Upload at least 2 balance sheets to enable comparison analysis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {balanceSheets.map((sheet) => (
                    <div key={sheet._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{sheet.financialYear}</h4>
                        <span className="text-sm text-gray-500">{sheet.period}</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Assets:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalAssets || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Liabilities:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalLiabilities || 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Equity:</span>
                          <span className="font-medium">
                            ₹{(sheet.extractedData?.balanceSheet?.totalEquity || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Quick Reports</h4>
                  <div className="space-y-2">
                    <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Growth Analysis</p>
                          <p className="text-sm text-gray-500">Year-over-year performance</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center">
                        <BarChart3 className="w-5 h-5 text-blue-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Financial Ratios</p>
                          <p className="text-sm text-gray-500">Liquidity, solvency, profitability</p>
                        </div>
                      </div>
                    </button>
                    <button className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Risk Assessment</p>
                          <p className="text-sm text-gray-500">Financial risk analysis</p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">Recent Reports</h4>
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Q{i} 2024 Report</p>
                          <p className="text-sm text-gray-500">Generated 2 days ago</p>
                        </div>
                        <button className="text-indigo-600 hover:text-indigo-800">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Balance Sheet Analysis Modal */}
        {showAnalysis && selectedBalanceSheet && (
          <BalanceSheetAnalysis
            balanceSheet={selectedBalanceSheet}
            onClose={() => {
              setShowAnalysis(false);
              setSelectedBalanceSheet(null);
            }}
          />
        )}

        {/* Balance Sheet Comparison Modal */}
        {showComparison && (
          <BalanceSheetComparison
            balanceSheets={balanceSheets}
            onClose={() => setShowComparison(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;

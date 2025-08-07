import { Link } from 'react-router-dom';
import { BarChart3, Brain, FileText, TrendingUp, Shield, Users, BarChart } from 'lucide-react';

const LandingPage = () => {
  const features = [
    {
      icon: <Brain className="w-8 h-8 text-blue-600" />,
      title: "AI-Powered Q&A",
      description: "Ask questions in natural language and get intelligent responses about financial performance"
    },
    {
      icon: <FileText className="w-8 h-8 text-green-600" />,
      title: "PDF Processing",
      description: "Upload balance sheet PDFs and automatically extract key financial data"
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      title: "Historical Analysis",
      description: "Compare multiple years of data with interactive charts and trend analysis"
    },
    {
      icon: <Shield className="w-8 h-8 text-red-600" />,
      title: "Role-Based Access",
      description: "Secure access control for analysts, CEOs, and top management"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: "Multi-Company Support",
      description: "Manage multiple companies and subsidiaries with granular permissions"
    },
    {
      icon: <BarChart className="w-8 h-8 text-blue-700" />,
      title: "Interactive Charts",
      description: "Visualize financial data with beautiful, interactive charts and graphs"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-semibold text-gray-900">FinanceAI</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Balance Sheet Analysis
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your financial analysis with intelligent insights. Upload balance sheets, ask questions in natural language, and get instant AI-powered answers about company performance.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/signup"
              className="px-8 py-3 text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Start Analyzing
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 text-gray-900 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Powerful Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-center">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Companies Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">
            Supported Companies
          </h2>
          <div className="text-gray-500">
            {/* Placeholder for company logos */}
            <p>Coming soon...</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

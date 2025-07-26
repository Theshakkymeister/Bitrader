import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Star, Shield, Smartphone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-black">Bitrader</span>
          </div>
          <Button 
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full font-medium"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6">
        <div className="pt-16 pb-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-6xl font-bold text-black mb-6 leading-tight">
              Professional Trading
              <span className="text-blue-500 block">Made Simple</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of traders using our advanced AI algorithms for forex, crypto, stocks, and gold trading. 
              Start your journey to financial freedom today.
            </p>
            <Button 
              onClick={() => window.location.href = '/auth'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-full font-medium inline-flex items-center space-x-2 smooth-enter"
            >
              <span>Start Trading Free</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Phone Mockup */}
          <div className="mt-16 flex justify-center">
            <div className="relative">
              <div className="w-80 h-[600px] bg-black rounded-[3rem] p-3 shadow-2xl">
                <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
                  {/* App Interface Mockup */}
                  <div className="p-6">
                    {/* Status Bar */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-sm font-medium">9:41</span>
                      <div className="flex space-x-1">
                        <div className="w-4 h-2 bg-blue-500 rounded-sm"></div>
                        <div className="w-6 h-2 bg-gray-300 rounded-sm"></div>
                      </div>
                    </div>
                    
                    {/* Portfolio Value */}
                    <div className="mb-8">
                      <div className="text-sm text-gray-600 mb-1">Portfolio</div>
                      <div className="text-3xl font-bold text-black mb-2">$24,567.89</div>
                      <div className="text-blue-500 font-medium">+$432.10 (+1.79%) Today</div>
                    </div>

                    {/* Chart Visualization */}
                    <div className="h-32 bg-gray-50 rounded-lg mb-6 relative overflow-hidden">
                      <svg className="w-full h-full" viewBox="0 0 300 100">
                        <path 
                          d="M 0,70 Q 75,50 150,35 T 300,15" 
                          stroke="#3b82f6" 
                          strokeWidth="2" 
                          fill="none"
                        />
                        <defs>
                          <linearGradient id="mockupGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                          </linearGradient>
                        </defs>
                        <path 
                          d="M 0,70 Q 75,50 150,35 T 300,15 L 300,100 L 0,100 Z" 
                          fill="url(#mockupGradient)"
                        />
                      </svg>
                    </div>

                    {/* Holdings */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-blue-600">AAPL</span>
                          </div>
                          <span className="font-medium">Apple</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">$2,450</div>
                          <div className="text-xs text-blue-500">+1.2%</div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-orange-600">BTC</span>
                          </div>
                          <span className="font-medium">Bitcoin</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">$8,750</div>
                          <div className="text-xs text-blue-500">+3.5%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-20 border-t border-gray-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-4">Advanced Trading Technology</h2>
            <p className="text-xl text-gray-600">AI-powered algorithms that work 24/7 for maximum returns.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Secure Trading</h3>
              <p className="text-gray-600 leading-relaxed">
                Bank-level security with advanced encryption to protect your investments and trading data.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">AI-Powered Algorithms</h3>
              <p className="text-gray-600 leading-relaxed">
                Advanced trading algorithms that analyze markets 24/7 to maximize your trading returns.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Real-Time Analytics</h3>
              <p className="text-gray-600 leading-relaxed">
                Live market data and performance tracking across forex, crypto, stocks, and gold markets.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20 text-center">
          <div className="bg-gray-50 rounded-3xl p-16">
            <h2 className="text-4xl font-bold text-black mb-6">
              Ready to Start Trading?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join Bitrader today and take control of your financial future with our advanced trading algorithms.
            </p>
            <Button 
              onClick={() => window.location.href = '/api/login'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 text-lg rounded-full font-medium inline-flex items-center space-x-2"
            >
              <span>Create Your Account</span>
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-semibold text-black">Bitrader</span>
          </div>
          <p className="text-gray-600">
            AI-powered trading algorithms for the modern trader.
          </p>
        </div>
      </footer>
    </div>
  );
}
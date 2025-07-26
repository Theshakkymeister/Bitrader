import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Shield, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Bitrader
            </h1>
            <nav className="hidden md:flex space-x-6">
              <a href="#about" className="text-slate-400 hover:text-white transition-colors">About</a>
              <a href="#solutions" className="text-slate-400 hover:text-white transition-colors">Solutions</a>
              <a href="#success" className="text-slate-400 hover:text-white transition-colors">Success Stories</a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => window.location.href = '/api/login'}
            >
              Client Portal
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => window.location.href = '/api/login'}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Transform Your Trading Experience with{" "}
                <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                  Bitrader
                </span>
              </h1>
              <p className="text-xl text-slate-400 mb-4">
                Start your journey with smarter trading today!
              </p>
              <p className="text-slate-300 mb-8 leading-relaxed">
                By leveraging proprietary AI, Bitrader deciphers the signals that matter,
                delivering actionable insights directly into the hands of traders who demand the
                most from their strategies.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Get Started
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                  onClick={() => window.location.href = '/api/login'}
                >
                  Login
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="AI trading dashboard visualization" 
                className="rounded-2xl shadow-2xl opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">98%</div>
                <div className="text-slate-400">User Satisfaction Rate</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">50+</div>
                <div className="text-slate-400">Countries Global Reach</div>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">100+</div>
                <div className="text-slate-400">Successful Trades Daily</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400" 
                alt="AI trading algorithms visualization" 
                className="rounded-2xl shadow-xl opacity-90"
              />
            </div>
            <div>
              <h2 className="text-4xl font-bold mb-6">About Bitrader</h2>
              <p className="text-slate-300 mb-6 leading-relaxed">
                At Bitrader, it's about more than just following trends—it's about crafting
                them. Our team of data scientists and market experts works tirelessly to ensure
                that Bitrader remains at the bleeding edge, offering strategies that
                anticipate market movements before they happen.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-300">Innovation at Core</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-300">User-Friendly Experience</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <span className="text-slate-300">Reliable and Trustworthy</span>
                </li>
              </ul>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/api/login'}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-blue-900/50 to-slate-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Trading?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join thousands of successful traders who trust Bitrader's AI-powered algorithms
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
            onClick={() => window.location.href = '/api/login'}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
                Bitrader
              </h3>
              <p className="text-slate-400 text-sm">
                AI-powered trading algorithms for the modern investor.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Home</a></li>
                <li><a href="#about" className="text-slate-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#solutions" className="text-slate-400 hover:text-white transition-colors">Our Solutions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact Us</h4>
              <p className="text-slate-400 text-sm">
                <a href="mailto:support@bitrader.net" className="hover:text-white transition-colors">
                  support@bitrader.net
                </a>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Trading involves risk and is not suitable for all investors. 
                Past performance is not indicative of future results.
              </p>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <p className="text-slate-400 text-sm">
              © 2025 Bitrader – All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

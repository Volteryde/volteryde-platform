import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Code, Database, Server, Cloud, Zap } from 'lucide-react';

export function TechStackOverview() {
  return (
    <div className="space-y-6">
      {/* Backend Architecture */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Backend Architecture Strategy</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4 sm:mb-6">
          Volteryde uses a hybrid microservices architecture with Java and NestJS to leverage the strengths of both ecosystems.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Java Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Server className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h4 className="text-slate-900">Java (Spring Boot)</h4>
                <p className="text-slate-500 text-sm">Enterprise-grade security & payments</p>
              </div>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-orange-500">
              <div>
                <p className="text-slate-700 mb-2">Authentication & Authorization</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Spring Security</Badge>
                  <Badge variant="secondary" className="text-xs">OAuth2</Badge>
                  <Badge variant="secondary" className="text-xs">JWT</Badge>
                  <Badge variant="secondary" className="text-xs">RBAC</Badge>
                </div>
              </div>

              <div>
                <p className="text-slate-700 mb-2">Payment Services</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Paystack SDK</Badge>
                  <Badge variant="secondary" className="text-xs">Paystack API</Badge>
                  <Badge variant="secondary" className="text-xs">Wallet System</Badge>
                  <Badge variant="secondary" className="text-xs">PCI Compliance</Badge>
                </div>
              </div>

              <div className="bg-orange-50 p-3 rounded-lg mt-4">
                <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Why Java for Auth & Payments?</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• Mature security frameworks (Spring Security)</li>
                  <li>• Robust transaction management</li>
                  <li>• Enterprise-grade reliability</li>
                  <li>• Strong typing for financial operations</li>
                  <li>• Better compliance and audit trails</li>
                </ul>
              </div>
            </div>
          </div>

          {/* NestJS Services */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <Zap className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="text-slate-900">NestJS (TypeScript)</h4>
                <p className="text-slate-500 text-sm">Fast development & real-time features</p>
              </div>
            </div>

            <div className="space-y-3 pl-4 border-l-2 border-red-500">
              <div>
                <p className="text-slate-700 mb-2">Core Business Services</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Bus Booking</Badge>
                  <Badge variant="secondary" className="text-xs">Seat Substitution</Badge>
                  <Badge variant="secondary" className="text-xs">Fleet Management</Badge>
                  <Badge variant="secondary" className="text-xs">User Management</Badge>
                </div>
              </div>

              <div>
                <p className="text-slate-700 mb-2">Real-time Services</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-xs">Socket.io</Badge>
                  <Badge variant="secondary" className="text-xs">Live Tracking</Badge>
                  <Badge variant="secondary" className="text-xs">Notifications</Badge>
                  <Badge variant="secondary" className="text-xs">Chat</Badge>
                </div>
              </div>

              <div className="bg-red-50 p-3 rounded-lg mt-4">
                <p className="text-xs text-slate-600 text-sm sm:text-base mb-2">Why NestJS for Core Services?</p>
                <ul className="text-xs text-slate-700 space-y-1">
                  <li>• Faster development with TypeScript</li>
                  <li>• Excellent WebSocket support (Socket.io)</li>
                  <li>• Modern async/await patterns</li>
                  <li>• Easy integration with Node.js ecosystem</li>
                  <li>• Lightweight for microservices</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Technology Stack */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Complete Technology Stack</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Backend */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-5 h-5 text-blue-500" />
              <h4 className="text-slate-900">Backend</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-600 text-sm mb-1">Languages & Frameworks</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Java 17+</Badge>
                  <Badge variant="outline" className="text-xs">Spring Boot 3</Badge>
                  <Badge variant="outline" className="text-xs">Node.js 18+</Badge>
                  <Badge variant="outline" className="text-xs">NestJS 10</Badge>
                  <Badge variant="outline" className="text-xs">TypeScript</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">ORMs</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">JPA/Hibernate</Badge>
                  <Badge variant="outline" className="text-xs">TypeORM</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Database */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-5 h-5 text-green-500" />
              <h4 className="text-slate-900">Database & Cache</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-600 text-sm mb-1">Primary Database</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">PostgreSQL 15</Badge>
                  <Badge variant="outline" className="text-xs">PostGIS</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">Cache & Queue</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Redis</Badge>
                  <Badge variant="outline" className="text-xs">Bull Queue</Badge>
                  <Badge variant="outline" className="text-xs">RabbitMQ</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">Time-series</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">TimescaleDB</Badge>
                  <Badge variant="outline" className="text-xs">InfluxDB</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Infrastructure */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Cloud className="w-5 h-5 text-purple-500" />
              <h4 className="text-slate-900">Infrastructure</h4>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-slate-600 text-sm mb-1">Container & Orchestration</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Docker</Badge>
                  <Badge variant="outline" className="text-xs">Kubernetes</Badge>
                  <Badge variant="outline" className="text-xs">Helm</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">Gateway & Load Balancer</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">Kong Gateway</Badge>
                  <Badge variant="outline" className="text-xs">NGINX</Badge>
                </div>
              </div>
              <div>
                <p className="text-slate-600 text-sm mb-1">Monitoring</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">ELK Stack</Badge>
                  <Badge variant="outline" className="text-xs">Prometheus</Badge>
                  <Badge variant="outline" className="text-xs">Grafana</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Communication Between Services */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Inter-Service Communication</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-slate-900">Synchronous (REST)</h4>
            <p className="text-slate-600 text-sm">
              Direct API calls between services for immediate responses
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-slate-700 mb-2">Use Cases:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Payment verification from Java to NestJS</li>
                <li>• User authentication checks</li>
                <li>• Real-time fare calculation</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">REST API</Badge>
              <Badge variant="secondary">gRPC (optional)</Badge>
              <Badge variant="secondary">OpenAPI/Swagger</Badge>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-slate-900">Asynchronous (Message Queue)</h4>
            <p className="text-slate-600 text-sm">
              Event-driven communication for loose coupling
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-slate-700 mb-2">Use Cases:</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Payment success → Booking completion event</li>
                <li>• Booking completed → Analytics update</li>
                <li>• Notification triggers</li>
              </ul>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">RabbitMQ</Badge>
              <Badge variant="secondary">Apache Kafka</Badge>
              <Badge variant="secondary">Event Bus</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Development Workflow */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Development Workflow</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-orange-200">
              <h4 className="text-slate-900 mb-2">Java Team Setup</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• Spring Boot 3 with Maven/Gradle</p>
                <p>• Spring Security for Auth</p>
                <p>• Spring Data JPA for Database</p>
                <p>• JUnit 5 for Testing</p>
                <p>• Docker multi-stage builds</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border border-red-200">
              <h4 className="text-slate-900 mb-2">NestJS Team Setup</h4>
              <div className="space-y-2 text-sm text-slate-600">
                <p>• NestJS CLI for scaffolding</p>
                <p>• TypeORM for Database</p>
                <p>• Socket.io for WebSocket</p>
                <p>• Jest for Testing</p>
                <p>• Dockerfile with Node Alpine</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Shared Infrastructure</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-slate-600 text-sm">API Gateway</p>
                <Badge variant="outline" className="mt-1">Kong</Badge>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-sm">Database</p>
                <Badge variant="outline" className="mt-1">PostgreSQL</Badge>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-sm">Cache</p>
                <Badge variant="outline" className="mt-1">Redis</Badge>
              </div>
              <div className="text-center">
                <p className="text-slate-600 text-sm">Queue</p>
                <Badge variant="outline" className="mt-1">RabbitMQ</Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 🆕 NEW: Platform Enhancement Tools */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 via-cyan-50 to-indigo-50 border-2 border-purple-200">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-purple-600" />
          <h3 className="text-slate-900 text-lg sm:text-xl">🆕 Platform Enhancement Tools (NEW!)</h3>
        </div>
        <p className="text-slate-600 mb-6">
          Three powerful <strong>FREE tools</strong> that transform Volteryde into an enterprise-grade platform with 99.9% reliability and AI-powered support.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temporal */}
          <div className="bg-white p-4 rounded-lg border-2 border-purple-300 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🔄</span>
              </div>
              <h4 className="text-slate-900 font-semibold">Temporal</h4>
            </div>
            <p className="text-slate-600 text-sm mb-3">Workflow Orchestration Engine</p>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600">✅ Durable booking workflows</p>
              <p className="text-xs text-slate-600">✅ Auto-retry on failures</p>
              <p className="text-xs text-slate-600">✅ 99.5%+ success rate</p>
              <p className="text-xs text-slate-600">✅ Zero lost bookings</p>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="secondary" className="text-xs">@temporalio/client</Badge>
              <Badge variant="secondary" className="text-xs">Java SDK</Badge>
              <Badge variant="secondary" className="text-xs">Docker</Badge>
            </div>
            <div className="bg-purple-50 p-2 rounded text-xs">
              <strong className="text-purple-700">Cost:</strong> <span className="text-slate-600">Free (self-hosted)</span><br/>
              <strong className="text-purple-700">Value:</strong> <span className="text-slate-600">$100K+ annually</span>
            </div>
          </div>

          {/* Inkeep */}
          <div className="bg-white p-4 rounded-lg border-2 border-cyan-300 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">🤖</span>
              </div>
              <h4 className="text-slate-900 font-semibold">Inkeep</h4>
            </div>
            <p className="text-slate-600 text-sm mb-3">AI-Powered Support Assistant</p>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600">✅ 24/7 instant answers</p>
              <p className="text-xs text-slate-600">✅ 60-70% ticket deflection</p>
              <p className="text-xs text-slate-600">✅ Multi-language support</p>
              <p className="text-xs text-slate-600">✅ $3,500/month savings</p>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="secondary" className="text-xs">@inkeep/react</Badge>
              <Badge variant="secondary" className="text-xs">React Native</Badge>
              <Badge variant="secondary" className="text-xs">AI Cloud</Badge>
            </div>
            <div className="bg-cyan-50 p-2 rounded text-xs">
              <strong className="text-cyan-700">Cost:</strong> <span className="text-slate-600">Free tier → $99/mo</span><br/>
              <strong className="text-cyan-700">Value:</strong> <span className="text-slate-600">$42K+ annually</span>
            </div>
          </div>

          {/* Fumadocs */}
          <div className="bg-white p-4 rounded-lg border-2 border-indigo-300 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-lg">📖</span>
              </div>
              <h4 className="text-slate-900 font-semibold">Fumadocs</h4>
            </div>
            <p className="text-slate-600 text-sm mb-3">Documentation Framework</p>
            <div className="space-y-2 mb-4">
              <p className="text-xs text-slate-600">✅ Auto-gen API docs</p>
              <p className="text-xs text-slate-600">✅ Beautiful UI</p>
              <p className="text-xs text-slate-600">✅ 4-6x faster onboarding</p>
              <p className="text-xs text-slate-600">✅ Self-service partners</p>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="secondary" className="text-xs">Next.js</Badge>
              <Badge variant="secondary" className="text-xs">MDX</Badge>
              <Badge variant="secondary" className="text-xs">OpenAPI</Badge>
            </div>
            <div className="bg-indigo-50 p-2 rounded text-xs">
              <strong className="text-indigo-700">Cost:</strong> <span className="text-slate-600">Free (open-source)</span><br/>
              <strong className="text-indigo-700">Value:</strong> <span className="text-slate-600">$100K+ annually</span>
            </div>
          </div>
        </div>

        {/* ROI Summary */}
        <div className="mt-6 bg-white p-4 rounded-lg border-2 border-green-300">
          <h4 className="text-slate-900 font-semibold mb-3">💰 Total ROI Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">$0-$1.2K</p>
              <p className="text-xs text-slate-600">Annual Cost</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">$300K+</p>
              <p className="text-xs text-slate-600">Annual Value</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">252:1</p>
              <p className="text-xs text-slate-600">ROI Ratio</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">6 weeks</p>
              <p className="text-xs text-slate-600">Implementation</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <Badge variant="default" className="bg-green-600">Ready for Implementation ✅</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
}

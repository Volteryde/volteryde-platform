import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Server, GitBranch, Layers, Shield, Activity, Cloud, Database, Zap } from 'lucide-react';

export function InfrastructurePipeline() {
  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Infrastructure & DevOps Architecture</h3>
        <p className="text-slate-600 text-sm sm:text-base mb-4">
          Production-ready infrastructure with automated deployment, monitoring, and scaling capabilities.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center">
            <Cloud className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <h4 className="text-slate-900 mb-1">Cloud Provider</h4>
            <Badge>AWS / GCP</Badge>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <Layers className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <h4 className="text-slate-900 mb-1">Orchestration</h4>
            <Badge>Kubernetes</Badge>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <GitBranch className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <h4 className="text-slate-900 mb-1">CI/CD</h4>
            <Badge>GitHub Actions</Badge>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <h4 className="text-slate-900 mb-1">Monitoring</h4>
            <Badge>ELK + Datadog</Badge>
          </div>
        </div>
      </Card>

      {/* Kubernetes Architecture */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Kubernetes Cluster Architecture</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Production Cluster</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>• Multi-zone deployment</p>
              <p>• Auto-scaling enabled</p>
              <p>• Load balancer integration</p>
              <p>• SSL/TLS termination</p>
              <p>• Horizontal Pod Autoscaler</p>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Staging Cluster</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>• Production mirror</p>
              <p>• Automated testing</p>
              <p>• Performance testing</p>
              <p>• Blue-green deployments</p>
              <p>• Integration testing</p>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Development Cluster</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <p>• Lower resource limits</p>
              <p>• Feature branch deploys</p>
              <p>• Developer testing</p>
              <p>• Mock external services</p>
              <p>• Local development support</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="text-slate-900 mb-3">Namespaces Structure</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="bg-white p-2 rounded border border-slate-200">
              <Badge variant="outline" className="mb-1">auth-services</Badge>
              <p className="text-xs text-slate-600">Java Auth & OAuth</p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <Badge variant="outline" className="mb-1">payment-services</Badge>
              <p className="text-xs text-slate-600">Java Payment APIs</p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <Badge variant="outline" className="mb-1">core-services</Badge>
              <p className="text-xs text-slate-600">NestJS Microservices</p>
            </div>
            <div className="bg-white p-2 rounded border border-slate-200">
              <Badge variant="outline" className="mb-1">infrastructure</Badge>
              <p className="text-xs text-slate-600">Gateway, Redis, etc.</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Service Deployment Specs */}
      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Service Deployment Specifications</h3>
        
        <Accordion type="multiple" className="space-y-3">
          <AccordionItem value="java-services" className="border rounded-lg">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-orange-500">Java Services</Badge>
                <span className="text-sm text-slate-600">Auth & Payment</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Authentication Service</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 3-10 (auto-scale)</div>
                    <div><span className="text-slate-600">CPU:</span> 500m - 2000m</div>
                    <div><span className="text-slate-600">Memory:</span> 1Gi - 4Gi</div>
                    <div><span className="text-slate-600">Port:</span> 8080</div>
                    <div><span className="text-slate-600">Health:</span> /actuator/health</div>
                    <div><span className="text-slate-600">Metrics:</span> /actuator/prometheus</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Payment Service</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 3-8 (auto-scale)</div>
                    <div><span className="text-slate-600">CPU:</span> 500m - 2000m</div>
                    <div><span className="text-slate-600">Memory:</span> 1Gi - 4Gi</div>
                    <div><span className="text-slate-600">Port:</span> 8081</div>
                    <div><span className="text-slate-600">Health:</span> /actuator/health</div>
                    <div><span className="text-slate-600">PCI Compliant:</span> Yes</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="nestjs-services" className="border rounded-lg">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500">NestJS Services</Badge>
                <span className="text-sm text-slate-600">Core Business Logic</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Ride Management Service</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 3-15 (auto-scale)</div>
                    <div><span className="text-slate-600">CPU:</span> 250m - 1000m</div>
                    <div><span className="text-slate-600">Memory:</span> 512Mi - 2Gi</div>
                    <div><span className="text-slate-600">Port:</span> 3000</div>
                    <div><span className="text-slate-600">Health:</span> /health</div>
                    <div><span className="text-slate-600">WebSocket:</span> Enabled</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Notification Service</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 2-8 (auto-scale)</div>
                    <div><span className="text-slate-600">CPU:</span> 250m - 1000m</div>
                    <div><span className="text-slate-600">Memory:</span> 512Mi - 2Gi</div>
                    <div><span className="text-slate-600">Port:</span> 3001</div>
                    <div><span className="text-slate-600">Queue:</span> Bull (Redis)</div>
                    <div><span className="text-slate-600">Workers:</span> 4</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Fleet Management Service</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 2-6 (auto-scale)</div>
                    <div><span className="text-slate-600">CPU:</span> 250m - 1000m</div>
                    <div><span className="text-slate-600">Memory:</span> 512Mi - 2Gi</div>
                    <div><span className="text-slate-600">Port:</span> 3002</div>
                    <div><span className="text-slate-600">WebSocket:</span> Enabled</div>
                    <div><span className="text-slate-600">TimescaleDB:</span> Connected</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="infrastructure" className="border rounded-lg">
            <AccordionTrigger className="px-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-500">Infrastructure</Badge>
                <span className="text-sm text-slate-600">Gateway, Cache, Queue</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">API Gateway (Kong)</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 3 (minimum)</div>
                    <div><span className="text-slate-600">CPU:</span> 500m - 2000m</div>
                    <div><span className="text-slate-600">Memory:</span> 512Mi - 2Gi</div>
                    <div><span className="text-slate-600">Port:</span> 8000 (HTTP), 8443 (HTTPS)</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">Redis Cluster</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Mode:</span> Cluster (3 masters, 3 replicas)</div>
                    <div><span className="text-slate-600">Memory:</span> 8Gi per node</div>
                    <div><span className="text-slate-600">Persistence:</span> RDB + AOF</div>
                    <div><span className="text-slate-600">Port:</span> 6379</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded">
                  <h5 className="text-slate-900 mb-2">RabbitMQ</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-600">Replicas:</span> 3 (HA cluster)</div>
                    <div><span className="text-slate-600">CPU:</span> 500m - 1000m</div>
                    <div><span className="text-slate-600">Memory:</span> 1Gi - 4Gi</div>
                    <div><span className="text-slate-600">Port:</span> 5672 (AMQP), 15672 (Management)</div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Card>

      {/* Database Infrastructure */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-6 h-6 text-green-500" />
          <h3 className="text-slate-900">Database Infrastructure</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-slate-900 mb-2">PostgreSQL Primary</h4>
              <div className="space-y-1 text-sm text-slate-700">
                <p>• Multi-AZ deployment for HA</p>
                <p>• 3 read replicas for load distribution</p>
                <p>• Instance: db.r6g.2xlarge (8 vCPU, 64GB RAM)</p>
                <p>• Storage: 500GB SSD (auto-scaling to 3TB)</p>
                <p>• Automated backups every 6 hours</p>
                <p>• Point-in-time recovery (30 days)</p>
                <p>• Connection pooling: PgBouncer</p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-slate-900 mb-2">TimescaleDB</h4>
              <div className="space-y-1 text-sm text-slate-700">
                <p>• Time-series data (telemetry, locations)</p>
                <p>• Automatic data compression</p>
                <p>• Retention policy: 90 days</p>
                <p>• Continuous aggregates for analytics</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-slate-900 mb-2">Redis Cluster</h4>
              <div className="space-y-1 text-sm text-slate-700">
                <p>• Session storage</p>
                <p>• Real-time driver locations</p>
                <p>• Rate limiting</p>
                <p>• Cache layer (frequently accessed data)</p>
                <p>• Bull queue backend</p>
                <p>• Cluster mode: 3 shards, 3 replicas</p>
                <p>• Memory: 24GB total</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-slate-900 mb-2">MongoDB (Optional)</h4>
              <div className="space-y-1 text-sm text-slate-700">
                <p>• Chat messages and logs</p>
                <p>• Unstructured analytics data</p>
                <p>• 3-node replica set</p>
                <p>• Sharding for scalability</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* CI/CD Pipeline */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch className="w-6 h-6 text-purple-500" />
          <h3 className="text-slate-900">CI/CD Pipeline (GitHub Actions)</h3>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Workflow for Java Services</h4>
            <div className="space-y-2 text-sm font-mono bg-slate-900 text-slate-100 p-3 rounded">
              <p>1. Code push to feature branch</p>
              <p>2. Run tests (JUnit, Integration tests)</p>
              <p>3. Code quality check (SonarQube)</p>
              <p>4. Build Docker image (multi-stage build)</p>
              <p>5. Push to container registry (ECR/GCR)</p>
              <p>6. Deploy to dev cluster</p>
              <p>7. PR merged → Deploy to staging</p>
              <p>8. Manual approval → Deploy to production</p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-3">Workflow for NestJS Services</h4>
            <div className="space-y-2 text-sm font-mono bg-slate-900 text-slate-100 p-3 rounded">
              <p>1. Code push to feature branch</p>
              <p>2. Run tests (Jest unit + e2e)</p>
              <p>3. Linting (ESLint) + Type checking</p>
              <p>4. Build Docker image (Node Alpine)</p>
              <p>5. Push to container registry</p>
              <p>6. Deploy to dev cluster</p>
              <p>7. PR merged → Deploy to staging</p>
              <p>8. Manual approval → Deploy to production</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50 p-3 rounded">
              <h5 className="text-slate-900 mb-1">Development</h5>
              <p className="text-xs text-slate-600">Auto-deploy on every commit</p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <h5 className="text-slate-900 mb-1">Staging</h5>
              <p className="text-xs text-slate-600">Auto-deploy on PR merge to main</p>
            </div>
            <div className="bg-orange-50 p-3 rounded">
              <h5 className="text-slate-900 mb-1">Production</h5>
              <p className="text-xs text-slate-600">Manual approval required</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Monitoring & Logging */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-6 h-6 text-orange-500" />
          <h3 className="text-slate-900">Monitoring, Logging & Alerting</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">ELK Stack (Logging)</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge>Elasticsearch</Badge>
                <span className="text-slate-600">Log storage and search</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Logstash</Badge>
                <span className="text-slate-600">Log processing pipeline</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Kibana</Badge>
                <span className="text-slate-600">Log visualization and dashboards</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Filebeat</Badge>
                <span className="text-slate-600">Log shipping from pods</span>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 p-3 rounded text-xs">
              <p className="text-slate-700">Retention: 30 days hot, 90 days warm, 1 year cold</p>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">Metrics & Alerting</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Badge>Prometheus</Badge>
                <span className="text-slate-600">Metrics collection</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Grafana</Badge>
                <span className="text-slate-600">Metrics visualization</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Datadog</Badge>
                <span className="text-slate-600">APM and infrastructure monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge>Sentry</Badge>
                <span className="text-slate-600">Error tracking and alerts</span>
              </div>
            </div>

            <div className="mt-4 bg-slate-50 p-3 rounded text-xs space-y-1">
              <p className="text-slate-700">• Alert on 5xx errors &gt; 1% of requests</p>
              <p className="text-slate-700">• Alert on response time &gt; 2s (p95)</p>
              <p className="text-slate-700">• Alert on pod restart &gt; 3 times/hour</p>
              <p className="text-slate-700">• Alert on database connections &gt; 80%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Security */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-red-500" />
          <h3 className="text-slate-900">Security & Compliance</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Network Security</h4>
            <div className="space-y-1 text-xs text-slate-700">
              <p>✓ VPC with private subnets</p>
              <p>✓ Network policies in K8s</p>
              <p>✓ WAF (Web Application Firewall)</p>
              <p>✓ DDoS protection</p>
              <p>✓ SSL/TLS certificates (Let's Encrypt)</p>
              <p>✓ API rate limiting</p>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Application Security</h4>
            <div className="space-y-1 text-xs text-slate-700">
              <p>✓ Secret management (Vault/Secrets Manager)</p>
              <p>✓ Image scanning (Trivy/Snyk)</p>
              <p>✓ RBAC in Kubernetes</p>
              <p>✓ Pod security policies</p>
              <p>✓ Service mesh (Istio - optional)</p>
              <p>✓ mTLS between services</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="text-slate-900 mb-2">Compliance</h4>
            <div className="space-y-1 text-xs text-slate-700">
              <p>✓ PCI DSS (Payment service)</p>
              <p>✓ GDPR compliance</p>
              <p>✓ Data encryption at rest</p>
              <p>✓ Audit logging</p>
              <p>✓ Regular security scans</p>
              <p>✓ Penetration testing</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Disaster Recovery */}
      <Card className="p-6 bg-gradient-to-br from-red-50 to-orange-50">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Backup & Disaster Recovery</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-slate-900 mb-3">Backup Strategy</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">Database Backups</p>
                <p className="text-xs text-slate-600">• Automated every 6 hours</p>
                <p className="text-xs text-slate-600">• 30-day retention</p>
                <p className="text-xs text-slate-600">• Cross-region replication</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">Kubernetes Backups</p>
                <p className="text-xs text-slate-600">• Velero for cluster backups</p>
                <p className="text-xs text-slate-600">• PV snapshots daily</p>
                <p className="text-xs text-slate-600">• Configuration in Git</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">File Storage</p>
                <p className="text-xs text-slate-600">• S3 versioning enabled</p>
                <p className="text-xs text-slate-600">• Cross-region replication</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-slate-900 mb-3">Disaster Recovery Plan</h4>
            <div className="space-y-2 text-sm text-slate-700">
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">RTO (Recovery Time Objective)</p>
                <p className="text-xs text-slate-600">• Critical services: &lt; 1 hour</p>
                <p className="text-xs text-slate-600">• Non-critical: &lt; 4 hours</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">RPO (Recovery Point Objective)</p>
                <p className="text-xs text-slate-600">• Database: &lt; 6 hours</p>
                <p className="text-xs text-slate-600">• Files: &lt; 24 hours</p>
              </div>
              <div className="bg-white p-3 rounded">
                <p className="text-slate-900">Failover Strategy</p>
                <p className="text-xs text-slate-600">• Multi-region deployment ready</p>
                <p className="text-xs text-slate-600">• Automated DNS failover</p>
                <p className="text-xs text-slate-600">• DR drills quarterly</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Cost Optimization */}
      <Card className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h3 className="text-slate-900">Cost Optimization</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-yellow-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">Auto-Scaling</h5>
            <p className="text-xs text-slate-600">Scale down non-critical services during off-peak hours</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">Spot Instances</h5>
            <p className="text-xs text-slate-600">Use for non-critical workloads (dev, batch jobs)</p>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <h5 className="text-slate-900 mb-2">Reserved Capacity</h5>
            <p className="text-xs text-slate-600">1-3 year reservations for production database</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

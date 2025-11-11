import { Card } from './ui/card';
import { Badge } from './ui/badge';
import architectureDiagram from '../assets/23be6354e8b6ffcaa583718bb20b3f106e9f01e8.png';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function ArchitectureOverview() {
  const layers = [
    {
      name: "IoT Layer",
      color: "bg-red-500",
      description: "Vehicle tracking, battery management, diagnostics, edge computing nodes"
    },
    {
      name: "API Gateway",
      color: "bg-orange-500",
      description: "Request routing, rate limiting, authentication validation, load balancing"
    },
    {
      name: "Auth & Authorization",
      color: "bg-orange-500",
      description: "User registration, login, JWT tokens, RBAC, OAuth2"
    },
    {
      name: "Core Services",
      color: "bg-orange-500",
      description: "Bus Booking, Payment, Notification, and Support services"
    },
    {
      name: "Infrastructure",
      color: "bg-purple-500",
      description: "User management, driver profiles, fleet tracking, dispatcher"
    },
    {
      name: "Data Layer",
      color: "bg-green-500",
      description: "PostgreSQL, Redis, MongoDB, Time-series DB, Message Queue"
    },
    {
      name: "Frontend Apps",
      color: "bg-blue-500",
      description: "Mobile apps, dashboards, and portals"
    }
  ];

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This architecture diagram shows the complete system design for Volteryde. Each layer represents a critical component that needs to be implemented and integrated.
        </AlertDescription>
      </Alert>

      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">System Architecture Diagram</h3>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <ImageWithFallback 
            src={architectureDiagram} 
            alt="Volteryde System Architecture"
            className="w-full h-auto"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {layers.map((layer, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full ${layer.color} mt-1.5 flex-shrink-0`} />
              <div>
                <h4 className="text-slate-900 mb-1">{layer.name}</h4>
                <p className="text-slate-600 text-sm">{layer.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4 sm:p-6">
        <h3 className="text-slate-900 text-lg sm:text-xl mb-3 sm:mb-4">Architecture Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Badge variant="secondary">Microservices</Badge>
            <p className="text-slate-600 text-sm">
              Each service is independent, scalable, and can be deployed separately
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Event-Driven</Badge>
            <p className="text-slate-600 text-sm">
              Asynchronous communication via message queues for reliability
            </p>
          </div>
          <div className="space-y-2">
            <Badge variant="secondary">Cloud-Native</Badge>
            <p className="text-slate-600 text-sm">
              Containerized with Docker and orchestrated via Kubernetes
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { ArchitectureOverview } from './components/ArchitectureOverview';
import { ServiceCatalog } from './components/ServiceCatalog';
import { EngineeringRoadmap } from './components/EngineeringRoadmap';
import { TechStackOverview } from './components/TechStackOverview';
import { DatabaseArchitecture } from './components/DatabaseArchitecture';
import { FrontendApplications } from './components/FrontendApplications';
import { InfrastructurePipeline } from './components/InfrastructurePipeline';
import { APIDocumentation } from './components/APIDocumentation';
import { DataFlowJourney } from './components/DataFlowJourney';
import { DomainArchitecture } from './components/DomainArchitecture';
import { Documentation } from './components/Documentation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card } from './components/ui/card';
import { Server, Code, CheckSquare, Layers, Database, Smartphone, Cloud, FileText, BookOpen } from 'lucide-react';
import volterydeLogoSrc from './assets/logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('domains');

  const statsCards = [
    {
      icon: Layers,
      color: 'text-blue-500',
      label: 'Backend Services',
      value: '3',
      tab: 'services',
      hoverColor: 'hover:bg-blue-50'
    },
    {
      icon: FileText,
      color: 'text-green-500',
      label: 'API Endpoints',
      value: '150+',
      tab: 'api',
      hoverColor: 'hover:bg-green-50'
    },
    {
      icon: Smartphone,
      color: 'text-purple-500',
      label: 'Frontend Apps',
      value: '6',
      tab: 'frontend',
      hoverColor: 'hover:bg-purple-50'
    },
    {
      icon: Database,
      color: 'text-orange-500',
      label: 'DB Tables',
      value: '45+',
      tab: 'database',
      hoverColor: 'hover:bg-orange-50'
    },
    {
      icon: Code,
      color: 'text-red-500',
      label: 'App Pages',
      value: '180+',
      tab: 'frontend',
      hoverColor: 'hover:bg-red-50'
    },
    {
      icon: Server,
      color: 'text-indigo-500',
      label: 'Java Services',
      value: '13',
      tab: 'techstack',
      hoverColor: 'hover:bg-indigo-50'
    },
    {
      icon: Cloud,
      color: 'text-cyan-500',
      label: 'Infrastructure',
      value: 'K8s',
      tab: 'infrastructure',
      hoverColor: 'hover:bg-cyan-50'
    },
    {
      icon: CheckSquare,
      color: 'text-pink-500',
      label: 'Timeline',
      value: '30wks',
      tab: 'roadmap',
      hoverColor: 'hover:bg-pink-50'
    },
    {
      icon: BookOpen,
      color: 'text-emerald-500',
      label: 'Docs',
      value: '19',
      tab: 'documentation',
      hoverColor: 'hover:bg-emerald-50'
    }
  ];

  const handleCardClick = (tab: string) => {
    setActiveTab(tab);
    // Smooth scroll to tabs section on mobile
    if (window.innerWidth < 768) {
      setTimeout(() => {
        document.getElementById('tabs-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3">
            <img 
              src={volterydeLogoSrc} 
              alt="Volteryde Logo" 
              className="h-12 sm:h-14 md:h-16 w-auto" 
            />
            <div className="flex-1">
              <h1 className="text-slate-900 text-xl sm:text-2xl md:text-3xl lg:text-4xl mb-1 sm:mb-2">
                Engineering Roadmap Dashboard
              </h1>
              <p className="text-slate-600 text-xs sm:text-sm md:text-base">
                Domain-Driven Design (DDD) architecture with clear boundaries & event-driven communication
              </p>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2 sm:gap-3 mb-6 sm:mb-8">
          {statsCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={idx}
                className={`p-2 sm:p-3 cursor-pointer transition-all duration-200 ${stat.hoverColor} hover:shadow-lg hover:scale-105 active:scale-95`}
                onClick={() => handleCardClick(stat.tab)}
              >
                <div className="flex flex-col items-center text-center">
                  <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.color} mb-1 sm:mb-2`} />
                  <p className="text-slate-500 text-xs leading-tight">{stat.label}</p>
                  <p className="text-slate-900 text-sm sm:text-base mt-0.5 sm:mt-1">{stat.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Main Content Tabs */}
        <div id="tabs-section">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex w-full min-w-max h-auto flex-nowrap">
                <TabsTrigger value="domains" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap font-semibold">
                  🎯 DDD Domains
                </TabsTrigger>
                <TabsTrigger value="techstack" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Tech Stack
                </TabsTrigger>
                <TabsTrigger value="database" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Database
                </TabsTrigger>
                <TabsTrigger value="api" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  APIs
                </TabsTrigger>
                <TabsTrigger value="services" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Services
                </TabsTrigger>
                <TabsTrigger value="frontend" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Frontend
                </TabsTrigger>
                <TabsTrigger value="infrastructure" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Infrastructure
                </TabsTrigger>
                <TabsTrigger value="architecture" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Architecture
                </TabsTrigger>
                <TabsTrigger value="roadmap" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Roadmap
                </TabsTrigger>
                <TabsTrigger value="dataflow" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap">
                  Data Flow
                </TabsTrigger>
                <TabsTrigger value="documentation" className="text-xs sm:text-sm px-2 sm:px-3 md:px-4 whitespace-nowrap font-semibold">
                  📚 Documentation
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="domains">
              <DomainArchitecture />
            </TabsContent>

            <TabsContent value="techstack">
              <TechStackOverview />
            </TabsContent>

            <TabsContent value="database">
              <DatabaseArchitecture />
            </TabsContent>

            <TabsContent value="api">
              <APIDocumentation />
            </TabsContent>

            <TabsContent value="services">
              <ServiceCatalog />
            </TabsContent>

            <TabsContent value="frontend">
              <FrontendApplications />
            </TabsContent>

            <TabsContent value="infrastructure">
              <InfrastructurePipeline />
            </TabsContent>

            <TabsContent value="architecture">
              <ArchitectureOverview />
            </TabsContent>

            <TabsContent value="roadmap">
              <EngineeringRoadmap />
            </TabsContent>

            <TabsContent value="dataflow">
              <DataFlowJourney />
            </TabsContent>

            <TabsContent value="documentation">
              <Documentation />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

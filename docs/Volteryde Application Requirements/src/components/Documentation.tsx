import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Card } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { BookOpen, FileText, Search, X } from 'lucide-react';
import 'highlight.js/styles/github-dark.css';
import './documentation.css';

interface DocFile {
  id: string;
  title: string;
  description: string;
  filename: string;
  icon: string;
  category: 'blueprint' | 'architecture' | 'integration' | 'project';
}

const documentationFiles: DocFile[] = [
  {
    id: 'complete-summary',
    title: 'Complete Technical Summary',
    description: 'Executive overview of the entire blueprint - READ THIS FIRST!',
    filename: 'COMPLETE_TECHNICAL_SUMMARY.md',
    icon: '⭐',
    category: 'blueprint'
  },
  {
    id: 'technical-blueprint',
    title: 'Technical Blueprint',
    description: 'Master architecture overview and navigation guide',
    filename: 'TECHNICAL_BLUEPRINT.md',
    icon: '🎯',
    category: 'blueprint'
  },
  {
    id: 'implementation-roadmap',
    title: 'Implementation Roadmap',
    description: '14-week step-by-step plan from zero to production',
    filename: 'IMPLEMENTATION_ROADMAP.md',
    icon: '🗺️',
    category: 'blueprint'
  },
  {
    id: 'repository-structure',
    title: 'Repository Structure',
    description: 'Monorepo organization, branching strategy, CI/CD workflows',
    filename: 'REPOSITORY_STRUCTURE.md',
    icon: '📁',
    category: 'blueprint'
  },
  {
    id: 'infrastructure-guide',
    title: 'Infrastructure Guide',
    description: 'AWS + Terraform: VPC, EKS, RDS, Redis, Secrets Manager',
    filename: 'INFRASTRUCTURE_GUIDE.md',
    icon: '☁️',
    category: 'blueprint'
  },
  {
    id: 'kubernetes-deployment',
    title: 'Kubernetes Deployment Guide',
    description: 'Docker + Kubernetes: Deployments, Services, Autoscaling',
    filename: 'KUBERNETES_DEPLOYMENT_GUIDE.md',
    icon: '⚙️',
    category: 'blueprint'
  },
  {
    id: 'temporal-implementation',
    title: 'Temporal Implementation Guide',
    description: 'Workflow orchestration for booking, payments, fleet operations',
    filename: 'TEMPORAL_IMPLEMENTATION_GUIDE.md',
    icon: '⏱️',
    category: 'blueprint'
  },
  {
    id: 'cicd-pipeline',
    title: 'CI/CD Pipeline Guide',
    description: 'GitHub Actions: Build, test, security scan, deploy',
    filename: 'CICD_PIPELINE_GUIDE.md',
    icon: '🚀',
    category: 'blueprint'
  },
  {
    id: 'ddd-architecture',
    title: 'DDD Architecture Summary',
    description: 'Complete Domain-Driven Design architecture overview',
    filename: 'DDD_ARCHITECTURE_SUMMARY.md',
    icon: '🏗️',
    category: 'architecture'
  },
  {
    id: 'architecture-conflicts',
    title: 'Architecture Conflicts Report',
    description: 'Identified conflicts and recommended resolutions',
    filename: 'ARCHITECTURE_CONFLICTS_REPORT.md',
    icon: '⚠️',
    category: 'architecture'
  },
  {
    id: 'ui-visual-guide',
    title: 'UI Visual Guide',
    description: 'Design system and component guidelines',
    filename: 'UI_VISUAL_GUIDE.md',
    icon: '🎨',
    category: 'architecture'
  },
  {
    id: 'integration-plan',
    title: 'Integration Plan - Temporal, Inkeep, Fumadocs',
    description: 'Comprehensive guide for platform integrations',
    filename: 'INTEGRATION_PLAN_TEMPORAL_INKEEP_FUMADOCS.md',
    icon: '🔗',
    category: 'integration'
  },
  {
    id: 'current-vs-future',
    title: 'Current vs Future State',
    description: 'Before/after comparison showing ROI and improvements',
    filename: 'CURRENT_VS_FUTURE_STATE.md',
    icon: '📊',
    category: 'integration'
  },
  {
    id: 'integration-summary',
    title: 'Integration Implementation Summary',
    description: 'What was integrated into the roadmap',
    filename: 'INTEGRATION_IMPLEMENTATION_SUMMARY.md',
    icon: '✅',
    category: 'integration'
  },
  {
    id: 'implementation-checklist',
    title: 'Implementation Checklist',
    description: 'Week-by-week implementation tasks',
    filename: 'IMPLEMENTATION_CHECKLIST.md',
    icon: '☑️',
    category: 'integration'
  },
  {
    id: 'completion-summary',
    title: 'Completion Summary',
    description: 'Project progress tracking',
    filename: 'COMPLETION_SUMMARY.md',
    icon: '📈',
    category: 'project'
  },
  {
    id: 'review-summary',
    title: 'Review Summary',
    description: 'Code review findings and recommendations',
    filename: 'REVIEW_SUMMARY.md',
    icon: '🔍',
    category: 'project'
  },
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    description: 'High-level project overview for stakeholders',
    filename: 'EXECUTIVE_SUMMARY.md',
    icon: '📋',
    category: 'project'
  },
  {
    id: 'index',
    title: 'Documentation Index',
    description: 'Navigation and reading order guide',
    filename: 'INDEX.md',
    icon: '📚',
    category: 'project'
  }
];

export function Documentation() {
  const [selectedDoc, setSelectedDoc] = useState<DocFile>(documentationFiles[0]);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDocs, setFilteredDocs] = useState<DocFile[]>(documentationFiles);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    loadDocument(selectedDoc);
    // Scroll to top immediately when document changes
    setTimeout(() => {
      const scrollContainer = document.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // Also scroll page to content section on mobile
      if (window.innerWidth < 1024) {
        document.getElementById('documentation-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }, [selectedDoc]);

  useEffect(() => {
    filterDocuments();
  }, [searchTerm, selectedCategory]);

  const loadDocument = async (doc: DocFile) => {
    setLoading(true);
    try {
      const response = await fetch(`/${doc.filename}`);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      console.error('Error loading document:', error);
      setContent(`# Error Loading Document\n\nCould not load ${doc.filename}. Please ensure the file exists in the project root.`);
    } finally {
      setLoading(false);
    }
  };

  const filterDocuments = () => {
    let filtered = documentationFiles;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocs(filtered);
  };

  const categories = [
    { id: 'all', label: 'All Docs', count: documentationFiles.length },
    { id: 'blueprint', label: 'Blueprint Guides', count: documentationFiles.filter(d => d.category === 'blueprint').length },
    { id: 'architecture', label: 'Architecture', count: documentationFiles.filter(d => d.category === 'architecture').length },
    { id: 'integration', label: 'Integration Plans', count: documentationFiles.filter(d => d.category === 'integration').length },
    { id: 'project', label: 'Project Status', count: documentationFiles.filter(d => d.category === 'project').length },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Technical Documentation</h2>
              <p className="text-slate-600 mt-1">
                Complete production-grade blueprint for building Volteryde platform
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Guides</p>
            <p className="text-2xl font-bold text-blue-600">{documentationFiles.length}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Total Lines</p>
            <p className="text-2xl font-bold text-blue-600">25,000+</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Code Examples</p>
            <p className="text-2xl font-bold text-blue-600">100+</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-xs text-slate-500 uppercase tracking-wide">Implementation</p>
            <p className="text-2xl font-bold text-blue-600">14 Weeks</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className={`lg:col-span-3 ${!sidebarOpen ? 'hidden lg:block' : ''}`}>
          <Card className="p-4 sticky top-4">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search docs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div className="space-y-1 mb-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{category.label}</span>
                  <span className="float-right text-xs opacity-60">({category.count})</span>
                </button>
              ))}
            </div>

            {/* Document List */}
            <ScrollArea className="h-[calc(100vh-400px)] min-h-[400px] max-h-[700px]">
              <div className="space-y-1">
                {filteredDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setSelectedDoc(doc);
                      if (window.innerWidth < 1024) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedDoc.id === doc.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg flex-shrink-0">{doc.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm leading-tight ${
                          selectedDoc.id === doc.id ? 'text-white' : 'text-slate-900'
                        }`}>
                          {doc.title}
                        </p>
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          selectedDoc.id === doc.id ? 'text-blue-100' : 'text-slate-500'
                        }`}>
                          {doc.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9" id="documentation-content">
          <Card className="p-4 md:p-6">
            {/* Document Header */}
            <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200">
              <div className="flex items-start md:items-center gap-2 md:gap-3 mb-2">
                <span className="text-2xl md:text-3xl flex-shrink-0">{selectedDoc.icon}</span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg md:text-2xl font-bold text-slate-900 break-words">{selectedDoc.title}</h3>
                  <p className="text-slate-600 text-xs md:text-sm mt-1 line-clamp-2">{selectedDoc.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-md uppercase">
                  {selectedDoc.category}
                </span>
                <span className="text-xs text-slate-500">
                  {selectedDoc.filename}
                </span>
              </div>
            </div>

            {/* Document Content */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-300px)] min-h-[500px]">
                <div className="markdown-content prose prose-slate max-w-none px-2 md:px-4 overflow-hidden">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                    components={{
                      h1: ({ node, ...props }) => <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-8 mb-4 pb-3 border-b-2 border-blue-200" {...props} />,
                      h2: ({ node, ...props }) => <h2 className="text-xl md:text-2xl font-bold text-slate-800 mt-6 mb-3" {...props} />,
                      h3: ({ node, ...props }) => <h3 className="text-lg md:text-xl font-semibold text-slate-700 mt-4 mb-2" {...props} />,
                      h4: ({ node, ...props }) => <h4 className="text-base md:text-lg font-semibold text-slate-700 mt-3 mb-2" {...props} />,
                      p: ({ node, ...props }) => <p className="text-slate-600 leading-relaxed mb-4 break-words" {...props} />,
                      ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-2 mb-4 text-slate-600" {...props} />,
                      ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-2 mb-4 text-slate-600" {...props} />,
                      li: ({ node, ...props }) => <li className="ml-4" {...props} />,
                      code: ({ node, inline, ...props }: any) =>
                        inline ? (
                          <code className="px-1.5 py-0.5 bg-slate-100 text-pink-600 rounded text-xs md:text-sm font-mono" {...props} />
                        ) : (
                          <code className="block bg-slate-900 text-slate-100 p-3 md:p-4 rounded-lg text-xs md:text-sm font-mono" {...props} />
                        ),
                      pre: ({ node, ...props }) => <pre className="mb-4 rounded-lg overflow-x-auto bg-slate-900 max-w-full" {...props} />,
                      blockquote: ({ node, ...props }) => (
                        <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-2 my-4 italic text-slate-700" {...props} />
                      ),
                      table: ({ node, ...props }) => (
                        <div className="overflow-x-auto mb-4">
                          <table className="min-w-full divide-y divide-slate-200 border border-slate-200" {...props} />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead className="bg-slate-50" {...props} />,
                      th: ({ node, ...props }) => <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider border-b border-slate-200" {...props} />,
                      td: ({ node, ...props }) => <td className="px-4 py-3 text-sm text-slate-600 border-b border-slate-100" {...props} />,
                      a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" {...props} />,
                      hr: ({ node, ...props }) => <hr className="my-6 border-slate-200" {...props} />,
                    }}
                  >
                    {content}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

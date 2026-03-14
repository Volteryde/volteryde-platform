export interface NavItem {
  name: string
  icon: string
  url: string
}

export const navItems: NavItem[] = [
  { name: 'BI Overview', icon: 'dashboard', url: '/dashboard' },
  { name: 'Financial Forecast', icon: 'chart-line', url: '/dashboard/financialforcast' },
  { name: 'Payment Behavior', icon: 'credit-card', url: '/dashboard/paymentbehavior' },
  { name: 'Integration Insights', icon: 'bolt', url: '/dashboard/integrationinsights' },
  { name: 'Revenue Analytics', icon: 'currency-dollar', url: '/dashboard/revenueanalytics' },
]

export const bottomNavItems: NavItem[] = [
  { name: 'Settings', icon: 'settings', url: '/dashboard/settings' },
]

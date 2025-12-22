import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: any
  children?: ChildItem[]
  item?: any
  url?: any
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: any
  id?: number
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: any
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
      },
    ],
  },
  {
    heading: 'Management',
    children: [
      {
        name: 'Users',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/users',
      },
      {
        name: 'Payments',
        icon: 'solar:card-linear',
        id: uniqueId(),
        url: '/payments',
      },
    ],
  },
  {
    heading: 'Operations',
    children: [
      {
        name: 'Fleet',
        icon: 'solar:bus-linear',
        id: uniqueId(),
        url: '/fleet',
      },
      {
        name: 'Bookings',
        icon: 'solar:ticket-linear',
        id: uniqueId(),
        url: '/bookings',
      },
      {
        name: 'Charging',
        icon: 'solar:bolt-linear',
        id: uniqueId(),
        url: '/charging',
      },
    ],
  },
  {
    heading: 'Monitoring',
    children: [
      {
        name: 'System Health',
        icon: 'solar:server-linear',
        id: uniqueId(),
        url: '/system-health',
      },
      {
        name: 'Reports',
        icon: 'solar:chart-linear',
        id: uniqueId(),
        url: '/reports',
      },
    ],
  },
]

export default SidebarContent

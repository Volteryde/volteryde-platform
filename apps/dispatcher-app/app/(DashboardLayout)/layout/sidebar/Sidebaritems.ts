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
        url: '/dashboard',
      },
    ],
  },
  {
    heading: 'Operations',
    children: [
      {
        name: 'Bookings',
        icon: 'solar:ticket-linear',
        id: uniqueId(),
        url: '/bookings',
      },
      {
        name: 'Live Map',
        icon: 'solar:map-point-linear',
        id: uniqueId(),
        url: '/live-map',
      },
      {
        name: 'Drivers',
        icon: 'solar:user-id-linear',
        id: uniqueId(),
        url: '/drivers',
      },
      {
        name: 'Routes',
        icon: 'solar:routing-linear',
        id: uniqueId(),
        url: '/routes',
      },
    ],
  },
  {
    heading: 'Settings',
    children: [
      {
        name: 'Profile',
        icon: 'solar:user-circle-linear',
        id: uniqueId(),
        url: '/profile',
      },
    ],
  },
]

export default SidebarContent

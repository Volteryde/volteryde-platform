export interface NavItem {
  name: string
  icon: string
  url: string
}

export const navItems: NavItem[] = [
  { name: 'Live Map', icon: 'solar:map-linear', url: '/live-map' },
  { name: 'Assignments', icon: 'solar:list-check-linear', url: '/assignments' },
  { name: 'Drivers', icon: 'solar:users-group-rounded-linear', url: '/drivers' },
  { name: 'Trips', icon: 'solar:map-point-wave-linear', url: '/trips' },
  { name: 'Buses', icon: 'solar:bus-linear', url: '/buses' },
]

export const bottomNavItems: NavItem[] = [
  { name: 'Settings', icon: 'solar:settings-linear', url: '/settings' },
]

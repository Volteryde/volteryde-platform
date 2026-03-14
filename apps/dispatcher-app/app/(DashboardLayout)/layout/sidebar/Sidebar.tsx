'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon } from '@iconify/react'
import Image from 'next/image'
import { navItems, bottomNavItems } from './Sidebaritems'
import { useAuth } from '@/providers/AuthProvider'

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}

const Sidebar = ({ isCollapsed = false, onToggle, onClose }: SidebarProps) => {
  const pathname = usePathname()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + '/')

  const navLinkClass = (url: string) => {
    const active = isActive(url)
    return `flex items-center gap-4 rounded-xl transition-all duration-200 w-full
      ${isCollapsed ? 'justify-center p-3' : 'px-3 py-3'}
      ${active
        ? 'bg-[#0CCF0E] text-white shadow-md shadow-[#0CCF0E]/30'
        : 'text-gray-600 dark:text-darklink hover:bg-[#0CCF0E]/10 hover:text-[#0CCF0E] dark:hover:text-[#0CCF0E]'
      }`
  }

  return (
    <aside
      className={`h-full bg-white dark:bg-dark border-r border-border dark:border-darkborder flex flex-col transition-all duration-300
        ${isCollapsed ? 'w-[72px]' : 'w-[270px]'}`}
    >
      {/* Logo */}
      <div className={`flex flex-col items-center justify-center pt-10 pb-8 transition-all duration-300 ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <Link href='/dashboard' onClick={onClose}>
          <div className='flex flex-col items-center gap-2'>
            <Image
              src='/logo.svg'
              alt='Volteryde'
              width={isCollapsed ? 36 : 72}
              height={isCollapsed ? 36 : 72}
              className='object-contain dark:brightness-0 dark:invert transition-all duration-300'
              unoptimized
            />
            {!isCollapsed && (
              <span className='text-xs font-bold tracking-[0.2em] text-[#0CCF0E] dark:text-white uppercase whitespace-nowrap'>
                Volteryde
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Main nav */}
      <nav className={`flex-1 flex flex-col gap-2 overflow-y-auto transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {navItems.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            onClick={onClose}
            title={isCollapsed ? item.name : undefined}
            className={navLinkClass(item.url)}
          >
            <Icon icon={item.icon} width={22} height={22} className='shrink-0' />
            {!isCollapsed && (
              <span className='text-base font-medium whitespace-nowrap overflow-hidden'>{item.name}</span>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className={`flex flex-col gap-2 pb-4 transition-all duration-300 ${isCollapsed ? 'px-3' : 'px-4'}`}>

        {/* Collapse toggle button */}
        <button
          onClick={onToggle}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`flex items-center gap-4 px-3 py-3 rounded-lg text-gray-400 dark:text-darklink hover:text-[#0CCF0E] dark:hover:text-[#0CCF0E] transition-colors w-full mb-1
            ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Icon
            icon={isCollapsed ? 'solar:alt-arrow-right-linear' : 'solar:alt-arrow-left-linear'}
            width={20}
            height={20}
            className='shrink-0'
          />
          {!isCollapsed && (
            <span className='text-sm font-medium whitespace-nowrap'>Collapse</span>
          )}
        </button>

        {bottomNavItems.map((item) => (
          <Link
            key={item.url}
            href={item.url}
            onClick={onClose}
            title={isCollapsed ? item.name : undefined}
            className={navLinkClass(item.url)}
          >
            <Icon icon={item.icon} width={22} height={22} className='shrink-0' />
            {!isCollapsed && (
              <span className='text-base font-medium whitespace-nowrap'>{item.name}</span>
            )}
          </Link>
        ))}

        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Log Out' : undefined}
          className={`flex items-center gap-4 px-3 py-4 rounded-xl text-gray-600 dark:text-darklink hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 dark:hover:text-red-400 transition-all w-full mb-4
            ${isCollapsed ? 'justify-center' : ''}`}
        >
          <Icon icon='solar:logout-2-linear' width={22} height={22} className='shrink-0' />
          {!isCollapsed && (
            <span className='text-base font-medium whitespace-nowrap'>Log Out</span>
          )}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

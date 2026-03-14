'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import {
  IconMenu2,
  IconMoon,
  IconSun,
  IconUser,
} from '@tabler/icons-react'
import FullLogo from '../shared/logo/FullLogo'
import SidebarLayout from '../sidebar/Sidebar'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import * as VisuallyHidden from '@radix-ui/react-visually-hidden'

const Header = () => {
  const { theme, setTheme } = useTheme()
  const [isSticky, setIsSticky] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleMode = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <>
      <header className={`sticky top-0 z-2 ${isSticky ? 'bg-background shadow-md fixed w-full' : 'bg-transparent'}`}>
        <nav className='rounded-none py-4 sm:ps-6 max-w-full! sm:pe-10 dark:bg-dark flex justify-between items-center px-6'>

          {/* Mobile toggle */}
          <div
            onClick={() => setIsOpen(true)}
            className='px-[15px] hover:text-primary dark:hover:text-primary text-link dark:text-darklink relative after:absolute after:w-10 after:h-10 after:rounded-full hover:after:bg-lightprimary after:bg-transparent rounded-full xl:hidden flex justify-center items-center cursor-pointer'
          >
            <IconMenu2 size={20} />
          </div>

          <div className='block xl:hidden'>
            <FullLogo />
          </div>

          {/* Mobile right actions */}
          <div className='flex xl:hidden items-center gap-1'>
            <button
              onClick={toggleMode}
              className='hover:text-primary px-2 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative'
            >
              <span className='flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary'>
                {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} className='group-hover:text-primary' />}
              </span>
            </button>
            <button className='hover:text-primary px-2 rounded-full flex justify-center items-center text-link dark:text-darklink'>
              <IconUser size={20} />
            </button>
          </div>

          {/* Desktop right actions */}
          <div className='hidden xl:flex items-center justify-end w-full'>
            <div className='flex gap-0 items-center'>
              <button
                onClick={toggleMode}
                className='hover:text-primary px-15 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative'
              >
                <span className='flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary'>
                  {theme === 'light' ? <IconMoon size={20} /> : <IconSun size={20} className='group-hover:text-primary' />}
                </span>
              </button>
              <button className='hover:text-primary ps-15 rounded-full flex justify-center items-center text-link dark:text-darklink'>
                <IconUser size={22} />
              </button>
            </div>
          </div>

        </nav>
      </header>

      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side='left' className='w-64 p-0'>
          <VisuallyHidden.Root>
            <SheetTitle>sidebar</SheetTitle>
          </VisuallyHidden.Root>
          <SidebarLayout onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  )
}

export default Header

'use client'

import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Icon } from '@iconify/react'

const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className='w-full h-full flex items-center justify-center bg-muted dark:bg-input/10'>
      <div className='flex flex-col items-center gap-3'>
        <div className='w-8 h-8 rounded-full border-2 border-[#0CCF0E] border-t-transparent animate-spin' />
        <span className='text-sm text-muted-foreground'>Loading map…</span>
      </div>
    </div>
  ),
})

export default function LiveMapPage() {
  const [query, setQuery] = useState('')

  return (
    <div className='relative h-full'>

      {/* Search buses overlay */}
      <div className='absolute top-4 left-4 z-10 w-64'>
        <div className='flex items-center gap-2 bg-white dark:bg-dark rounded-full px-4 py-2.5 shadow-lg border border-border dark:border-darkborder'>
          <Icon icon='solar:magnifer-linear' width={18} height={18} className='text-muted-foreground shrink-0' />
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Search Buses'
            className='bg-transparent text-sm text-dark dark:text-white placeholder:text-muted-foreground outline-none w-full'
          />
          {query && (
            <button onClick={() => setQuery('')} className='text-muted-foreground hover:text-dark dark:hover:text-white'>
              <Icon icon='solar:close-circle-linear' width={16} height={16} />
            </button>
          )}
        </div>
      </div>

      <MapView />
    </div>
  )
}

'use client'

import Image from 'next/image'

const FullLogo = () => {
  return (
    <div className='flex items-center gap-2'>
      <Image
        src='/vlogo.png'
        alt='Volteryde'
        width={40}
        height={40}
        className='object-contain'
        unoptimized
      />
      <span className='text-xl font-bold dark:text-white text-dark'>
        BI Partner
      </span>
    </div>
  )
}

export default FullLogo

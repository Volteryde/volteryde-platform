export default function DriversPage() {
  return (
    <div className='space-y-6 p-6'>
      <div>
        <h1 className='text-2xl font-semibold text-dark dark:text-white'>Drivers</h1>
        <p className='text-sm text-muted-foreground mt-1'>
          View and manage all registered drivers
        </p>
      </div>

      {/* Placeholder content */}
      <div className='rounded-xl border border-border dark:border-darkborder bg-white dark:bg-dark p-8 flex items-center justify-center min-h-[400px]'>
        <p className='text-sm text-muted-foreground'>Drivers list renders here</p>
      </div>
    </div>
  )
}

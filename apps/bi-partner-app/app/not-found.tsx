import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Page Not Found',
	description: 'The page you are looking for does not exist.',
}

const NotFound = () => {
	return (
		<>
			<div className='h-screen flex items-center justify-center bg-background'>
				<div className='text-center'>
					<Image
						src={'/images/backgrounds/errorimg.svg'}
						alt='error'
						className='mb-4'
						width={400}
						height={300}
					/>
					<h1 className='text-foreground text-4xl mb-6'>Oops!!!</h1>
					<h6 className='text-xl text-muted-foreground'>
						The page you are looking for could not be found.
					</h6>
					<Link
						href="/"
						className="mt-6 mx-auto inline-flex h-10 items-center justify-center rounded-md bg-[#0CCF0E] px-8 text-sm font-medium text-white shadow transition-colors hover:bg-[#0bb00d] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
					>
						Go Back to Home
					</Link>
				</div>
			</div>
		</>
	)
}

export default NotFound

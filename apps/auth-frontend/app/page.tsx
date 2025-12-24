import { redirect } from 'next/navigation';

export default function Home() {
	// Default redirect to login
	redirect('/login');
}

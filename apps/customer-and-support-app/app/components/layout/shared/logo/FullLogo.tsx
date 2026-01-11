
import { Link } from 'react-router';

const FullLogo = () => {
	return (
		<div className="flex items-center gap-2">
			<img
				src="/logo1.png"
				alt="Volteryde Customer Support"
				width={40}
				height={40}
				className="object-contain"
			/>
			<span className="text-xl font-bold dark:text-white text-dark">
				Customer Support
			</span>
		</div>
	);
};

export default FullLogo;

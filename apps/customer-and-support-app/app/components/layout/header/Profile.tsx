
import { getAuthServiceUrl } from '@volteryde/config';
import { Icon } from '@iconify/react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Avatar from '@radix-ui/react-avatar';
import { Link } from 'react-router';

const Profile = () => {
	// Basic user info - ideally checking localstorage or context, but for now specific to replicated functionality
	// We assume user is logged in if they are here
	const user = {
		name: 'Support Agent',
		avatarUrl: '', // Default fallback
		role: 'Customer Support'
	};

	const handleLogout = () => {
		// 1. Clear LocalStorage
		localStorage.removeItem('volteryde_auth_access_token');
		localStorage.removeItem('volteryde_auth_refresh_token');
		localStorage.removeItem('volteryde_auth_expires_at');
		localStorage.removeItem('volteryde_auth_user');

		// 2. Clear Cookies
		document.cookie = 'volteryde_auth_access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';

		// 3. Redirect to Auth Platform
		const authUrl = getAuthServiceUrl();
		window.location.href = `${authUrl}/login?logout=true`;
	};

	return (
		<DropdownMenu.Root>
			<DropdownMenu.Trigger asChild>
				<button className="outline-none rounded-full h-[35px] w-[35px] hover:ring-2 hover:ring-offset-2 hover:ring-[#0CCF0E] transition-all">
					<Avatar.Root className="h-full w-full rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
						<Avatar.Image
							src={user.avatarUrl}
							className="h-full w-full object-cover"
							alt="Profile"
						/>
						<Avatar.Fallback className="text-gray-500 font-medium text-xs">
							CS
						</Avatar.Fallback>
					</Avatar.Root>
				</button>
			</DropdownMenu.Trigger>

			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className="min-w-[200px] bg-white rounded-md shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),_0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)] p-[5px] will-change-[transform,opacity] data-[side=top]:animate-slideDownAndFade data-[side=right]:animate-slideLeftAndFade data-[side=bottom]:animate-slideUpAndFade data-[side=left]:animate-slideRightAndFade z-50 mr-4"
					sideOffset={5}
				>
					<div className="px-2 py-2 mb-2 border-b border-gray-100">
						<h6 className="font-semibold text-sm text-gray-800">{user.name}</h6>
						<span className="text-xs text-gray-500 block">{user.role}</span>
					</div>

					<DropdownMenu.Item className="group text-[13px] leading-none text-gray-700 rounded-[3px] flex items-center h-[35px] px-[5px] relative select-none outline-none data-[highlighted]:bg-[#0CCF0E] data-[highlighted]:text-white cursor-pointer mb-1">
						<Link to="/profile" className="flex items-center gap-2 w-full h-full">
							<Icon icon="solar:user-circle-linear" />
							My Profile
						</Link>
					</DropdownMenu.Item>

					<DropdownMenu.Item
						className="group text-[13px] leading-none text-red-600 rounded-[3px] flex items-center h-[35px] px-[5px] relative select-none outline-none data-[highlighted]:bg-red-50 data-[highlighted]:text-red-700 cursor-pointer"
						onSelect={handleLogout}
					>
						<div className="flex items-center gap-2">
							<Icon icon="solar:logout-2-linear" />
							Logout
						</div>
					</DropdownMenu.Item>

					<DropdownMenu.Arrow className="fill-white" />
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	);
};

export default Profile;

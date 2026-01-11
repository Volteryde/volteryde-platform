
import { Link, useLocation } from 'react-router';
// import { useTheme } from 'next-themes'; // Simplifying for now
import SidebarContent from './Sidebaritems';
import SimpleBar from 'simplebar-react';
import { Icon } from '@iconify/react';
import FullLogo from '../shared/logo/FullLogo';
import {
	AMMenu,
	AMMenuItem,
	AMSubmenu,
} from 'tailwind-sidebar';
import 'tailwind-sidebar/styles.css';
import 'simplebar-react/dist/simplebar.min.css';

const renderSidebarItems = (
	items: any[],
	currentPath: string,
	onClose?: () => void,
	isSubItem: boolean = false
) => {
	return items.map((item, index) => {
		const isSelected = currentPath === item?.url;
		const IconComp = item.icon || null;

		const iconElement = IconComp ? (
			<Icon icon={IconComp} height={21} width={21} />
		) : (
			<Icon icon={'ri:checkbox-blank-circle-line'} height={9} width={9} />
		);

		// Heading
		if (item.heading) {
			return (
				<div className='mb-1' key={item.heading}>
					<AMMenu
						subHeading={item.heading}
						ClassName='hide-menu leading-21 text-charcoal font-bold uppercase text-xs dark:text-darkcharcoal'
					/>
				</div>
			);
		}

		// Submenu
		if (item.children?.length) {
			return (
				<AMSubmenu
					key={item.id}
					icon={iconElement}
					title={item.name}
					ClassName='mt-0.5 text-link dark:text-darklink'>
					{renderSidebarItems(item.children, currentPath, onClose, true)}
				</AMSubmenu>
			);
		}

		// Regular menu item
		// const linkTarget = item.url?.startsWith('https') ? '_blank' : '_self';

		const itemClassNames = isSubItem
			? `mt-0.5 text-link dark:text-darklink !hover:bg-transparent ${isSelected ? '!bg-transparent !text-[#0CCF0E]' : ''
			} !px-1.5`
			: `mt-0.5 text-link dark:text-darklink ${isSelected ? '!bg-[#0CCF0E] !text-white rounded-md' : 'hover:bg-lightprimary/20 rounded-md'}`;

		return (
			<div onClick={onClose} key={index}>
				<AMMenuItem
					key={item.id}
					icon={iconElement}
					isSelected={isSelected}
					// link={item.url || undefined}
					// target={linkTarget}
					badge={!!item.isPro}
					badgeColor='bg-lightsecondary'
					badgeTextColor='text-secondary'
					disabled={item.disabled}
					badgeContent={item.isPro ? 'Pro' : undefined}
				// component={Link} // Link behaves differently in react-router vs next/link sometimes with props
				>
					<Link to={item.url} className={`flex items-center w-full ${itemClassNames} py-2 px-3 gap-3 rounded-md`}>
						{/* We manually wrap content in Link because AMMenuItem component prop might be tricky with generic props */}
						{/* Actually tailwind-sidebar AMMenuItem likely expects a component prop to render properly. 
                Let's try passing Link and 'to' prop if supported, or wrapped. 
                Looking at Admin Dashboard: component={Link} and link={item.url} (Next Link takes href, React Router Link takes to). 
                I'll wrap it manually to be safe or use component={Link} with to={item.url}.
             */}
						{/* <span className='truncate flex-1'>{item.title || item.name}</span> */}
					</Link>
					{/* Wait, AMMenuItem renders the content. Let's try passing component={Link} and href/to prop. Next Link uses href. RR uses to. */}
					<Link to={item.url || '#'} className={`flex items-center w-full h-full text-inherit no-underline`}>
						<span className='truncate flex-1'>{item.title || item.name}</span>
					</Link>
				</AMMenuItem>
			</div>
		);
	});
};

// Re-implementing render because AMMenuItem structure is specific.
// Admin Dashboard used:
// <AMMenuItem ... component={Link} className=... > <span>...</span> </AMMenuItem>
// Next.js Link passes href.
// React Router Link needs `to`.
// If AMMenuItem passes other props down, it might break.
// Let's assume AMMenuItem renders a `li` or `div` and we put Link inside? 
// Or it renders the component we pass. 
// If it renders the component, we need to pass `to` prop.
// Check Admin usage: link={item.url}.
// I will try mapping `link` to `to` via a wrapper or just use `to`.

const renderSidebarItemsRR = (
	items: any[],
	currentPath: string,
	onClose?: () => void,
	isSubItem: boolean = false
) => {
	return items.map((item, index) => {
		const isSelected = currentPath === item?.url;
		const IconComp = item.icon || null;

		const iconElement = IconComp ? (
			<Icon icon={IconComp} height={21} width={21} />
		) : (
			<Icon icon={'ri:checkbox-blank-circle-line'} height={9} width={9} />
		);

		if (item.heading) {
			return (
				<div className='mb-1' key={item.heading}>
					<AMMenu
						subHeading={item.heading}
						ClassName='hide-menu leading-21 text-charcoal font-bold uppercase text-xs dark:text-darkcharcoal'
					/>
				</div>
			);
		}

		if (item.children?.length) {
			return (
				<AMSubmenu
					key={item.id}
					icon={iconElement}
					title={item.name}
					ClassName='mt-0.5 text-link dark:text-darklink'>
					{renderSidebarItemsRR(item.children, currentPath, onClose, true)}
				</AMSubmenu>
			);
		}

		const itemClassNames = isSubItem
			? `mt-0.5 text-link dark:text-darklink !hover:bg-transparent ${isSelected ? '!bg-transparent !text-[#0CCF0E]' : ''
			} !px-1.5`
			: `mt-0.5 text-link dark:text-darklink ${isSelected ? '!bg-[#0CCF0E] !text-white rounded-md' : 'hover:bg-lightprimary/20 rounded-md'}`;

		return (
			<div onClick={onClose} key={index}>
				{/* AMMenuItem logic for React Router */}
				{/* We use a custom Div wrapper to handle the click/selection style, and Link inside */}
				<div className={itemClassNames}>
					<Link to={item.url} className="flex items-center gap-3 py-2 px-3 w-full h-full">
						{iconElement}
						<span className='truncate flex-1'>{item.title || item.name}</span>
					</Link>
				</div>
			</div>
		);
	});
};


const Sidebar = ({ onClose }: { onClose?: () => void }) => {
	const location = useLocation();
	const currentPath = location.pathname;
	// const [mounted, setMounted] = useState(false);

	// useEffect(() => {
	//   setMounted(true);
	// }, []);

	// if (!mounted) {
	//   return <div className="fixed left-0 top-0 border-r border-border dark:border-darkborder bg-white dark:bg-dark z-10 h-screen w-[270px]" />;
	// }

	return (
		<div className='fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 z-10 h-screen w-[270px] flex flex-col'>
			{/* Logo */}
			<div className='px-6 h-[70px] flex items-center border-b-[1px] border-transparent'>
				<Link to='/'>
					<FullLogo />
				</Link>
			</div>

			{/* Sidebar items */}
			<SimpleBar className='flex-1'>
				<div className='px-6 py-4'>
					{SidebarContent.map((section, index) => (
						<div key={index}>
							{renderSidebarItemsRR(
								[
									...(section.heading ? [{ heading: section.heading }] : []),
									...(section.children || []),
								],
								currentPath,
								onClose
							)}
						</div>
					))}
				</div>
			</SimpleBar>
		</div>
	);
};

export default Sidebar;


import _ from 'lodash';
const { uniqueId } = _;

export interface ChildItem {
	id?: number | string;
	name?: string;
	icon?: any;
	children?: ChildItem[];
	item?: any;
	url?: any;
	color?: string;
	disabled?: boolean;
	subtitle?: string;
	badge?: boolean;
	badgeType?: string;
	isPro?: boolean;
}

export interface MenuItem {
	heading?: string;
	name?: string;
	icon?: any;
	id?: number | string;
	to?: string;
	items?: MenuItem[];
	children?: ChildItem[];
	url?: any;
	disabled?: boolean;
	subtitle?: string;
	badgeType?: string;
	badge?: boolean;
	isPro?: boolean;
}

const SidebarContent: MenuItem[] = [
	{
		heading: 'Home',
		children: [
			{
				name: 'Dashboard',
				icon: 'solar:widget-2-linear',
				id: uniqueId(),
				url: '/',
			},
		],
	},
	{
		heading: 'Support',
		children: [
			{
				name: 'Tickets',
				icon: 'solar:chat-round-line-linear',
				id: uniqueId(),
				url: '/tickets',
			},
			{
				name: 'Customers',
				icon: 'solar:user-circle-linear',
				id: uniqueId(),
				url: '/customers',
			},
		],
	},
	{
		heading: 'Knowledge Base',
		children: [
			{
				name: 'Articles',
				icon: 'solar:file-text-linear',
				id: uniqueId(),
				url: '/articles',
			},
		],
	},
];

export default SidebarContent;

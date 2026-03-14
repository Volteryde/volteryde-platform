
import _ from 'lodash';
import type { SupportRole } from '../../RequireAuth';

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

// CUSTOMER_SUPPORT: external-facing — end-user tickets, customer accounts, knowledge base
const CUSTOMER_SUPPORT_SIDEBAR: MenuItem[] = [
	{
		heading: 'Home',
		children: [
			{ name: 'Dashboard', icon: 'solar:widget-2-linear', id: uniqueId(), url: '/' },
		],
	},
	{
		heading: 'Customer Support',
		children: [
			{ name: 'Tickets', icon: 'solar:chat-round-line-linear', id: uniqueId(), url: '/tickets' },
			{ name: 'Customers', icon: 'solar:user-circle-linear', id: uniqueId(), url: '/customers' },
		],
	},
	{
		heading: 'Knowledge Base',
		children: [
			{ name: 'Articles', icon: 'solar:file-text-linear', id: uniqueId(), url: '/articles' },
		],
	},
];

// SYSTEM_SUPPORT: internal-facing — driver issues, incident reports, internal tools
const SYSTEM_SUPPORT_SIDEBAR: MenuItem[] = [
	{
		heading: 'Home',
		children: [
			{ name: 'Dashboard', icon: 'solar:widget-2-linear', id: uniqueId(), url: '/' },
		],
	},
	{
		heading: 'Driver Support',
		children: [
			{ name: 'Driver Issues', icon: 'solar:user-hands-linear', id: uniqueId(), url: '/driver-issues' },
			{ name: 'Incidents', icon: 'solar:danger-triangle-linear', id: uniqueId(), url: '/incidents' },
		],
	},
	{
		heading: 'Internal Tools',
		children: [
			{ name: 'Fleet Status', icon: 'solar:bus-linear', id: uniqueId(), url: '/fleet-status' },
			{ name: 'System Logs', icon: 'solar:list-linear', id: uniqueId(), url: '/system-logs' },
		],
	},
	{
		heading: 'Knowledge Base',
		children: [
			{ name: 'Articles', icon: 'solar:file-text-linear', id: uniqueId(), url: '/articles' },
		],
	},
];

// ADMIN/SUPER_ADMIN: full visibility — everything from both support roles
const ADMIN_SIDEBAR: MenuItem[] = [
	{
		heading: 'Home',
		children: [
			{ name: 'Dashboard', icon: 'solar:widget-2-linear', id: uniqueId(), url: '/' },
		],
	},
	{
		heading: 'Customer Support',
		children: [
			{ name: 'Tickets', icon: 'solar:chat-round-line-linear', id: uniqueId(), url: '/tickets' },
			{ name: 'Customers', icon: 'solar:user-circle-linear', id: uniqueId(), url: '/customers' },
		],
	},
	{
		heading: 'Driver Support',
		children: [
			{ name: 'Driver Issues', icon: 'solar:user-hands-linear', id: uniqueId(), url: '/driver-issues' },
			{ name: 'Incidents', icon: 'solar:danger-triangle-linear', id: uniqueId(), url: '/incidents' },
		],
	},
	{
		heading: 'Internal Tools',
		children: [
			{ name: 'Fleet Status', icon: 'solar:bus-linear', id: uniqueId(), url: '/fleet-status' },
			{ name: 'System Logs', icon: 'solar:list-linear', id: uniqueId(), url: '/system-logs' },
		],
	},
	{
		heading: 'Knowledge Base',
		children: [
			{ name: 'Articles', icon: 'solar:file-text-linear', id: uniqueId(), url: '/articles' },
		],
	},
];

export function getSidebarForRole(role: SupportRole | null): MenuItem[] {
	switch (role) {
		case 'SUPER_ADMIN':
		case 'ADMIN':
			return ADMIN_SIDEBAR;
		case 'SYSTEM_SUPPORT':
			return SYSTEM_SUPPORT_SIDEBAR;
		case 'CUSTOMER_SUPPORT':
		default:
			return CUSTOMER_SUPPORT_SIDEBAR;
	}
}

// Default export kept for backward compatibility
const SidebarContent: MenuItem[] = CUSTOMER_SUPPORT_SIDEBAR;
export default SidebarContent;

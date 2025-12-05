import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';

export const baseOptions = (): BaseLayoutProps => ({
  nav: {
    title: 'VolteRyde Driver',
  },
  links: [
    {
      text: 'Dashboard',
      url: '/dashboard',
      active: 'nested-url',
    },
    {
      text: 'Documentation',
      url: '/docs',
      active: 'nested-url',
    },
  ],
});

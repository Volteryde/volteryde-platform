interface ProfileType {
  title: string;
  subtitle: string;
  icon: string;
  url: string;
}

const profileDD: ProfileType[] = [
  {
    title: "My Profile",
    subtitle: "Account settings",
    icon: "tabler:user",
    url: "/profile",
  },
];

const Notifications: any[] = [];

export { Notifications, profileDD };

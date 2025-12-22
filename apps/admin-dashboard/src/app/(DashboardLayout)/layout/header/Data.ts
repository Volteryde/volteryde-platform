
import { IconUser, IconMail, IconListCheck, IconProps, Icon } from '@tabler/icons-react';

//  Profile Data
interface ProfileType {
  title: string;
  img: any;
  subtitle: string;
  url: string;
  icon: string
}


const profileDD: ProfileType[] = [
  {
    img: "/images/svgs/icon-account.svg",
    title: "My Profile",
    subtitle: "Account settings",
    icon: "tabler:user",
    url: "/user-profile",
  },
];

const Notifications: any[] = [];

export {
  Notifications,
  profileDD,
};

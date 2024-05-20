import { Role } from './user'

export type UserSessionData = {
  user_detail: {
    role: Role;
    user_lid: number;
    username: string;
    last_name: string;
    first_name: string;
  };
  accessible_url: AccessibleUrl[];
};

type AccessibleUrl = {
  url: string;
  icon: string;
  label: string;
	module: string | null
};
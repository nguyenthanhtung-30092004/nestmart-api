import { Role } from '../enums/role.enum';

export interface IUser {
  id: number;
  email: string;
  fullName: string;
  role: Role;
  avatar?: string;
}

export enum ROLES {
  SA = 'sa',
  ADMIN = 'admin',
  USER = 'user',
  VISITOR = 'visitor',
  BANNED = 'banned',
}

export const ADMINS = [ROLES.SA, ROLES.ADMIN];

export const USERS = [ROLES.SA, ROLES.ADMIN, ROLES.USER];
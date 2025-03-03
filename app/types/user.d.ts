export interface IUser {
  id: string;
  fullName?: string;
  email: string;
  password: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string;
  readonly created_at?: Date;
  readonly updated_at?: Date;
}

export interface IUserCreate {
  fullName?: string;
  email: string;
  password: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string;
}

export interface IUserUpdate {
  fullName?: string;
  email?: string;
  password?: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string;
}

export interface ISocialLoginPayload {
  provider: string;
  token: string;
  profile: {
    id: string;
    email: string;
    name?: string;
    picture?: string;
  };
}

export interface IAuthResponse {
  status: number;
  message: string;
  data: {
    user: IUser;
    token: string;
  };
}

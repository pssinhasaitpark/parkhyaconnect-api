export interface IUser {
  id: string;
  fullName?: string;
  email: string;
  password: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string| null;
  readonly created_at?: Date;
  readonly updated_at?: Date;
}

export interface IUserCreate {
  fullName?: string;
  email: string;
  password: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string| null;
}

export interface IUserUpdate {
  fullName?: string;
  email?: string;
  password?: string;
  mobileNumber?: string;
  socialId?: string;
  avatar?: string| null;
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

export interface Message {
  id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  senderId: string;
  receiverId: string;
  isPrivate: boolean;
  sender: User;
  receiver: User;
}

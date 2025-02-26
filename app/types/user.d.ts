export interface IUser {
    id: string;
    name: string;
    email: string;
    password: string;
    created_at?: Date;
    updated_at?: Date;
  }
  
  export interface IUserCreate {
    name: string;
    email: string;
    password: string;
  }
  
  export interface IUserUpdate {
    name?: string;
    email?: string;
  }
  
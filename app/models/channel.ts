export interface Channel {
  id: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  createdBy: string;
  created_at: Date;
  updated_at: Date;
}

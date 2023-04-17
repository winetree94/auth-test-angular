export interface ChannelMessageData<T> {
  nonce?: string;
  key: string;
  data: T;
}

export interface SwitAccount {
  userId: string;
  userEmail: string;
  companyId: string;
  accessToken: string;
  refreshToken: string;
}

export interface URLCreateArgument {
  userId: string;
  url: string;
}


export interface GET_URL {
  userId: string;
  offset: number;
  limit: number;
}

export interface GET_URL_BY_ID {
  id: string;
  userId: string;
}

export type ReturnUrl = {
  id: string;
  url: string;
};

export type RootStackParamList = {
  MainTabs: undefined;
  login: undefined;
  otherLogin: undefined;
  agreement: { type: 'userSure' | 'privates' };
  cardDetail: { id: string | number; userId?: string | number };
  editCard: { id?: string | number };
  addItem: { itemId?: string | number; cardId?: string | number; userId?: string | number; pjId?: string | number };
  richTextEdit: { initialHtml?: string; placeholder?: string };
  publish: undefined;
  publishCover: { videoUri: string; ratio?: '3:4' | '16:9'; title?: string };
  companyPage: { id: string | number; userId?: string | number };
  certification: { openIndex?: number };
};

export type MainTabParamList = {
  home: undefined;
  my: undefined;
};

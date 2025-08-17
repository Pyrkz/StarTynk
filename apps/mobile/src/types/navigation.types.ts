export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
  Order: undefined;
  OrderHistory: undefined;
  OrderDetail: { order: any };
  WorkDetail: { workId: string };
  WorkArchive: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Orders: undefined;
  Work: undefined;
  Profile: undefined;
};

export type OrderStackParamList = {
  Ordering: undefined;
  ProductDetail: { product: any };
  Cart: undefined;
};

export type AppStackParamList = RootStackParamList & AuthStackParamList & MainTabParamList & OrderStackParamList;
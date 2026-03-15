export interface TabItem {
  path: string;
  title: string;
  name: string;
  closable: boolean;
}

export interface RouteMeta {
  title: string;
  icon?: string;
  keepAlive?: boolean;
}

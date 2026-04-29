export interface TabItem {
  path: string;
  title: string;
  name: string;
  componentName?: string; // Vue component name for keep-alive matching
  closable: boolean;
}

export interface RouteMeta {
  title: string;
  icon?: string;
  keepAlive?: boolean;
  componentName?: string;
}

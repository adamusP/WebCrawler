export type WebPageGraphql = {
  identifier: string;
  label: string;
  url: string;
  regexp: string;
  tags: string[];
  active: boolean;
};

export type NodeGraphql = {
  title: string | null;
  url: string;
  crawlTime: string | null;
  links: NodeGraphql[];
  owner: WebPageGraphql[];
};

export interface LegalSection {
  heading: string
  paragraphs: string[]
}

export interface LegalDoc {
  key: 'terms' | 'privacy'
  title: string
  version: string
  updatedAt: string
  sections: LegalSection[]
}

/** 协议正文待补，页面结构先行；补内容时只改这里，不改页面 */
export const legalDocs: Record<'terms' | 'privacy', LegalDoc> = {
  terms: {
    key: 'terms',
    title: '用户协议',
    version: 'v0.1（草稿）',
    updatedAt: '2026-11-09',
    sections: [],
  },
  privacy: {
    key: 'privacy',
    title: '隐私政策',
    version: 'v0.1（草稿）',
    updatedAt: '2026-11-09',
    sections: [],
  },
}

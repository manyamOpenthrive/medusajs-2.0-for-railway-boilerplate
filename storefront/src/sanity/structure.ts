import type { ListBuilder } from 'sanity/desk' // optional, for better autocomplete

export type StructureResolver = (S: any) => any

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items(S.documentTypeListItems())

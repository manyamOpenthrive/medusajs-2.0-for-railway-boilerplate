/* The code snippet is importing specific icons (TagIcon, FolderIcon, DocumentIcon) from the
"@sanity/icons" package and the DocumentDefinition type from the "sanity" package in TypeScript.
These imports allow the code to use these icons and the DocumentDefinition type in the document
schema definition for a collection in a Sanity Studio project. */
import { SchemaPluginOptions } from "sanity"
import { productSchema } from "./documents/product"
import { collectionSchema } from "./documents/collection"
import { categorySchema } from "./documents/category"
import { productTypeSchema } from "./documents/productType"

export const schema: SchemaPluginOptions = {
  types: [productSchema, collectionSchema, categorySchema, productTypeSchema],
  templates: (templates) => templates.filter(
    (template) => template.schemaType !== "product"
  ),
}
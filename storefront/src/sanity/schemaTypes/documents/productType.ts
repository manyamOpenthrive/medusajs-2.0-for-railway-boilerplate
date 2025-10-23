import { TagIcon, FolderIcon, DocumentIcon } from "@sanity/icons"
import { DocumentDefinition } from "sanity"
// Product Type Schema
export const productTypeSchema: DocumentDefinition = {
    name: "productType",
    title: "Product Type",
    type: "document",
    // @ts-ignore
    icon: DocumentIcon,
    fields: [
        {
            name: "value",
            title: "Type Name",
            type: "string",
            validation: (Rule) => Rule.required(),
            description: "e.g., Shirt, Shoes, Accessory, Electronics",
        },
        {
            name: "description",
            title: "Description",
            type: "text",
            rows: 2,
        },
    ],
    preview: {
        select: {
            title: "value",
            subtitle: "description",
        },
    },
}

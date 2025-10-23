import { TagIcon, FolderIcon, DocumentIcon } from "@sanity/icons"
import { DocumentDefinition } from "sanity"

// Collection Schema
export const collectionSchema: DocumentDefinition = {
    name: "collection",
    title: "Collection",
    type: "document",
    // @ts-ignore
    icon: FolderIcon,
    fields: [
        {
            name: "title",
            title: "Title",
            type: "string",
            validation: (Rule) => Rule.required(),
        },
        {
            name: "handle",
            title: "Handle (Slug)",
            type: "slug",
            options: {
                source: "title",
                maxLength: 96,
            },
            validation: (Rule) => Rule.required(),
        },
        {
            name: "description",
            title: "Description",
            type: "text",
            rows: 3,
        },
        {
            name: "image",
            title: "Collection Image",
            type: "image",
            options: {
                hotspot: true,
            },
            fields: [
                {
                    name: "alt",
                    title: "Alt Text",
                    type: "string",
                },
            ],
        },
        {
            name: "metadata",
            title: "Metadata",
            type: "object",
            fields: [
                {
                    name: "metaTitle",
                    title: "Meta Title",
                    type: "string",
                },
                {
                    name: "metaDescription",
                    title: "Meta Description",
                    type: "text",
                    rows: 3,
                },
            ],
        },
    ],
    preview: {
        select: {
            title: "title",
            media: "image",
        },
    },
}

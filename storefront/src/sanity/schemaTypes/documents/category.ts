import { TagIcon, FolderIcon, DocumentIcon } from "@sanity/icons"
import { DocumentDefinition } from "sanity"
// Category Schema
export const categorySchema: DocumentDefinition = {
    name: "category",
    title: "Category",
    type: "document",
    // @ts-ignore
    icon: TagIcon,
    fields: [
        {
            name: "name",
            title: "Category Name",
            type: "string",
            validation: (Rule) => Rule.required(),
        },
        {
            name: "handle",
            title: "Handle (Slug)",
            type: "slug",
            options: {
                source: "name",
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
            name: "parent",
            title: "Parent Category",
            type: "reference",
            to: [{ type: "category" }],
            description: "Leave empty for top-level category",
        },
        {
            name: "image",
            title: "Category Image",
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
            name: "isActive",
            title: "Active",
            type: "boolean",
            initialValue: true,
        },
        {
            name: "rank",
            title: "Sort Order",
            type: "number",
            description: "Lower numbers appear first",
        },
    ],
    preview: {
        select: {
            title: "name",
            media: "image",
            parent: "parent.name",
        },
        prepare({ title, media, parent }) {
            return {
                title,
                subtitle: parent ? `Child of: ${parent}` : "Top-level category",
                media,
            }
        },
    },
}
import { TagIcon } from "@sanity/icons"
import { DocumentDefinition } from "sanity"

export const productSchema: DocumentDefinition = {
    name: "product",
    title: "Product",
    type: "document",
    icon: TagIcon,
    fields: [
        {
            name: "title",
            title: "Title",
            type: "string",
            validation: (Rule) => Rule.required(),
            description: "Synced from Medusa"
        },
        {
            name: "subtitle",
            title: "Subtitle",
            type: "string",
            description: "Synced from Medusa"
        },
        {
            name: "description",
            title: "Description",
            type: "text",
            rows: 4,
            description: "Synced from Medusa"
        },
        {
            name: "handle",
            title: "Slug/Handle",
            type: "slug",
            description: "Synced from Medusa",
            options: {
                source: "title",
                maxLength: 96,
            },
        },
        {
            name: "status",
            title: "Status",
            type: "string",
            options: {
                list: [
                    { title: "Draft", value: "draft" },
                    { title: "Published", value: "published" },
                    { title: "Proposed", value: "proposed" },
                    { title: "Rejected", value: "rejected" },
                ],
            },
            description: "Synced from Medusa"
        },

        // EDITABLE IMAGES - These will NOT be overwritten by Medusa sync
        {
            name: "thumbnail",
            title: "Thumbnail",
            type: "image",
            description: "Main product thumbnail - Edit here in Sanity",
            options: {
                hotspot: true,
            },
            fields: [
                {
                    name: "alt",
                    title: "Alt Text",
                    type: "string",
                }
            ]
        },
        {
            name: "images",
            title: "Product Images",
            type: "array",
            description: "Product gallery - Edit here in Sanity",
            of: [
                {
                    type: "image",
                    options: {
                        hotspot: true,
                    },
                    fields: [
                        {
                            name: "alt",
                            title: "Alt Text",
                            type: "string",
                        }
                    ]
                }
            ],
        },

        // EDITABLE REFERENCES - Managed only in Sanity
        {
            name: "type",
            title: "Product Type",
            type: "reference",
            to: [{ type: "productType" }],
            description: "Managed in Sanity - will not be overwritten by sync",
        },
        {
            name: "collection",
            title: "Collection",
            type: "reference",
            to: [{ type: "collection" }],
            description: "Managed in Sanity - will not be overwritten by sync",
        },
        {
            name: "categories",
            title: "Categories",
            type: "array",
            of: [
                {
                    type: "reference",
                    to: [{ type: "category" }],
                }
            ],
            description: "Managed in Sanity - will not be overwritten by sync",
        },

        // Product attributes synced from Medusa
        {
            name: "material",
            title: "Material",
            type: "string",
            description: "Synced from Medusa"
        },
        {
            name: "origin_country",
            title: "Origin Country",
            type: "string",
            description: "Synced from Medusa"
        },
        {
            name: "hs_code",
            title: "HS Code",
            type: "string",
            description: "Synced from Medusa"
        },
        {
            name: "mid_code",
            title: "MID Code",
            type: "string",
            description: "Synced from Medusa"
        },
        {
            name: "discountable",
            title: "Discountable",
            type: "boolean",
            description: "Synced from Medusa"
        },
        {
            name: "is_giftcard",
            title: "Is Gift Card",
            type: "boolean",
            description: "Synced from Medusa"
        },

        // Variants
        {
            name: "variants",
            title: "Variants",
            type: "array",
            description: "Synced from Medusa",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "title", type: "string", title: "Title" },
                        { name: "sku", type: "string", title: "SKU" },
                        { name: "barcode", type: "string", title: "Barcode" },
                        { name: "ean", type: "string", title: "EAN" },
                        { name: "upc", type: "string", title: "UPC" },
                        { name: "allow_backorder", type: "boolean", title: "Allow Backorder" },
                        { name: "manage_inventory", type: "boolean", title: "Manage Inventory" },
                        { name: "requires_shipping", type: "boolean", title: "Requires Shipping" },
                        { name: "weight", type: "number", title: "Weight" },
                        { name: "length", type: "number", title: "Length" },
                        { name: "height", type: "number", title: "Height" },
                        { name: "width", type: "number", title: "Width" },
                        { name: "hs_code", type: "string", title: "HS Code" },
                        { name: "origin_country", type: "string", title: "Origin Country" },
                        { name: "mid_code", type: "string", title: "MID Code" },
                        { name: "material", type: "string", title: "Material" },
                        {
                            name: "options",
                            type: "array",
                            title: "Options",
                            of: [
                                {
                                    type: "object",
                                    fields: [
                                        { name: "option", type: "string", title: "Option" },
                                        { name: "value", type: "string", title: "Value" },
                                    ]
                                }
                            ]
                        }
                    ],
                    preview: {
                        select: {
                            title: "title",
                            sku: "sku",
                        },
                        prepare({ title, sku }) {
                            return {
                                title: title || "Unnamed Variant",
                                subtitle: sku ? `SKU: ${sku}` : "No SKU",
                            }
                        },
                    },
                }
            ],
        },

        // Product Options
        {
            name: "options",
            title: "Options",
            type: "array",
            description: "Synced from Medusa",
            of: [
                {
                    type: "object",
                    fields: [
                        { name: "title", type: "string", title: "Option Name" },
                        {
                            name: "values",
                            type: "array",
                            title: "Values",
                            of: [{ type: "string" }]
                        }
                    ]
                }
            ]
        },

        // Tags
        {
            name: "tags",
            title: "Tags",
            type: "array",
            of: [{ type: "string" }],
            description: "Synced from Medusa",
            options: {
                layout: "tags"
            }
        },

        // Specifications
        {
            name: "specs",
            title: "Specifications",
            type: "array",
            of: [
                {
                    type: "object",
                    name: "spec",
                    fields: [
                        { name: "title", type: "string", title: "Title" },
                        { name: "lang", type: "string", title: "Language" },
                        { name: "content", type: "text", title: "Content" },
                    ]
                }
            ],
            description: "Synced from Medusa"
        },

        // SEO
        {
            name: "seo",
            title: "SEO",
            type: "object",
            description: "Synced from Medusa",
            fields: [
                {
                    name: "metaTitle",
                    type: "string",
                    title: "Meta Title"
                },
                {
                    name: "metaDescription",
                    type: "text",
                    title: "Meta Description",
                    rows: 3
                },
                {
                    name: "keywords",
                    type: "array",
                    title: "Keywords",
                    of: [{ type: "string" }]
                }
            ]
        },

        // Dimensions
        {
            name: "weight",
            title: "Weight",
            type: "number",
            description: "Synced from Medusa"
        },
        {
            name: "length",
            title: "Length",
            type: "number",
            description: "Synced from Medusa"
        },
        {
            name: "height",
            title: "Height",
            type: "number",
            description: "Synced from Medusa"
        },
        {
            name: "width",
            title: "Width",
            type: "number",
            description: "Synced from Medusa"
        },

        // External ID
        {
            name: "external_id",
            title: "External ID",
            type: "string",
            description: "Synced from Medusa"
        },
    ],
    preview: {
        select: {
            title: "title",
            subtitle: "subtitle",
            media: "thumbnail",
        },
    },
}
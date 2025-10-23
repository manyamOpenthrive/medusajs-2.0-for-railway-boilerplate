import {
    createClient,
    SanityClient,
    FirstDocumentMutationOptions,
} from "@sanity/client"
import { Logger } from "@medusajs/framework/types"
import { ProductDTO } from "@medusajs/framework/types"

const SyncDocumentTypes = {
    PRODUCT: "product",
} as const

type SyncDocumentTypes =
    (typeof SyncDocumentTypes)[keyof typeof SyncDocumentTypes]

type ModuleOptions = {
    api_token: string
    project_id: string
    api_version: string
    dataset: "production" | "development"
    type_map?: Record<SyncDocumentTypes, string>
    studio_url?: string
}

type SyncDocumentInputs<T> = T extends "product"
    ? ProductDTO
    : never

type TransformationMap<T> = Record<
    SyncDocumentTypes,
    (data: SyncDocumentInputs<T>) => any | Promise<any>
>

type InjectedDependencies = {
    logger: Logger
}

class SanityModuleService {
    protected client: SanityClient
    protected studioUrl?: string
    protected logger: Logger
    private typeMap: Record<SyncDocumentTypes, string>
    private createTransformationMap: TransformationMap<SyncDocumentTypes>
    private updateTransformationMap: TransformationMap<SyncDocumentTypes>

    constructor(
        { logger }: InjectedDependencies,
        options: ModuleOptions
    ) {
        this.client = createClient({
            projectId: options.project_id,
            apiVersion: options.api_version,
            dataset: options.dataset,
            token: options.api_token,
            useCdn: false,
        })
        this.logger = logger

        this.logger.info("Connected to Sanity")

        this.studioUrl = options.studio_url

        this.typeMap = Object.assign(
            {},
            {
                [SyncDocumentTypes.PRODUCT]: "product",
            },
            options.type_map || {}
        )

        this.createTransformationMap = {
            [SyncDocumentTypes.PRODUCT]: this.transformProductForCreate,
        }

        this.updateTransformationMap = {
            [SyncDocumentTypes.PRODUCT]: this.transformProductForUpdate,
        }
    }

    /**
     * Upload image from URL to Sanity
     */
    private async uploadImageFromUrl(imageUrl: string, filename?: string): Promise<any> {
        try {
            // Fetch the image
            const response = await fetch(imageUrl);

            if (!response.ok) {
                this.logger.warn(`Failed to fetch image: ${imageUrl}`);
                return null;
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'image/jpeg';

            // Upload to Sanity
            const asset = await this.client.assets.upload('image', buffer, {
                filename: filename || this.getFilenameFromUrl(imageUrl),
                contentType
            });

            return {
                _type: 'image',
                asset: {
                    _type: 'reference',
                    _ref: asset._id
                }
            };
        } catch (error) {
            this.logger.error(`Error uploading image to Sanity: ${imageUrl}`, error);
            return null;
        }
    }

    /**
     * Extract filename from URL
     */
    private getFilenameFromUrl(url: string): string {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const filename = pathname.split('/').pop() || 'image.jpg';
            return filename;
        } catch {
            return 'image.jpg';
        }
    }
    /**
     * Fields that should be preserved from Sanity and never overwritten by Medusa sync
     * These are managed exclusively in Sanity Studio
     */
    private SANITY_MANAGED_FIELDS = [
        'type',           // Product type reference
        'collection',     // Collection reference
        'categories',     // Categories array
        'thumbnail',      // Product thumbnail - managed in Sanity
        'images',         // Product images - managed in Sanity
        // Add any other fields you want to manage only in Sanity
    ];
    /**
 * Transform product for update - Preserves Sanity-managed fields
 * This is the key fix: we merge Medusa data with existing Sanity data
 */
    private transformProductForUpdate = async (product: ProductDTO) => {
        this.logger.info(`Transforming product for update: ${product.title}`);

        // CRITICAL: Fetch existing document to preserve Sanity-managed fields
        const existingDoc = await this.client.getDocument(product.id).catch(() => null);

        // Upload thumbnail if changed
        let thumbnail = undefined;
        if (product.thumbnail) {
            thumbnail = await this.uploadImageFromUrl(
                product.thumbnail,
                `${product.handle}-thumb`
            );
        }

        // Upload product images if changed
        const images: any[] = [];
        if (product.images && product.images.length > 0) {
            for (let i = 0; i < product.images.length; i++) {
                const img = product.images[i];
                const uploadedImage = await this.uploadImageFromUrl(
                    img.url,
                    `${product.handle}-${i + 1}`
                );
                if (uploadedImage) {
                    images.push(uploadedImage);
                }
            }
        }

        // Build update data with only Medusa-sourced fields
        const updateData: any = {
            title: product.title || "",
            subtitle: product.subtitle || null,
            description: product.description || null,
            status: product.status || "draft",
            material: product.material || null,
            origin_country: product.origin_country || null,
            hs_code: product.hs_code || null,
            mid_code: product.mid_code || null,
            discountable: product.discountable ?? true,
            is_giftcard: product.is_giftcard || false,
            handle: product.handle ? {
                _type: "slug",
                current: product.handle
            } : null,

            // Variants with full details
            variants: product.variants?.map(variant => ({
                _type: "object",
                _key: variant.id,
                title: variant.title || "",
                sku: variant.sku || null,
                barcode: variant.barcode || null,
                ean: variant.ean || null,
                upc: variant.upc || null,
                allow_backorder: variant.allow_backorder || false,
                manage_inventory: variant.manage_inventory || true,
                requires_shipping: variant.requires_shipping || true,
                weight: variant.weight || null,
                length: variant.length || null,
                height: variant.height || null,
                width: variant.width || null,
                hs_code: variant.hs_code || null,
                origin_country: variant.origin_country || null,
                mid_code: variant.mid_code || null,
                material: variant.material || null,
                options: variant.options?.map(opt => ({
                    _type: "object",
                    _key: opt.id,
                    option: opt.option?.title || opt.option_id || "",
                    value: opt.value
                })) || [],
            })) || [],

            // Product Options
            options: product.options?.map(option => ({
                _type: "object",
                _key: option.id,
                title: option.title,
                values: option.values?.map(v => v.value) || []
            })) || [],

            // Tags (simple values, not references)
            tags: product.tags?.map(tag => tag.value) || [],

            // Specs
            specs: [
                {
                    _key: product.id,
                    _type: "spec",
                    title: product.title,
                    lang: "en",
                    content: product.description || "",
                },
            ],

            // SEO
            seo: {
                _type: "object",
                metaTitle: product.metadata?.meta_title || product.title || null,
                metaDescription: product.metadata?.meta_description || product.description || null,
                keywords: product.metadata?.keywords || []
            },

            // Dimensions
            weight: product.weight || null,
            length: product.length || null,
            height: product.height || null,
            width: product.width || null,

            // External ID
            external_id: product.external_id || null,
        };

        // Add images if uploaded
        if (thumbnail) {
            updateData.thumbnail = thumbnail;
        }
        if (images.length > 0) {
            updateData.images = images;
        }

        // CRITICAL: Preserve Sanity-managed fields from existing document
        if (existingDoc) {
            this.SANITY_MANAGED_FIELDS.forEach(field => {
                if (existingDoc[field] !== undefined) {
                    // Preserve the existing value from Sanity
                    updateData[field] = existingDoc[field];
                }
            });

            this.logger.info(`Preserved Sanity-managed fields for ${product.title}: ${this.SANITY_MANAGED_FIELDS.join(', ')}`);
        }

        return {
            set: updateData,
        };
    }

    /**
     * Transform product for creation - Sets references to null initially
     */
    private transformProductForCreate = async (product: ProductDTO) => {
        this.logger.info(`Transforming product for create: ${product.title}`);

        // Upload thumbnail
        let thumbnail = null;
        if (product.thumbnail) {
            this.logger.info(`Uploading thumbnail for: ${product.title}`);
            thumbnail = await this.uploadImageFromUrl(
                product.thumbnail,
                `${product.handle}-thumb`
            );
        }

        // Upload product images
        const images: any[] = [];
        if (product.images && product.images.length > 0) {
            this.logger.info(`Uploading ${product.images.length} images for: ${product.title}`);
            for (let i = 0; i < product.images.length; i++) {
                const img = product.images[i];
                const uploadedImage = await this.uploadImageFromUrl(
                    img.url,
                    `${product.handle}-${i + 1}`
                );
                if (uploadedImage) {
                    images.push(uploadedImage);
                }
            }
        }

        return {
            _type: this.typeMap[SyncDocumentTypes.PRODUCT],
            _id: product.id,
            title: product.title || "",
            subtitle: product.subtitle || null,
            description: product.description || null,
            handle: product.handle ? {
                _type: "slug",
                current: product.handle
            } : null,
            status: product.status || "draft",
            material: product.material || null,
            origin_country: product.origin_country || null,
            hs_code: product.hs_code || null,
            mid_code: product.mid_code || null,
            discountable: product.discountable ?? true,
            is_giftcard: product.is_giftcard || false,
            thumbnail,
            images,

            // Variants with full details
            variants: product.variants?.map(variant => ({
                _type: "object",
                _key: variant.id,
                title: variant.title || "",
                sku: variant.sku || null,
                barcode: variant.barcode || null,
                ean: variant.ean || null,
                upc: variant.upc || null,
                allow_backorder: variant.allow_backorder || false,
                manage_inventory: variant.manage_inventory || true,
                requires_shipping: variant.requires_shipping || true,
                weight: variant.weight || null,
                length: variant.length || null,
                height: variant.height || null,
                width: variant.width || null,
                hs_code: variant.hs_code || null,
                origin_country: variant.origin_country || null,
                mid_code: variant.mid_code || null,
                material: variant.material || null,
                options: variant.options?.map(opt => ({
                    _type: "object",
                    _key: opt.id,
                    option: opt.option?.title || opt.option_id || "",
                    value: opt.value
                })) || [],
            })) || [],

            // Product Options
            options: product.options?.map(option => ({
                _type: "object",
                _key: option.id,
                title: option.title,
                values: option.values?.map(v => v.value) || []
            })) || [],

            // IMPORTANT: Initialize Sanity-managed fields as null/empty
            // These will be set by editors in Sanity Studio
            collection: null,
            categories: [],
            type: null,

            // Tags
            tags: product.tags?.map(tag => tag.value) || [],

            // Specifications
            specs: [
                {
                    _key: product.id,
                    _type: "spec",
                    title: product.title,
                    lang: "en",
                    content: product.description || "",
                },
            ],

            // SEO
            seo: {
                _type: "object",
                metaTitle: product.metadata?.meta_title || product.title || null,
                metaDescription: product.metadata?.meta_description || product.description || null,
                keywords: product.metadata?.keywords || []
            },

            // Weight and dimensions
            weight: product.weight || null,
            length: product.length || null,
            height: product.height || null,
            width: product.width || null,

            // External ID
            external_id: product.external_id || null,
        };
    }

    async upsertSyncDocument<T extends SyncDocumentTypes>(
        type: T,
        data: SyncDocumentInputs<T>
    ) {
        const existing = await this.client.getDocument(data.id).catch(() => null);
        if (existing) {
            return await this.updateSyncDocument(type, data);
        }

        return await this.createSyncDocument(type, data);
    }

    async createSyncDocument<T extends SyncDocumentTypes>(
        type: T,
        data: SyncDocumentInputs<T>,
        options?: FirstDocumentMutationOptions
    ) {
        const doc = await this.createTransformationMap[type](data);
        return await this.client.create(doc, options);
    }

    async updateSyncDocument<T extends SyncDocumentTypes>(
        type: T,
        data: SyncDocumentInputs<T>
    ) {
        const operations = await this.updateTransformationMap[type](data);
        return await this.client.patch(data.id, operations).commit();
    }

    async retrieve(id: string) {
        return this.client.getDocument(id);
    }

    async delete(id: string) {
        return this.client.delete(id);
    }

    async update(id: string, data: any) {
        return await this.client.patch(id, {
            set: data,
        }).commit();
    }

    async list(
        filter: {
            id: string | string[]
        }
    ) {
        const data = await this.client.getDocuments(
            Array.isArray(filter.id) ? filter.id : [filter.id]
        );

        return data.map((doc) => ({
            id: doc?._id,
            ...doc,
        }));
    }

    async getStudioLink(
        type: string,
        id: string,
        config: { explicit_type?: boolean } = {}
    ) {
        const resolvedType = config.explicit_type ? type : this.typeMap[type];
        if (!this.studioUrl) {
            throw new Error("No studio URL provided");
        }
        return `${this.studioUrl}/structure/${resolvedType};${id}`;
    }
}

export default SanityModuleService
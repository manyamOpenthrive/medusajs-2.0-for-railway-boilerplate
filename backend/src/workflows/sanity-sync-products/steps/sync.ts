import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { ProductDTO } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, promiseAll } from "@medusajs/framework/utils";
import SanityModuleService from "../../../modules/sanity/service";
import { SANITY_MODULE } from "../../../modules/sanity";

export type SyncStepInput = {
    product_ids?: string[];
}

export const syncStep = createStep(
    { name: "sync-step", async: true },
    async (input: SyncStepInput, { container }) => {
        const sanityModule: SanityModuleService = container.resolve(SANITY_MODULE);
        const query = container.resolve(ContainerRegistrationKeys.QUERY)

        let total = 0;
        const compensationData: {
            action: 'create' | 'update' | 'none',
            documentId: string,
            previousState?: any
        }[] = []

        const batchSize = 200;
        let hasMore = true;
        let offset = 0;
        let filters = input.product_ids ? {
            id: input.product_ids
        } : {}

        while (hasMore) {
            const result = await query.graph({
                entity: "product",
                fields: [
                    "id",
                    "title",
                    "subtitle",
                    "description",
                    "handle",
                    "status",
                    "material",
                    "discountable",
                    "is_giftcard",
                    "origin_country",
                    "hs_code",
                    "mid_code",
                    "external_id",
                    "thumbnail",
                    "weight",
                    "length",
                    "height",
                    "width",
                    "images.*",
                    "variants.*",
                    "variants.options.*",
                    "variants.options.option.*",
                    "options.*",
                    "options.values.*",
                    "collection.*",
                    "categories.*",
                    "type.*",
                    "tags.*",
                    "metadata",
                    "sanity_product.*"
                ],
                filters,
                pagination: {
                    skip: offset,
                    take: batchSize,
                    order: {
                        id: "ASC",
                    },
                },
            });

            const products = result?.data ?? [];
            const count = result?.metadata?.count ?? 0;

            try {
                await promiseAll(
                    products.map(async (prod) => {
                        // Check if document already exists in Sanity
                        const existingDoc = await sanityModule.retrieve(prod.id).catch(() => null);

                        const after = await sanityModule.upsertSyncDocument(
                            "product",
                            prod as ProductDTO
                        );

                        // Store minimal compensation data
                        compensationData.push({
                            action: existingDoc ? 'update' : 'create',
                            documentId: prod.id,
                            // Only store critical fields for rollback, not the entire document
                            previousState: existingDoc ? {
                                _id: existingDoc._id,
                                _rev: existingDoc._rev,
                            } : undefined
                        })

                        return after
                    }),
                )
            } catch (e) {
                return StepResponse.permanentFailure(
                    `An error occurred while syncing documents: ${e}`,
                    compensationData
                )
            }

            offset += batchSize;
            hasMore = offset < count;
            total += products.length;
        }

        return new StepResponse({ total }, compensationData);
    },
    async (compensationData, { container }) => {
        if (!compensationData || compensationData.length === 0) {
            return
        }

        const sanityModule: SanityModuleService = container.resolve(SANITY_MODULE);

        // IMPORTANT: Only revert if this was an actual failure, not a normal sync
        // In most cases, you DON'T want to revert successful syncs
        // This compensate function should only run on workflow failures

        await promiseAll(
            compensationData.map(({ action, documentId, previousState }) => {
                // Only delete if this was a CREATE action and it failed
                if (action === 'create' && !previousState) {
                    return sanityModule.delete(documentId).catch(err => {
                        // Ignore deletion errors in compensation
                        console.warn(`Failed to delete ${documentId} during compensation:`, err)
                    })
                }

                // For updates, we don't roll back because:
                // 1. The user may have made manual edits in Sanity
                // 2. Rolling back could lose user work
                // 3. The next sync will correct any issues

                return Promise.resolve()
            })
        )
    }
);
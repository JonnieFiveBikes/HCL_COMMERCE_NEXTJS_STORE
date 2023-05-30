/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import {
	ATTR_PICKUP_IN_STORE,
	STRING_TRUE,
	USAGE_DEFINING,
	USAGE_DESCRIPTIVE,
} from '@/data/constants/catalog';
import {
	ResponseProductType,
	ProductType,
	Ribbon,
	ResponseProductAttribute,
	Attachment,
	ProductAttribute,
	ProductAttributeValue,
} from '@/data/types/Product';
import { getProductPrice } from '@/data/utils/getProductPrice';
import { ribbonSorter, transformAttrValsToRibbons } from '@/data/utils/getRibbonAdAttrs';

type AttributesReduced = {
	colorSwatches: ProductAttributeValue[];
	ribbons: Ribbon[];
	descriptiveAttributes: ProductAttribute[];
	definingAttributes: ProductAttribute[];
};
const mapAttachment = (a: Attachment) => ({
	...a,
	mimeType: /^https?:\/\//.test(a.attachmentAssetPath)
		? 'content/url'
		: a.mimeType || 'content/unknown',
});

/**
 * Private helper to flat the attribute value entry array to array of object
 * e.g. id: [..], identifier: [..] to {id, identifier, ...} array
 * @param attribute
 * @returns an attribute with flatten value.
 */
const processAttribute = (attribute: ResponseProductAttribute): ProductAttribute => {
	const { values = [], ...rest } = attribute;
	return {
		...rest,
		values: values.flatMap((v) => {
			const keys = Object.keys(v) as (keyof ProductAttributeValue)[];
			return !Array.isArray(v.id)
				? [
						Object.assign(
							{
								attributeIdentifier: attribute.identifier,
							},
							v
						) as ProductAttributeValue,
				  ]
				: v.id.map((_id, index) => ({
						...keys.reduce(
							(previous, key) =>
								Object.assign(previous, {
									[key]: Array.isArray(v[key]) ? v[key]?.at(index) : v[key],
								}),
							{} as ProductAttributeValue
						),
						attributeIdentifier: attribute.identifier,
				  }));
		}),
	};
};

export const mapProductData = (product: ResponseProductType): ProductType => {
	const { items, attachments } = product;
	const productPrice = getProductPrice(product);
	const productAttributeInit: AttributesReduced = {
		colorSwatches: [],
		ribbons: [],
		descriptiveAttributes: [],
		definingAttributes: [],
	};
	const { colorSwatches, ribbons, descriptiveAttributes, definingAttributes } = (
		product?.attributes || []
	).reduce(
		(previousValue: AttributesReduced, currentProductAttribute: ResponseProductAttribute) => {
			if (currentProductAttribute.usage === USAGE_DEFINING) {
				const attributeProcessed = processAttribute(currentProductAttribute);
				previousValue.definingAttributes.push(attributeProcessed);
				if (currentProductAttribute.values?.at(0)?.image1path) {
					previousValue.colorSwatches.push(...attributeProcessed.values);
				}
			} else if (currentProductAttribute.usage === USAGE_DESCRIPTIVE) {
				// descriptive attribute values seem to be always singular
				if (
					currentProductAttribute.displayable &&
					currentProductAttribute.identifier !== ATTR_PICKUP_IN_STORE &&
					currentProductAttribute.storeDisplay !== STRING_TRUE
				) {
					previousValue.descriptiveAttributes.push(currentProductAttribute as ProductAttribute);
				}
				if (currentProductAttribute.storeDisplay === 'true' && currentProductAttribute.values) {
					transformAttrValsToRibbons(
						previousValue.ribbons,
						currentProductAttribute as ProductAttribute
					);
				}
			}
			return previousValue;
		},
		productAttributeInit
	);
	ribbons.sort(ribbonSorter);
	return {
		...product,
		ribbons,
		productPrice,
		colorSwatches,
		descriptiveAttributes,
		definingAttributes,
		...(items && { items: items.map(mapProductData) }),
		...(attachments && { attachments: attachments.map(mapAttachment) }),
	};
};

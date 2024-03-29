/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { FacetNavigationPriceRangePicker } from '@/components/content/FacetNavigation/parts/PriceRangePicker';
import { useFacetNavigation } from '@/data/Content/FacetNavigation';
import { PriceDisplay } from '@/components/blocks/PriceDisplay';
import { Chip } from '@mui/material';
import { ContentContext } from '@/data/context/content';
import { FC, useCallback, useContext } from 'react';

export const FacetNavigationPrice: FC = () => {
	const { filteredParams, onPriceRangeChange } = useContext(ContentContext) as ReturnType<
		typeof useFacetNavigation
	>;
	const { minPrice = -1, maxPrice = -1 } = filteredParams;
	const onDelete = useCallback(
		() => onPriceRangeChange({ minPrice: null, maxPrice: null }),
		[onPriceRangeChange]
	);

	// TODO: Get currency from facet/product
	return minPrice > -1 && maxPrice > -1 ? (
		<Chip
			size="medium"
			label={<PriceDisplay min={minPrice} max={maxPrice} />}
			onClick={onDelete}
			onDelete={onDelete}
			data-testid="product-filter-formatted-price-chip"
			id="product-filter-formatted-price-chip"
		/>
	) : (
		<FacetNavigationPriceRangePicker />
	);
};

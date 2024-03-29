/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import useSWR, { unstable_serialize as unstableSerialize } from 'swr';
import { getSettings, useSettings } from '@/data/Settings';
import { ProductFacetEntry, ProductQueryResponse, ResponseProductType } from '@/data/types/Product';
import { productFetcher, PRODUCT_DATA_KEY } from '@/data/Content/_Product';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { ID } from '@/data/types/Basic';
import { ContentProps } from '@/data/types/ContentProps';
import { extractContentsArray } from '@/data/utils/extractContentsArray';
import { mapProductData } from '@/data/utils/mapProductData';
import { getProductListQueryParameters } from '@/data/utils/getProductListQueryParameters';
import { SelectChangeEvent } from '@mui/material';
import { extractFacetsArray } from '@/data/utils/extractFacetsArray';
import { mapFacetEntryData } from '@/data/utils/mapFacetData';
import { union } from 'lodash';
import { SORT_OPTIONS } from '@/data/constants/catalog';
import { getIdFromPath } from '@/data/utils/getIdFromPath';
import { getLocalization, useLocalization } from '@/data/Localization';
import { useNextRouter } from '@/data/Content/_NextRouter';
import { laggyMiddleWare } from '@/data/utils/laggyMiddleWare';
import { constructRequestParamsWithPreviewToken } from '@/data/utils/constructRequestParams';
import { useExtraRequestParameters } from '@/data/Content/_ExtraRequestParameters';
import { getClientSideCommon } from '@/data/utils/getClientSideCommon';
import { getServerSideCommon } from '@/data/utils/getServerSideCommon';

const DATA_KEY = PRODUCT_DATA_KEY;

const fetcher = productFetcher;

const dataMap = (data?: ProductQueryResponse) =>
	(extractContentsArray(data) as ResponseProductType[]).map(mapProductData);

const facetEntryDataMap = (data?: ProductQueryResponse) =>
	extractFacetsArray(data).map(mapFacetEntryData).flat(1);

export const getCatalogEntryList = async ({
	cache,
	id,
	context,
}: ContentProps): Promise<
	{
		key: string;
		value: ProductQueryResponse;
	}[]
> => {
	const settings = await getSettings(cache, context);
	const {
		storeId,
		langId,
		defaultCurrency: currency,
		defaultCatalogId: catalogId,
	} = getServerSideCommon(settings, context);
	await Promise.all([
		await getLocalization(cache, context.locale || 'en-US', 'ProductGrid'),
		await getLocalization(cache, context.locale || 'en-US', 'ProductFilter'),
		await getLocalization(cache, context.locale || 'en-US', 'compare'),
		await getLocalization(cache, context.locale || 'en-US', 'PriceDisplay'),
		await getLocalization(cache, context.locale || 'en-US', 'CommerceEnvironment'),
	]);

	const filteredParams = getProductListQueryParameters(context.query);
	const RoutesLocalization = await getLocalization(cache, context.locale || 'en-US', 'Routes');
	const path = getIdFromPath(context.query.path, settings.storeToken);
	const profileName =
		path === RoutesLocalization.Search?.route
			? 'HCL_V2_findProductsBySearchTermWithPrice'
			: 'HCL_V2_findProductsByCategoryWithPriceRange';
	const props = {
		...filteredParams,
		storeId,
		categoryId: [String(id)],
		catalogId,
		profileName,
		langId,
		currency,
	};
	const key = unstableSerialize([props, DATA_KEY]);
	const params = constructRequestParamsWithPreviewToken({ context });
	const value = cache.get(key) || fetcher(false)(props, params);
	cache.set(key, value);

	return [
		{
			key,
			value: await value,
		},
	];
};

export const useCatalogEntryList = (id: ID) => {
	const { settings } = useSettings();
	const router = useNextRouter();
	const {
		storeId,
		langId,
		defaultCatalogId: catalogId,
		defaultCurrency: currency,
	} = getClientSideCommon(settings, router);
	const { query } = router;
	const params = useExtraRequestParameters();
	const filteredParams = useMemo(() => getProductListQueryParameters(query), [query]);
	const SearchLocalization = useLocalization('Routes').Search;
	const path = getIdFromPath(query.path, settings.storeToken);
	const profileName =
		path === SearchLocalization.route.t()
			? 'HCL_V2_findProductsBySearchTermWithPrice'
			: 'HCL_V2_findProductsByCategoryWithPriceRange';
	const { data, error } = useSWR(
		storeId
			? [
					{
						...filteredParams,
						storeId,
						categoryId: [String(id)],
						catalogId,
						profileName,
						langId,
						currency,
					},
					DATA_KEY,
			  ]
			: null,
		async ([props]) => fetcher(true)(props, params),
		{ use: [laggyMiddleWare] }
	);
	const [facetEntries, setFacetEntries] = useState<ProductFacetEntry[]>(() =>
		facetEntryDataMap(data)
	);

	const total = useMemo(() => data?.total, [data]);

	const selectedFacet = useMemo(
		() => (query.facet ? (Array.isArray(query.facet) ? query.facet : [query.facet]) : []),
		[query.facet]
	);

	const onSortOptionChange = useCallback(
		(event: SelectChangeEvent<string>, _child: ReactNode) => {
			const orderBy = event.target.value;
			const { orderBy: _orderBy, limit, ...newQuery } = filteredParams; // use query instead to respect other params?
			const pathname = router.asPath.split('?').at(0);

			if (orderBy !== '0') {
				Object.assign(newQuery, { orderBy });
			}
			router.push({ pathname, query: newQuery }, undefined, {
				shallow: true,
			});
		},
		[filteredParams, router]
	);

	const onPageChange = useCallback(
		(page: number) => {
			const { limit, ...newQuery } = filteredParams; // use query instead to respect other params?
			const offset = (page - 1) * limit;
			const pathname = router.asPath.split('?').at(0);
			Object.assign(newQuery, { offset });
			router.push({ pathname, query: newQuery }, undefined, {
				shallow: true,
			});
		},
		[filteredParams, router]
	);

	const onPriceSelectionDelete = useCallback(() => {
		const { minPrice: _min, maxPrice: _max, limit, ...newQuery } = filteredParams;
		const pathname = router.asPath.split('?').at(0);
		router.push({ pathname, query: newQuery }, undefined, {
			shallow: true,
		});
	}, [filteredParams, router]);

	const onFacetDelete = useCallback(
		(facetValue: string) => () => {
			const { facet, limit, ...newQuery } = filteredParams;
			const pathname = router.asPath.split('?').at(0);
			const index = selectedFacet.indexOf(facetValue);
			const newFacet = [...selectedFacet];
			index > -1 && newFacet.splice(index, 1);
			if (newFacet.length > 0) {
				Object.assign(newQuery, { facet: newFacet });
			}
			router.push({ pathname, query: newQuery }, undefined, {
				shallow: true,
			});
		},
		[filteredParams, router, selectedFacet]
	);

	const onDeleteAll = useCallback(() => {
		const { minPrice, maxPrice, facet, path, ...newQuery } = query;
		const pathname = router.asPath.split('?').at(0);
		router.push({ pathname, query: newQuery }, undefined, {
			shallow: true,
		});
	}, [query, router]);

	const selectedSortOption = useMemo(
		() =>
			Array.isArray(filteredParams.orderBy)
				? filteredParams.orderBy.at(0)
				: filteredParams.orderBy ?? SORT_OPTIONS.defaultSortOptions[0].value,
		[filteredParams]
	);
	const sortOptions = useMemo(
		() =>
			String(data?.metaData?.price) === '1'
				? SORT_OPTIONS.defaultSortOptions.concat(SORT_OPTIONS.priceSortOptions)
				: SORT_OPTIONS.defaultSortOptions,
		[data?.metaData?.price]
	);

	const pageCount = useMemo(() => {
		if (total !== undefined) {
			return Math.ceil(total / filteredParams.limit);
		} else {
			return null;
		}
	}, [filteredParams.limit, total]);

	const pageNumber = useMemo(
		() => filteredParams.offset / filteredParams.limit + 1,
		[filteredParams.offset, filteredParams.limit]
	);

	useEffect(() => {
		if (pageCount) {
			if (pageNumber > pageCount) {
				onPageChange(pageCount);
			}
		}
	}, [onPageChange, pageCount, pageNumber]);

	useEffect(() => {
		setFacetEntries((facetEntries) => {
			const _facetEntries = union(facetEntries, facetEntryDataMap(data));
			return _facetEntries.length !== facetEntries.length ? _facetEntries : facetEntries;
		});
	}, [data]);

	return {
		products: dataMap(data),
		total,
		selectedSortOption,
		facetEntries,
		sortOptions,
		loading: !error && !data,
		error,
		selectedFacet,
		filteredParams,
		pageCount,
		pageNumber,
		onSortOptionChange,
		onPriceSelectionDelete,
		onFacetDelete,
		onDeleteAll,
		onPageChange,
	};
};

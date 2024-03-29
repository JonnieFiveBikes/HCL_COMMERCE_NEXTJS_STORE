/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { getProduct } from '@/data/Content/Product';
import {
	ESpotContainerType,
	getESpotDataFromName,
	useESpotDataFromName,
} from '@/data/Content/_ESpotDataFromName';
import { MARKETING_SPOT_DATA_TYPE } from '@/data/constants/marketing';
import { ContentProps } from '@/data/types/ContentProps';
import { getMarketingDataWithEvent } from '@/data/utils/getMarketingEventFromESpot';
import { transactionsEvent } from 'integration/generated/transactions';
import { useCallback, useMemo } from 'react';
import { ID } from '@/data/types/Basic';
import { useSettings } from '@/data/Settings';
import { useExtraRequestParameters } from '@/data/Content/_ExtraRequestParameters';

const dataMap = (spots?: ESpotContainerType): string =>
	spots?.MarketingSpotData?.at(0)?.baseMarketingSpotActivityData?.at(0)?.productPartNumber || '';

export const getFeaturedProductRecommendation = async ({
	cache,
	id: _id,
	context,
	properties,
}: ContentProps) => {
	const spot = await getESpotDataFromName(cache, properties?.emsName ?? '', context);
	const productPartNumber = dataMap(spot);
	await getProduct(cache, productPartNumber, context);
};

export const useFeaturedProductRecommendation = (emsName: ID) => {
	const { settings } = useSettings();
	const params = useExtraRequestParameters();
	const { data, error, loading } = useESpotDataFromName(emsName);
	const partNumber = useMemo(() => dataMap(data), [data]);
	const productEvent = useMemo(
		() =>
			getMarketingDataWithEvent(data, [
				MARKETING_SPOT_DATA_TYPE.CATALOG_ENTRY,
				MARKETING_SPOT_DATA_TYPE.CATALOG_ENTRY_ID,
			])?.at(0),
		[data]
	);
	const clickAction = useCallback(() => {
		if (productEvent?.event) {
			transactionsEvent(true).eventHandleClickInfo(
				settings?.storeId ?? '',
				undefined,
				productEvent.event,
				params
			);
		}
	}, [params, productEvent, settings]);
	return {
		partNumber,
		clickAction,
		loading,
		error,
	};
};

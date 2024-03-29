/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { getSettings, Settings } from '@/data/Settings';
import { ID } from '@/data/types/Basic';
import { CategoryType } from '@/data/types/Category';
import { extractContentsArray } from '@/data/utils/extractContentsArray';
import { unstable_serialize as unstableSerialize } from 'swr';
import { queryV2CategoryResource } from 'integration/generated/query';
import { GetServerSidePropsContext } from 'next';
import { RequestParams } from 'integration/generated/query/http-client';
import { Cache } from '@/data/types/Cache';
import { constructRequestParamsWithPreviewToken } from '@/data/utils/constructRequestParams';
import { getContractIdParamFromContext } from '@/data/utils/getContractIdParamFromContext';
import { getUser } from '@/data/User';
import { UserContext } from '@/data/types/UserContext';

export const DATA_KEY = 'Category';

export const fetcher =
	(pub: boolean) =>
	/**
	 * The data fetcher for Category
	 * @param query The request query.
	 * @param params The RequestParams, it contains all the info that a request needed except for 'body' | 'method' | 'query' | 'path'.
	 *                                  we are using it to send cookie header.
	 * @returns Fetched Category data.
	 */
	async (
		query: {
			storeId: string;
			[key: string]: string | boolean | ID | ID[];
		},
		params: RequestParams
	): Promise<CategoryType[] | undefined> => {
		try {
			return extractContentsArray(
				await queryV2CategoryResource(pub).getV2CategoryResources(query, params)
			);
		} catch (error) {
			console.log(error);
			return undefined;
		}
	};

/**
 * Invoke category API based on input lookup parameters
 * @param cache
 * @param lookupParams
 * @param context
 * @returns
 */
export const getCategoryExtended = async (
	cache: Cache,
	lookupParams: Record<string, ID | ID[]>,
	context: GetServerSidePropsContext
) => {
	const settings = await getSettings(cache, context);
	const user = await getUser(cache, context);
	const key = getCategoryCacheKey(lookupParams, settings, user.context);
	const query = getCategoryFetchPayload(lookupParams, settings, user.context);
	const params = constructRequestParamsWithPreviewToken({ context });
	const value = cache.get(key) ?? fetcher(false)(query, params);
	cache.set(key, value);
	return (await value) as CategoryType[] | undefined;
};

/**
 * Fetching one category
 * @param cache
 * @param id
 * @returns
 */
export const getCategory = async (cache: Cache, id: ID, context: GetServerSidePropsContext) => {
	const value = await getCategoryExtended(cache, { id }, context);
	return value?.at(0);
};

export const parseChildCategoryId = (category: CategoryType | undefined) =>
	category?.links?.children
		?.map((childLink: string) => childLink.split('&').at(-1)?.split('=').at(-1) ?? '')
		.filter(Boolean) ?? [];

/**
 * Cache and put category by id query into SWR fallback
 * @param map C
 * @param categories
 * @returns
 */
export const cacheCategories = (
	cache: Cache,
	categories: CategoryType[] | undefined,
	settings: Settings,
	userContext: UserContext | undefined
) => {
	const recursively = [...(categories ?? [])];

	// we want to avoid blowing up the stack, so we iterate instead of recursing
	//   note: this still doesn't necessarily prevent a heap blowup
	// eslint-disable-next-line functional/no-loop-statement
	for (const category of recursively) {
		const key = getCategoryCacheKey({ id: category.uniqueID }, settings, userContext);
		cache.set(key, Promise.resolve([category]));
		if (category.children?.length) {
			recursively.push(...category.children);
		}
	}
};

export const getCategoryFetchPayload = (
	params: Record<string, ID | ID[]>,
	settings: Settings,
	userCtx: UserContext | undefined
) => ({
	storeId: settings.storeId,
	...params,
	...getContractIdParamFromContext(userCtx),
	langId: settings?.defaultLanguage,
});

const getCategoryCacheKey = (
	params: Record<string, ID | ID[]>,
	settings: Settings,
	userCtx: UserContext | undefined
) => unstableSerialize([getCategoryFetchPayload(params, settings, userCtx), DATA_KEY]);

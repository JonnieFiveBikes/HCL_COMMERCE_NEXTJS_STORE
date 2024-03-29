/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { GetServerSidePropsContext } from 'next';
import { getMeta } from '@/data/Meta';
import { getLayout } from '@/data/Layout';
import { getContent } from '@/data/Content';
import { getMapPromiseValues } from '@/utils/getMapPromiseValues';
import { logger } from '@/logging/logger';
import { Cache } from '@/data/types/Cache';
import { constructRedirectURLParameters } from '@/utils/constructRedirectURLParameters';
import { omit, pick } from 'lodash';

type GetProps = {
	context: GetServerSidePropsContext;
	cache: Cache;
};

export const getPageProps = async ({ context, cache }: GetProps) => {
	// Prevent missing assets from being included in page lookup.
	// if the last part of the path includes a dot, it's a file.
	logger.trace(
		'Processing the request ' + context.resolvedUrl + ' from ' + context.req.socket.remoteAddress
	);
	if (context.query.path?.at(-1)?.includes('.')) return { notFound: true, props: {} };
	const layout = await getLayout(cache, context.query.path, context);
	if (layout.redirect) {
		return {
			redirect: {
				destination: layout.redirect + '?' + constructRedirectURLParameters({ context }),
				permanent: false,
			},
		};
	}
	if (!layout.value) {
		// url response with an empty array means not found.
		return {
			notFound: true,
			props: {},
		};
	}

	const header = (Object.values(pick(layout.processed?.slots, 'header')) ?? []).flat(1);
	const others = (Object.values(omit(layout.processed?.slots, 'header')) ?? []).flat(1);

	// try to do the header first -- the navbar fetch can help cache some categories
	await Promise.all(
		header.map(
			async ({ id, name, properties }) => await getContent(name, { cache, id, context, properties })
		)
	);
	await Promise.all(
		others.map(
			async ({ id, name, properties }) => await getContent(name, { cache, id, context, properties })
		)
	);
	await getMeta(cache, context.query.path, context);

	return {
		props: {
			fallback: await getMapPromiseValues(cache),
		},
	};
};

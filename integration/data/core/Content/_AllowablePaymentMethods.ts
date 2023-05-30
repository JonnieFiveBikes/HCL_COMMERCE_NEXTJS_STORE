/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { useSettings } from '@/data/Settings';
import { transactionsCart } from 'integration/generated/transactions';

import { RequestParams } from 'integration/generated/transactions/http-client';
import { get } from 'lodash';
import useSWR from 'swr';
import { ID } from '@/data/types/Basic';
import { ComIbmCommercePaymentBeansPaymentPolicyListDataBeanIBMPaymentPolicyListDetailed } from 'integration/generated/transactions/data-contracts';
import { UNSUPPORTED_PAYMENTS_CHECKOUT_PROFILES } from '@/data/constants/unsupportedPayments';
import { useExtraRequestParameters } from '@/data/Content/_ExtraRequestParameters';
import { useNextRouter } from '@/data/Content/_NextRouter';
import { getClientSideCommon } from '@/data/utils/getClientSideCommon';

const DATA_KEY = 'ALLOWABLE_PAYMENT_POLICY_LIST';

const allowablePaymentMethodsDataMap = ({
	resultList = [],
}: ComIbmCommercePaymentBeansPaymentPolicyListDataBeanIBMPaymentPolicyListDetailed) =>
	get(resultList[0], 'paymentPolicyInfoUsableWithoutTA', []).filter(
		(payment) => !UNSUPPORTED_PAYMENTS_CHECKOUT_PROFILES.includes(payment.policyName ?? '')
	);

const allowablePaymentMethodsFetcher =
	(pub: boolean) =>
	async (
		storeId: string,
		query: {
			[key: string]: string | boolean | ID[] | number;
		},
		params: RequestParams
	) =>
		allowablePaymentMethodsDataMap(
			await transactionsCart(pub).cartGetPaymentPolicyListDataBean(storeId, query, params)
		);

export const useAllowablePaymentMethods = () => {
	const { settings } = useSettings();
	const params = useExtraRequestParameters();
	const router = useNextRouter();
	const { storeId, langId } = getClientSideCommon(settings, router);
	const { data, error } = useSWR(
		storeId ? [{ storeId, query: { langId } }, DATA_KEY] : null,
		async ([props]) => allowablePaymentMethodsFetcher(true)(props.storeId, props.query, params)
	);

	return {
		loading: !error && !data,
		error,
		allowablePaymentMethods: data,
	};
};

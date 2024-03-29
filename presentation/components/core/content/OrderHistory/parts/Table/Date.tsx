/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { FC, useContext, useMemo } from 'react';
import { Typography } from '@mui/material';
import { ContentContext } from '@/data/context/content';
import { useLocalization } from '@/data/Localization';
import { ORDER_STATUS } from '@/data/constants/order';
import { OrderHistoryTableRowValueType } from '@/components/content/OrderHistory/parts/Table';
import { useNextRouter } from '@/data/Content/_NextRouter';

export const OrderHistoryTableDate: FC = () => {
	const router = useNextRouter();
	const labels = useLocalization('Order');
	const { order } = useContext(ContentContext) as OrderHistoryTableRowValueType;
	const locale = useMemo(() => router.locale ?? router.defaultLocale, [router]);
	const formatter = useMemo(
		() =>
			new Intl.DateTimeFormat(locale, {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			}),
		[locale]
	);

	return (
		<Typography data-testid="order-date" id="order-date">
			{order?.placedDate
				? formatter.format(new Date(order?.placedDate))
				: order?.orderStatus === ORDER_STATUS.ApprovalDenied
				? labels.NotAvailable.t()
				: labels.Pending.t()}
		</Typography>
	);
};

/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { shippingMultiShipmentTableAlertSX } from '@/components/content/CheckOut/styles/Shipping/multiShipmentTable/alert';
import { shippingMultiShipmentTableToolbarSX } from '@/components/content/CheckOut/styles/Shipping/multiShipmentTable/toolbar';
import { useCheckOut } from '@/data/Content/CheckOut';
import { useShipping } from '@/data/Content/Shipping';
import { useLocalization } from '@/data/Localization';
import { MULTIPLE_SHIPMENT_ID_PREFIX } from '@/data/constants/shipping';
import { ContentContext } from '@/data/context/content';
import { Alert, Button, Toolbar, Typography } from '@mui/material';
import { FC, useCallback, useContext } from 'react';

export const ShippingMultiShipmentTableToolbar: FC<{
	selectedItemIds: string[];
}> = ({ selectedItemIds }) => {
	const multipleShipmentTableNLS = useLocalization('MultipleShipmentTable');
	const { setSelectedItems, orderItems, showError } = useContext(ContentContext) as ReturnType<
		typeof useCheckOut
	> &
		ReturnType<typeof useShipping>;
	const onClick = useCallback(() => {
		setSelectedItems(orderItems.filter(({ orderItemId }) => selectedItemIds.includes(orderItemId)));
	}, [orderItems, selectedItemIds, setSelectedItems]);

	return (
		<Toolbar
			sx={shippingMultiShipmentTableToolbarSX(selectedItemIds.length > 0)}
			id={`${MULTIPLE_SHIPMENT_ID_PREFIX}-toolbar`}
			data-testid={`${MULTIPLE_SHIPMENT_ID_PREFIX}-toolbar`}
		>
			{selectedItemIds.length > 0 ? (
				<>
					<Typography variant="subtitle1" component="div" m={1}>
						{multipleShipmentTableNLS.Labels.nItemsSel.t({ n: selectedItemIds.length })}
					</Typography>
					<Button
						id={`${MULTIPLE_SHIPMENT_ID_PREFIX}-toolbar`}
						data-testid={`${MULTIPLE_SHIPMENT_ID_PREFIX}-toolbar-group-select-shipping-address`}
						variant="contained"
						onClick={onClick}
					>
						{multipleShipmentTableNLS.Labels.SelectShippingAddressAndMethod.t()}
					</Button>
				</>
			) : showError ? (
				<Alert variant="outlined" severity="error" sx={shippingMultiShipmentTableAlertSX}>
					{multipleShipmentTableNLS.Msgs.MissingSelection.t()}
				</Alert>
			) : (
				<Typography variant="h6" component="div">
					{multipleShipmentTableNLS.Labels.OrderItems.t({ n: orderItems.length })}
				</Typography>
			)}
		</Toolbar>
	);
};

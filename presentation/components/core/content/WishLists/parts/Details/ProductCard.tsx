/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { Card } from '@/components/blocks/Card';
import { PriceDisplay } from '@/components/blocks/PriceDisplay';
import { wishListDetailsProductCardSX } from '@/components/content/WishLists/styles/details/productCard';
import { useWishListDetails } from '@/data/Content/_WishListDetails';
import { useLocalization } from '@/data/Localization';
import { Box, Stack, Typography } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { ProductType } from '@/data/types/Product';
import { FC, useContext } from 'react';
import { ContentContext } from '@/data/context/content';
import { MuiCardMedia } from '@/components/blocks/MuiCardMedia';

export const WishListDetailsProductCard: FC<{ product: ProductType }> = ({ product }) => {
	const localization = useLocalization('WishList');
	const { selection, toggle, getCardActions } = useContext(ContentContext) as ReturnType<
		typeof useWishListDetails
	>;
	const { productPrice: price } = product;

	const cardMain = (
		<>
			{selection.selected[product.partNumber] ? (
				<Box sx={{ position: 'absolute' }}>
					<CheckCircle color="primary" />
				</Box>
			) : null}
			<Stack alignItems="center">
				<MuiCardMedia
					image={product.thumbnail}
					sx={{ width: '120px', height: '120px' }}
					role="presentation"
				/>
				<Typography align="center">{product.name}</Typography>
				<Typography align="center" color="primary">
					<PriceDisplay min={price?.min ?? 0} currency={price.currency} />
				</Typography>
			</Stack>
		</>
	);

	return (
		<Card
			testId={`wishlist-${product.partNumber}`}
			extraSX={[wishListDetailsProductCardSX(selection.selected[product.partNumber])]}
			onCardArea={toggle(product)}
			cardMain={cardMain}
			actions={getCardActions(product)}
			confirmLabel={localization.Confirm.t()}
			cancelLabel={localization.Cancel.t()}
		/>
	);
};

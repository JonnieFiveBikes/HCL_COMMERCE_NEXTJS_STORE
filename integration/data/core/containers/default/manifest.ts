/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { defaultContainerLayoutManifestCustom } from '@/data/containers/default/manifestCustom';
import { DefaultContainerLayout } from '@/data/types/ContainerLayout';
import CategoryLandingPage from '@/data/containers/default/CategoryLandingPage';
import HomePage from '@/data/containers/default/HomePage';
import ProductPage from '@/data/containers/default/ProductPage';
import ProductListingPage from '@/data/containers/default/ProductListingPage';
import SearchPage from '@/data/containers/default/SearchPage';
import CartPage from '@/data/containers/default/CartPage';
import CheckOutPage from '@/data/containers/default/CheckOutPage';
import OrderConfirmationPage from '@/data/containers/default/OrderConfirmationPage';

export const defaultContainerLayoutManifest: {
	[pageType: string]: DefaultContainerLayout;
} = {
	CheckOutPage,
	OrderConfirmationPage,
	CartPage,
	CategoryPage: CategoryLandingPage,
	ProductListPage: ProductListingPage,
	SearchPage,
	HomePage,
	ProductPage,
	ItemPage: ProductPage,
	...defaultContainerLayoutManifestCustom,
};

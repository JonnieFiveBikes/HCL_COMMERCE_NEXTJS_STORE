/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

export const LAYOUT_MAP: {
	[key: string]: 'DoubleStack' | 'TripleStack' | 'Aside' | 'AsideExtended';
} = {
	HomePageLayout: 'DoubleStack',
};

export const SLOT_MAP: {
	[key: string]: string;
} = {
	first: '1',
	second: '2',
	third: '3',
	fourth: '4',
};

export const PAGE_TOKEN_NAME_CATEGORY = 'CategoryToken';

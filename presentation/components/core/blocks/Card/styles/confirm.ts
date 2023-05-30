/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { SxProps } from '@mui/material';
import { Theme } from '@mui/system';

export const confirmSX: SxProps<Theme> = (theme) => ({
	backgroundColor: `${theme.palette.background.paper}${theme.palette.background.transparency}`,
	position: 'absolute',
	bottom: 0,
	height: '70%',
	width: '100%',
});

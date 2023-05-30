/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { ThemeOptions } from '@mui/material/styles';

export const palette: ThemeOptions = {
	palette: {
		primary: {
			main: '#93101c',
			dark: '#660b13',
			light: '#fbdde0',
			contrastText: '#ffffff',
		},
		secondary: {
			main: '#926b6f',
			light: '#1ec79f',
			dark: '#007055',
			contrastText: '#ffffff',
		},
		text: {
			main: '#43484d',
			primary: '#43484d',
			secondary: '#5e6977',
			disabled: '#b5beca',
			highlight: '#93101c',
			alert: '#c10c0d',
			expandedMenu: '#ffffff',
		},
		base: {
			main: '#43484d',
			contrastText: '#ffffff',
		},
		action: {
			active: '#cccccc',
			hover: '#f0f4f7',
			disabled: '#75767a',
			disabledBackground: '#ddcfcf',
		},
		background: {
			main: '#fdfdfc',
			default: '#fafafb',
			paper: '#ffffff',
			transparency: 'cc', // used to combine hex colors with transparency (00-ff), e.g., #ffffffcc
			contrastText: '#43484d',
		},
		divider: '#ebebea',
		border: {
			dark: '#4c5256',
			alert: '#c10c0d',
			footer: '#888',
		},
		textField: {
			border: '#660b13',
			borderHovered: '#3a060b',
			background: '#fdfdfd',
			disabledBackground: '#ddcfcf',
		},
		button: {
			primary: '#2c0408',
			primaryHover: '#580911',
			secondary: '#ffffff',
			secondaryHover: '#fff4f4',
			contrastText: '#fdfdfd',
			disabled: '#ddcfcf',
			disabledText: '#a1a5ab',
		},
	},
} as ThemeOptions;

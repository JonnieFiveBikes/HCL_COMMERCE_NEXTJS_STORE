/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import path from 'path';
import nextConfig from '../../next.config';
import { generateApiFromSpecs } from './generateApiFromSpecs';
import { generateLocalization } from './generateLocalization';
const localesDirectory = path.resolve(__dirname, '../locales');
const supportedLocales = nextConfig.i18n || {
	locales: [],
	defaultLocale: '',
};
const specsDirectory = path.resolve(__dirname, '../specs');
const generatedDirectory = path.resolve(__dirname, '../generated');

generateApiFromSpecs({
	specsDirectory,
	generatedDirectory,
});

generateLocalization({
	localesDirectory,
	generatedDirectory,
	supportedLocales,
});

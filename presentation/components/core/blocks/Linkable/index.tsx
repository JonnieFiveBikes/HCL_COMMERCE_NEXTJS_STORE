/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import NextLink, { LinkProps } from 'next/link';
import { Link, Button, SxProps, Theme } from '@mui/material';
import { FC, forwardRef } from 'react';
import { Switch } from '@/utils/switch';
import { ImageProps } from 'next/image';
import { constructNextUrl, useNextRouter } from '@/data/Content/_NextRouter';
import { MaterialImage } from '@/components/blocks/MaterialImage';
import { useSettings } from '@/data/Settings';

type LinkablePropsCommon = {
	href?: LinkProps['href'];
	sx?: SxProps<Theme>;
	[key: string]: unknown;
};

type LinkablePropsText = {
	type?: 'link' | 'button' | 'inline';
	children?: JSX.Element | JSX.Element[] | string;
} & LinkablePropsCommon;

type LinkablePropsImage = {
	type: 'image';
} & LinkablePropsCommon &
	ImageProps;

type LinkableProps = LinkablePropsText | LinkablePropsImage;

/**
 * Used to make any component linkable.
 */
export const LinkWrap: FC<{
	href?: LinkProps['href'];
	children: JSX.Element;
}> = ({ href, children }) => {
	const router = useNextRouter();
	const {
		settings: { storeToken },
	} = useSettings();
	const _href = constructNextUrl(router.asPath, href, storeToken);

	return _href ? (
		<NextLink href={_href} passHref>
			{children}
		</NextLink>
	) : (
		children
	);
};
/**
 * Used for general linking, where children can be a simple string label.
 */
export const Linkable: FC<LinkableProps> = forwardRef<HTMLAnchorElement, any>(
	({ type = 'link', href, children, sx, alt = '', ...props }, ref) =>
		Switch(type)
			.case('link', () => (
				<LinkWrap href={href}>
					{href ? (
						<Link ref={ref} {...props} sx={sx}>
							{children}
						</Link>
					) : (
						children
					)}
				</LinkWrap>
			))
			.case('button', () => (
				<LinkWrap href={href}>
					<Button ref={ref} component="a" {...props} sx={sx}>
						{children}
					</Button>
				</LinkWrap>
			))
			.case('inline', () => (
				<LinkWrap href={href}>
					<Button ref={ref} component="a" {...props} sx={sx} variant="inline">
						{children}
					</Button>
				</LinkWrap>
			))
			.case('image', () => (
				<LinkWrap href={href}>
					<Link sx={sx} ref={ref}>
						<MaterialImage alt={alt} {...props} />
					</Link>
				</LinkWrap>
			))
			.defaultTo(() => null)
);

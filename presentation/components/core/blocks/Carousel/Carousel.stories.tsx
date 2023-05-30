/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import React, { FC } from 'react';
import { Img } from '@/components/blocks/MaterialImage';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { CarouselSlider } from '@/components/blocks/Carousel';
import { Paper, Typography } from '@mui/material';

const defaultArgs = {
	naturalSlideWidth: 248,
	naturalSlideHeight: 300,
	visibleSlides: 1,
	step: 1,
	infinite: true,
	dragEnabled: false,
	totalSlides: 3,
	isIntrinsicHeight: true,
};

export default {
	title: 'Blocks/Carousel',
	component: CarouselSlider,
	args: defaultArgs,
	argTypes: {
		slides: {
			table: {
				disable: true,
			},
		},
		carouselProps: {
			table: {
				disable: true,
			},
		},
		carouselSlideStyles: {
			table: {
				disable: true,
			},
		},
	},
} as ComponentMeta<typeof CarouselSlider>;

const getArrayOfLength = (length: number) => new Array(length);

const getSlides = (totalSlides?: number) =>
	totalSlides
		? [...getArrayOfLength(totalSlides)].map((_, i) => (
				<Paper key={i}>
					<Img
						width="100%"
						height="auto"
						src="/static/media/public/EmeraldSAS/images/promotion/promo-lg-1200px.jpg"
						alt={`Image Alt Text ${i}`}
						title={`Image Title Text ${i}`}
					/>
					<Typography variant="h2">{`Slide ${i + 1}`}</Typography>
				</Paper>
		  ))
		: [];

const Container: FC<typeof defaultArgs> = ({ totalSlides, ...props }) => (
	<CarouselSlider carouselProps={{ ...props }} slides={getSlides(totalSlides)} />
);

const Template: ComponentStory<typeof Container> = (args) => <Container {...args} />;

export const CarouselStory = Template.bind({});
CarouselStory.args = defaultArgs;

CarouselStory.storyName = 'Carousel';

/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { checkOutStepLabelSX } from '@/components/content/CheckOut/styles/stepLabel';
import { checkOutStepperSX } from '@/components/content/CheckOut/styles/stepper';
import { checkOutStepperPaperSX } from '@/components/content/CheckOut/styles/stepperPaper';
import { useLocalization } from '@/data/Localization';
import { Paper, Stack, Step, StepLabel, Stepper } from '@mui/material';
import React, { FC, useContext } from 'react';
import { CheckoutProfilesCreateEditShipping } from '@/components/content/CheckoutProfiles/parts/CreateEdit/Shipping';
import { CheckoutProfilesCreateEditBilling } from '@/components/content/CheckoutProfiles/parts/CreateEdit/Billing';
import { useCheckoutProfileCreateEdit } from '@/data/Content/_CheckoutProfileCreateEdit';
import { useCheckoutProfiles } from '@/data/Content/CheckoutProfiles';
import { ContentContext, ContentProvider } from '@/data/context/content';
import { useAllowableShippingModes } from '@/data/Content/_AllowableShippingModes';
import { useAllowablePaymentMethods } from '@/data/Content/_AllowablePaymentMethods';

type InputContextType = ReturnType<typeof useCheckoutProfiles> &
	ReturnType<typeof useAllowableShippingModes> &
	ReturnType<typeof useAllowablePaymentMethods>;

export const CheckoutProfilesCreateEdit: FC = () => {
	const localization = useLocalization('CheckoutProfile');
	const { modifyState, setModifyState, mutateCheckoutProfiles, ...rest } = useContext(
		ContentContext
	) as InputContextType;
	const createEditValues = useCheckoutProfileCreateEdit({
		modifyState,
		setModifyState,
		mutateCheckoutProfiles,
	});
	const { activeStep } = createEditValues;

	return (
		<Stack spacing={2}>
			<Paper sx={checkOutStepperPaperSX}>
				<Stepper activeStep={activeStep} sx={checkOutStepperSX}>
					<Step key="Shipping">
						<StepLabel sx={checkOutStepLabelSX}>{localization.ShippingInformation.t()}</StepLabel>
					</Step>
					<Step key="Billing">
						<StepLabel sx={checkOutStepLabelSX}>{localization.BillingInformation.t()}</StepLabel>
					</Step>
				</Stepper>
			</Paper>

			<ContentProvider
				value={{
					modifyState,
					setModifyState,
					mutateCheckoutProfiles,
					...rest,
					...createEditValues,
				}}
			>
				{activeStep === 0 ? (
					<CheckoutProfilesCreateEditShipping />
				) : (
					<CheckoutProfilesCreateEditBilling />
				)}
			</ContentProvider>
		</Stack>
	);
};

/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

import { ModifyContext } from '@/data/Content/CheckoutProfiles';
import { useNotifications } from '@/data/Content/Notifications';
import { contactCreator, contactUpdater, usePersonContact } from '@/data/Content/PersonContact';
import { useLocalization } from '@/data/Localization';
import { useSettings } from '@/data/Settings';
import { useUser } from '@/data/User';
import { NON_CC_PAYMENTS_BY_CODE } from '@/data/constants/nonCreditCardPayment';
import { processError } from '@/data/utils/processError';
import { EditableAddress } from '@/data/types/Address';
import { TransactionErrorResponse } from '@/data/types/Basic';
import {
	CheckoutProfileBillingType,
	CheckoutProfileData,
	CheckoutProfileShippingType,
	CheckoutProfileType,
} from '@/data/types/CheckoutProfiles';
import { RequestQuery } from '@/data/types/RequestQuery';
import { transactionsCheckoutProfile } from 'integration/generated/transactions';
import {
	PersonCheckoutProfile,
	PersonCheckoutProfileUpdateById,
	PersonSingleContact,
} from 'integration/generated/transactions/data-contracts';
import { RequestParams } from 'integration/generated/transactions/http-client';
import { omit, pickBy } from 'lodash';
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { KeyedMutator, useSWRConfig } from 'swr';
import { checkProfileCreditCard } from '@/data/utils/payment';
import { useExtraRequestParameters } from '@/data/Content/_ExtraRequestParameters';
import { personalContactInfoMutatorKeyMatcher } from '@/data/utils/personalContactInfoMutatorKeyMatcher';
import { useNextRouter } from '@/data/Content/_NextRouter';
import { getClientSideCommon } from '@/data/utils/getClientSideCommon';

const checkoutProfileCreator =
	(pub: boolean) =>
	async (
		storeId: string,
		cProf: PersonCheckoutProfileUpdateById,
		query: RequestQuery = {},
		params: RequestParams
	) =>
		await transactionsCheckoutProfile(pub).checkoutProfileCreateCheckoutProfile(
			storeId,
			query,
			cProf,
			params
		);

const checkoutProfileUpdater =
	(pub: boolean) =>
	async (
		storeId: string,
		checkoutProfileId: string,
		query: RequestQuery = {},
		params: RequestParams,
		data?: PersonCheckoutProfileUpdateById
	) =>
		await transactionsCheckoutProfile(pub).checkoutProfileUpdateCheckoutProfileById(
			storeId,
			checkoutProfileId,
			query,
			data,
			params
		);

const SHIPPING_VALUES: CheckoutProfileShippingType = {
	profileName: '',
	shipping_modeId: '',
	shipping_nickName: '',
};

const BILLING_VALUES: CheckoutProfileBillingType = {
	pay_payment_method: '',
	pay_account: '',
	pay_expire_year: (new Date().getFullYear() + 1).toString(),
	pay_expire_month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
	billing_nickName: '',
};

const initProfile = (profile?: CheckoutProfileData) =>
	!profile
		? ({ ...SHIPPING_VALUES, ...BILLING_VALUES } as CheckoutProfileType)
		: {
				profileId: profile.xchkout_ProfileId,
				profileName: profile.xchkout_ProfileName,
				shipping_nickName: profile.shipping_nickName,
				shipping_modeId: profile.shipping_modeId,
				billing_nickName: profile.billing_nickName,
				pay_payment_method: profile.billingData.payment_method.value,
				...(!NON_CC_PAYMENTS_BY_CODE[profile.billingData.payment_method.value] && {
					pay_account: profile.billingData.account.value,
					pay_expire_month: profile.billingData.expire_month.value,
					pay_expire_year: profile.billingData.expire_year.value,
				}),
		  };

const EMPTY_ARRAY: PersonSingleContact[] = [];

type Props = {
	modifyState: ModifyContext;
	setModifyState: Dispatch<SetStateAction<ModifyContext>>;
	mutateCheckoutProfiles: KeyedMutator<PersonCheckoutProfile>;
};

export const useCheckoutProfileCreateEdit = (props: Props) => {
	const { mutate } = useSWRConfig();
	const router = useNextRouter();
	const { modifyState, setModifyState, mutateCheckoutProfiles } = props;
	const { state, profile: _profile } = modifyState;
	const { user } = useUser();
	const { settings } = useSettings();
	const { storeId, langId } = getClientSideCommon(settings, router);
	const params = useExtraRequestParameters();
	const { notifyError, showSuccessMessage } = useNotifications();
	const cardText = useLocalization('AddressCard');
	const { shippingAddress = EMPTY_ARRAY, billingAddress = EMPTY_ARRAY } = usePersonContact();
	const success = useLocalization('success-message');
	const [profile, setProfile] = useState<CheckoutProfileType>(initProfile(_profile));
	const [addressToEdit, setAddressToEdit] = useState<EditableAddress | null>(null);
	const [activeStep, setActiveStep] = useState<number>(0);
	const [billingForm, shippingForm] = useMemo(() => {
		const {
			profileName,
			shipping_modeId,
			shipping_nickName,
			pay_payment_method,
			billing_nickName,
			pay_expire_month,
			pay_expire_year,
		} = profile;
		const billingForm: CheckoutProfileBillingType = {
			pay_payment_method,
			billing_nickName,
			...(!NON_CC_PAYMENTS_BY_CODE[pay_payment_method as string] && {
				pay_account: '',
				pay_expire_year,
				pay_expire_month,
			}),
		};
		const shippingForm: CheckoutProfileShippingType = {
			profileName,
			shipping_modeId,
			shipping_nickName,
		};
		return [billingForm, shippingForm];
	}, [profile]);

	const goToShipping = setActiveStep.bind(null, 0);

	const goToBilling = (props: CheckoutProfileShippingType) => {
		setActiveStep(1);
		const { profileName, shipping_modeId, shipping_nickName } = props;
		const addressShippingData = shippingAddress.find(
			(a) => a.hasOwnProperty('addressLine') && a.nickName === shipping_nickName
		);
		const shippingData = Object.fromEntries(
			Object.entries(addressShippingData ?? {}).map(([key, value]) => [`shipping_${key}`, value])
		);
		setProfile((prev) => ({
			...prev,
			...shippingData,
			profileName,
			shipping_modeId,
			shipping_nickName,
		}));
	};

	const onAddressEditOrCreate = useCallback(
		async (address: EditableAddress) => {
			const { addressLine1, addressLine2, nickName, ..._address } = address;

			const msgKey = addressToEdit?.addressId ? 'EDIT_ADDRESS_SUCCESS' : 'ADD_ADDRESS_SUCCESS';
			try {
				if (addressToEdit?.addressId) {
					// if addressToEdit has addressId, means update, create otherwise.
					const data = { addressLine: [addressLine1, addressLine2 ?? ''], ..._address };
					await contactUpdater(true)(storeId, nickName, undefined, data, params);
				} else {
					const data = { addressLine: [addressLine1, addressLine2 ?? ''], nickName, ..._address };
					await contactCreator(true)(storeId, undefined, data, params);
				}
				showSuccessMessage(success[msgKey].t([address.nickName]));
				mutate(personalContactInfoMutatorKeyMatcher(''), undefined);
				setAddressToEdit(null);
			} catch (e) {
				notifyError(processError(e as TransactionErrorResponse));
			}
		},
		[addressToEdit?.addressId, showSuccessMessage, success, mutate, storeId, params, notifyError]
	);
	const editableAddress = useMemo<EditableAddress | null>(
		() =>
			addressToEdit
				? (pickBy(addressToEdit, (_value, key) => key !== 'addressId') as EditableAddress)
				: null,
		[addressToEdit]
	);
	const toggleEditCreateAddress = useCallback(
		(address: EditableAddress | null) => () => setAddressToEdit(address),
		[]
	);

	const getShippingCardActions = (
		address: EditableAddress,
		nicknameSelected: string,
		onSelect: (name: keyof CheckoutProfileShippingType, _nickname: string) => void
	) => {
		const { addressId, nickName } = address;
		const isSelected = nickName === nicknameSelected;
		return [
			{
				text: cardText.EditButton.t(),
				handleClick: toggleEditCreateAddress(address),
			},
			!isSelected &&
				addressId && {
					text: cardText.UseAddress.t(),
					variant: 'outlined',
					handleClick: () =>
						onSelect('shipping_nickName' as keyof CheckoutProfileShippingType, address.nickName),
				},
		].filter(Boolean);
	};

	const getBillingCardActions = (
		address: EditableAddress,
		nicknameSelected?: string,
		onSelect?: (name: keyof CheckoutProfileBillingType, _nickname: string) => void
	) => {
		const { addressId, nickName } = address;
		const isSelected = nickName === nicknameSelected;

		return [
			{
				text: cardText.EditButton.t(),
				handleClick: toggleEditCreateAddress(address),
			},
			!isSelected &&
				addressId && {
					text: cardText.UseAddress.t(),
					variant: 'outlined',
					handleClick: () =>
						onSelect &&
						onSelect('billing_nickName' as keyof CheckoutProfileBillingType, address.nickName),
				},
		].filter(Boolean);
	};

	const validateCreditCard = (data: CheckoutProfileBillingType, form: HTMLFormElement | null) => {
		const [card, expiry] = checkProfileCreditCard(data);
		['pay_account', 'pay_expire_month', 'pay_expire_year']
			.map((name) => form?.[name])
			.filter(Boolean)
			.forEach((field: HTMLInputElement) => {
				if (field.name === 'pay_account') {
					field.setCustomValidity(card ? 'invalid' : '');
				} else {
					field.setCustomValidity(expiry ? 'invalid' : '');
				}
			});
	};

	const submitCheckoutProfile = async (props: CheckoutProfileBillingType) => {
		const { billing_nickName, pay_payment_method: method = '' } = props;
		const nonCC = NON_CC_PAYMENTS_BY_CODE[method];
		const payment = nonCC ? props : { ...props, pay_cc_brand: method };
		const addressBillingData = billingAddress.find(
			(a) => a.hasOwnProperty('addressLine') && a.nickName === billing_nickName
		);

		const billingData = Object.fromEntries(
			Object.entries(addressBillingData ?? {}).map(([key, value]) => [`billing_${key}`, value])
		);
		setProfile((prev) => ({ ...prev, ...billingData, ...payment }));

		const data = omit(
			{ ...profile, ...payment, ...billingData, URL: 'noURL', userId: user?.userId },
			'shipping_primary',
			'billing_primary',
			'billing_addressType',
			'shipping_addressType',
			...(nonCC ? ['pay_cc_brand', 'pay_account', 'pay_expire_month', 'pay_expire_year'] : [])
		);

		try {
			if (state === 1) {
				await checkoutProfileCreator(true)(
					storeId,
					data,
					{ langId, responseFormat: 'json' },
					params
				);
				showSuccessMessage(
					success.CREATE_CHECKOUT_PROFILE_SUCCESS.t([profile.profileName as string])
				);
			} else {
				await checkoutProfileUpdater(true)(
					storeId,
					profile.profileId as string,
					{ langId, responseFormat: 'json' },
					params,
					data
				);
				showSuccessMessage(success.UpdatedCheckoutProfile.t([profile.profileName as string]));
			}
			setModifyState({ state: 0 });
			mutateCheckoutProfiles();
		} catch (e) {
			notifyError(processError(e as TransactionErrorResponse));
		}
	};

	return {
		getBillingCardActions,
		getShippingCardActions,
		editableAddress,
		toggleEditCreateAddress,
		onAddressEditOrCreate,
		goToBilling,
		activeStep,
		goToShipping,
		submitCheckoutProfile,
		addressToEdit,
		shippingForm,
		billingForm,
		profile,
		validateCreditCard,
	};
};

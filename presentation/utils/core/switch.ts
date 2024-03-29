/**
 * Licensed Materials - Property of HCL Technologies Limited.
 * (C) Copyright HCL Technologies Limited  2023.
 */

type Type<T> = new (...args: any) => T;

type SwitchOn<T, TProps, TProp extends keyof T, U> = {
	match: <Prop extends TProps, R>(
		prop: Prop,
		// eslint-disable-next-line no-unused-vars
		handler: (t: T & { [key in TProp]: Prop }) => R
	) => SwitchOn<T, Exclude<TProps, Prop>, TProp, U | R>;
	defaultTo: <R>(handler: () => R) => U | R;
	orThrow: (errFn?: () => Error) => U;
};

type Switch<T, U> = {
	case: <R>(value: T, handler: () => R) => Switch<T, U | R>;
	match: <C extends T, R>(type: Type<C>, handler: (value: C) => R) => Switch<Exclude<T, C>, U | R>;
	defaultTo: <R>(handler: () => R) => U | R;
	orThrow: (errFn?: () => Error) => U;
};

type On<T> = {
	on: <TProp extends keyof T>(prop: TProp) => SwitchOn<T, T[TProp], TProp, never>;
};

const Result = <T, U>(value: U): Switch<T, U> => {
	const res: Switch<T, U> = {
		case: () => res,
		match: () => res,
		orThrow: () => value,
		defaultTo: () => value,
	};
	return res;
};

const OnResult = <T, TProps, TProp extends keyof T, U>(value: U): SwitchOn<T, TProps, TProp, U> => {
	const res: SwitchOn<T, TProps, TProp, U> = {
		match: () => res,
		orThrow: () => value,
		defaultTo: () => value,
	};
	return res;
};

export const SwitchOn = <T, TProp extends keyof T>(
	unit: T,
	on: TProp
): SwitchOn<T, T[TProp], TProp, never> => ({
	match: (prop, handler) =>
		unit[on] === prop ? OnResult(handler(unit as any)) : SwitchOn(unit, on),
	defaultTo: (handler) => handler(),
	orThrow: (err) => {
		throw err ?? new Error(`'${unit}' out of range`);
	},
});

export const Switch = <T>(unit: T): Switch<T, never> & On<T> => ({
	case: (value, handler) => (value === unit ? Result(handler()) : Switch(unit)),
	match: (type, handler) => (unit instanceof type ? Result(handler(unit)) : Switch(unit)),
	defaultTo: (handler) => handler(),
	orThrow: (err) => {
		throw err ?? new Error(`'${unit}' out of range`);
	},
	on: (prop) => SwitchOn(unit, prop),
});

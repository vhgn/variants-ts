export type Variant<L, T = unknown> = { type: L; data: T };

export type Ok<T> = Variant<"ok", T>
export type Err<E> = Variant<"err", E>

export type Result<T, E = unknown> = Ok<T> | Err<E>;

type ExhaustiveMatchers<U extends Variant<any, any>, R> = {
	[K in U['type']]: (v: Extract<U, { type: K }>["data"]) => R;
};

type NonExhaustiveMatchers<U extends Variant<any, any>, R> = {
	[K in U['type']]?: (v: Extract<U, { type: K }>["data"]) => R;
} & { _: (v: U) => R };

export function match<const Union extends Variant<any, any>, R>(
	handlers: ExhaustiveMatchers<Union, R> | NonExhaustiveMatchers<Union, R>
): (v: Union) => R {
	return (variant) => {
		const handler = handlers[variant.type as keyof typeof handlers];
		if (handler) {
			return handler(variant.data);
		} else {
			if ("_" in handlers) {
				return handlers._(variant);
			}
		}
	};
}

export const variant = <const T extends string, const D>(type: T, data: D): Variant<T, D> => ({ type, data } as const);

export const ok = <const T>(v: T): Ok<T> => ({ type: "ok", data: v });
export const err = <const E>(v: E): Err<E> => ({ type: "err", data: v });

export const isvariant = <const U extends Variant<any, any>>(type: U["type"]) => (v: U): v is U => v.type === type;

export const isok = <const T>(v: Result<T, unknown>): v is Ok<T> => v.type === "ok";
export const iserr = <const E>(v: Result<unknown, E>): v is Err<E> => v.type === "err";


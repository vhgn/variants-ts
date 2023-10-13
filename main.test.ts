import { expect, test } from "bun:test";
import { Result, Variant, err, iserr, isok, isvariant, match, ok, variant } from ".";

test("isok should work", () => {
	expect(isok(ok(1))).toBeTrue();
	expect(isok(ok(NaN))).toBeTrue();
	expect(isok(ok({}))).toBeTrue();
	expect(isok(ok(null))).toBeTrue();
	expect(isok(ok(undefined))).toBeTrue();
	expect(isok(ok(false))).toBeTrue();
});

test("iserr should work", () => {
	expect(iserr(err(1))).toBeTrue();
	expect(iserr(err(NaN))).toBeTrue();
	expect(iserr(err({}))).toBeTrue();
	expect(iserr(err(null))).toBeTrue();
	expect(iserr(err(undefined))).toBeTrue();
	expect(iserr(err(false))).toBeTrue();
});

test("isvariant('ok') should work", () => {
	const isokVariant = isvariant<Result<5>>("ok");
	// @ts-expect-error
	isokVariant(ok(new Error()))

	type X =
		| Variant<"a", 5>
		| Variant<"b", number>
		| Variant<"c", 7>

	const isA = isvariant<X>("a");

	expect(isA(variant("a", 5))).toBeTrue();

	// @ts-expect-error
	isA(variant("a", 4))
});

test("match should work", () => {
	// @ts-expect-error
	const matcher1 = match<Result<5>>({
		ok: (v) => v,
		err: () => null,
	});

	const matcher2 = match<Result<5>, string | null>({
		ok: (v) => v.toFixed(),
		_: () => null,
	});

	const matcher3 = match<Result<5>, string | null>({
		ok: (v) => v.toFixed(),
		// @ts-expect-error
		_: () => 5,
	});

	const matcher4 = match<Result<1>, 1 | 2>({
		ok: (v) => v,
		err: () => 2,
	});

	const matcher5 = match<Result<number>, 1 | 3>({
		ok: (v) => v === 1 ? v : 3,
		err: () => 1,
	});

	matcher1;

	expect(matcher2(ok(5))).toBe("5");
	expect(matcher2(err(5))).toBeNull();

	// @ts-expect-error
	matcher2(ok(9));

	expect(matcher3(ok(5))).toBe("5");

	// @ts-expect-error
	matcher4(ok(5));

	expect(matcher4(ok(1))).toBe(1);

	expect(matcher5(ok(5))).toBe(3);
});

test("documentation should work", async () => {
	type PartialData =
		| Variant<"nothing", null>
		| Variant<"string", string>
		| Variant<"number", number>
		| Variant<"all", string[]>

	async function getData(): Promise<PartialData> {
		const stringResult: Result<string> = await fetch("https://example.com")
			.then((res) => res.text())
			.then(ok)
			.catch(err)

		if (iserr(stringResult)) {
			// Avoid indented try/catch blocks
			return variant("nothing", null);
		}

		// Use ok or err as a transformation in a chain
		const numberResult: Result<number> = await fetch(`https://example.com/${stringResult.data}`)
			.then(Number)
			.then(Math.abs)
			.then(ok)
			.catch(err);

		if (iserr(numberResult)) {
			return variant("string", stringResult.data);
		}

		if (Number.isNaN(numberResult.data)) {
			// Handle custom error cases
			return variant("string", stringResult.data);
		}

		const allResult: Result<string[]> = await fetch(`https://example.com/data?limit=${numberResult.data}`)
			.then((res) => res.json())
			.then(ok)
			.catch(err);

		if (iserr(allResult)) {
			return variant("number", numberResult.data);
		}

		return variant("all", allResult.data);
	}

	// Match on the result
	const matcher = match<PartialData, string>({
		nothing: () => "Nothing found",
		string: (v) => `Found string: ${v}`,
		number: (v) => `Found number: ${v}`,
		all: (v) => `Found all: ${v.join(", ")}`,
	});

	// Use the matcher as a transformation
	const message = await getData().then(matcher)

	console.log(message);
});

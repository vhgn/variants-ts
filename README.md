# `variants-ts`

This package gives some simple primitives to use variants in TypeScript

# Examples

```ts
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
```

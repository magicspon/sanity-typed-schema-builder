import { z } from "zod";

import type { Faker } from "@faker-js/faker";
import type {
  CustomValidator,
  Rule as RuleWithoutTypedCustom,
} from "@sanity/types";
import type { Merge, PartialDeep, Promisable, SetOptional } from "type-fest";

export const zodUnion = <Zods extends z.ZodTypeAny>(zods: Zods[]): Zods =>
  zods.length === 0
    ? (z.never() as unknown as Zods)
    : zods.length === 1
    ? zods[0]!
    : (z.union([zods[0]!, zods[1]!, ...zods.slice(2)]) as unknown as Zods);

export interface SanityType<Definition, Value, ParsedValue> {
  mock: (faker: Faker, path?: string) => Value;
  parse: (data: unknown) => ParsedValue;
  schema: () => Definition;
  zod: z.ZodType<ParsedValue, any, Value>;
}

export type InferValue<T extends SanityType<any, any, any>> =
  T extends SanityType<any, infer Value, any> ? Value : never;

export type InferParsedValue<T extends SanityType<any, any, any>> =
  T extends SanityType<any, any, infer ParsedValue> ? ParsedValue : never;

const createMocker = <MockType>(
  mockFn: (faker: Faker, path: string) => MockType
) => {
  const fakers: Record<string, Faker> = {};

  return (faker: Faker, path = ""): MockType => {
    // @ts-expect-error -- We need faker to not be bundled with the library while getting both the class to create new instances and faker.locales.
    const FakerClass: typeof Faker = faker.constructor;

    if (!(path in fakers)) {
      // eslint-disable-next-line fp/no-mutation -- Need to set fakers
      fakers[path] = new FakerClass({ locales: faker.locales });
      fakers[path]!.seed(
        Array.from(path).reduce(
          // eslint-disable-next-line no-bitwise -- copied from somewhere
          (s, c) => (Math.imul(31, s) + c.charCodeAt(0)) | 0,
          0
        )
      );
    }

    return mockFn(fakers[path]!, path);
  };
};

// TODO createType tests
export const createType = <Definition, Value, ParsedValue>({
  mock,
  zod,
  parse = zod.parse.bind(zod),
  ...def
}: Merge<
  SetOptional<SanityType<Definition, Value, ParsedValue>, "parse">,
  { mock: (faker: Faker, path: string) => Value }
>): SanityType<Definition, Value, ParsedValue> => ({
  ...def,
  mock: createMocker(mock),
  parse,
  zod,
});

// Don't use Merge, because it creates a deep recursive type
export type Rule<Value> = Omit<RuleWithoutTypedCustom, "custom"> & {
  custom: (fn: CustomValidator<PartialDeep<Value>>) => Rule<PartialDeep<Value>>;
};

export type WithTypedValidation<Definition, Value> = Merge<
  Definition,
  { validation?: (rule: Rule<Value>) => Rule<Value> }
>;

export type NamedSchemaFields = "description" | "name" | "title";

export type SanityNamedTypeDef<
  Definition,
  Value,
  ParsedValue,
  IntermediateValue = Value
> = Merge<
  WithTypedValidation<Omit<Definition, "type">, Value>,
  {
    initialValue?: Value | (() => Promisable<Value>);
    mock?: (faker: Faker, path: string) => Value;
    zod?: (
      zod: z.ZodType<IntermediateValue, any, Value>
    ) => z.ZodType<ParsedValue, any, Value>;
  }
>;

export type SanityTypeDef<
  Definition,
  Value,
  ParsedValue,
  IntermediateValue = Value
> = SanityNamedTypeDef<
  Omit<Definition, NamedSchemaFields>,
  Value,
  ParsedValue,
  IntermediateValue
>;

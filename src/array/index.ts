import { flow } from "lodash/fp";
import { z } from "zod";

import { createType } from "../types";

import type { FieldOptionKeys } from "../field";
import type { InferZod, SanityType, TypeValidation } from "../types";
import type { Faker } from "@faker-js/faker";
import type { Schema } from "@sanity/types";
import type { Simplify } from "type-fest";

type UnArray<T> = T extends Array<infer U> ? U : never;

// HACK Shouldn't have to omit FieldOptionKeys because arrays don't need names
type ItemDefinition = Omit<
  UnArray<Schema.ArrayDefinition["of"]>,
  FieldOptionKeys
>;

type AddKeyToZod<Zod extends z.ZodFirstPartySchemaTypes> = Zod extends
  | z.ZodObject<any, any, any, any, any>
  | z.ZodIntersection<any, any>
  ? z.ZodIntersection<Zod, z.ZodObject<{ _key: z.ZodString }>>
  : Zod;

const addKeyToZod = <Zod extends z.ZodFirstPartySchemaTypes>(zod: Zod) =>
  !(zod instanceof z.ZodObject) && !(zod instanceof z.ZodIntersection)
    ? zod
    : z.intersection(
        zod,
        z.object({
          _key: z.string(),
        })
      );

type ZodArray<
  Positions extends string,
  Items extends {
    [field in Positions]: SanityType<ItemDefinition, any>;
  },
  NonEmpty extends boolean
> = z.ZodArray<
  "00" extends Positions
    ? z.ZodUnion<
        readonly [
          AddKeyToZod<InferZod<Items[keyof Items]>>,
          ...Array<AddKeyToZod<InferZod<Items[keyof Items]>>>
        ]
      >
    : "0" extends Positions
    ? AddKeyToZod<InferZod<Items[keyof Items]>>
    : z.ZodNever,
  NonEmpty extends true ? "atleastone" : "many"
>;

interface ItemsType<
  Positions extends string,
  Items extends {
    [field in Positions]: SanityType<ItemDefinition, any>;
  }
> extends SanityType<ItemDefinition[], ZodArray<Positions, Items, false>> {
  item: <
    Zod extends z.ZodType<any, any, any>,
    NewPosition extends Exclude<`${Positions}0`, Positions>
  >(
    item: SanityType<ItemDefinition, Zod>
  ) => ItemsType<
    Positions | NewPosition,
    // @ts-expect-error -- Not sure how to solve this
    Simplify<
      Items & {
        [field in NewPosition]: SanityType<ItemDefinition, Zod>;
      }
    >
  >;
}

const itemsInternal = <
  Positions extends string,
  Items extends {
    [field in Positions]: SanityType<ItemDefinition, any>;
  },
  NonEmpty extends boolean
>(
  items: Array<Items[keyof Items]>
): ItemsType<Positions, Items> => ({
  ...createType({
    // FIXME Mock the array element types. Not sure how to allow an override, since the function has to be defined before we know the element types.
    mock: () => [] as unknown as z.input<ZodArray<Positions, Items, NonEmpty>>,
    zod: z.array(
      items.length === 0
        ? z.never()
        : items.length === 1
        ? addKeyToZod(items[0]!.zod)
        : z.union([
            addKeyToZod(items[0]!.zod),
            addKeyToZod(items[1]!.zod),
            ...(items
              .slice(2)
              .map(
                <Zod extends z.ZodType<any, any, any>>({
                  zod,
                }: SanityType<ItemDefinition, Zod>) => addKeyToZod(zod)
              ) as unknown as Array<InferZod<Items[keyof Items]>>),
          ])
    ) as ZodArray<Positions, Items, false>,
    schema: () => items.map(({ schema }) => schema()),
  }),
  item: <
    Zod extends z.ZodType<any, any, any>,
    NewPosition extends Exclude<`${Positions}0`, Positions>
  >(
    item: SanityType<ItemDefinition, Zod>
  ) =>
    itemsInternal<
      Positions | NewPosition,
      // @ts-expect-error -- Not sure how to solve this
      Simplify<
        Items & {
          [field in NewPosition]: SanityType<ItemDefinition, Zod>;
        }
      >,
      NonEmpty
    >([...items, item]),
});

export const item = <
  Zod extends z.ZodType<any, any, any>,
  NonEmpty extends boolean
>(
  item: SanityType<ItemDefinition, Zod>
) =>
  itemsInternal<
    "0",
    {
      "0": SanityType<ItemDefinition, Zod>;
    },
    NonEmpty
  >([item]);

export const array = <
  Positions extends string,
  Items extends {
    [field in Positions]: SanityType<ItemDefinition, any>;
  },
  NonEmpty extends boolean = false
>({
  length,
  max,
  min,
  nonempty,
  of: { schema: itemsSchema, mock: itemsMock, zod: itemsZod },
  mock = itemsMock as unknown as (
    faker: Faker
  ) => z.input<ZodArray<Positions, Items, NonEmpty>>,
  validation,
  ...def
}: Omit<
  TypeValidation<
    Schema.ArrayDefinition<z.input<ZodArray<Positions, Items, NonEmpty>>>,
    z.input<ZodArray<Positions, Items, NonEmpty>>
  >,
  FieldOptionKeys | "of" | "type"
> & {
  length?: number;
  max?: number;
  min?: number;
  mock?: (faker: Faker) => z.input<ZodArray<Positions, Items, NonEmpty>>;
  nonempty?: NonEmpty;
  of: ItemsType<Positions, Items>;
}): SanityType<
  Omit<
    TypeValidation<
      Schema.ArrayDefinition<z.input<ZodArray<Positions, Items, NonEmpty>>>,
      z.input<ZodArray<Positions, Items, NonEmpty>>
    >,
    FieldOptionKeys
  >,
  ZodArray<Positions, Items, NonEmpty>
> =>
  createType({
    mock,
    zod: flow(
      (zod: ZodArray<Positions, Items, false>) =>
        !nonempty ? zod : zod.nonempty(),
      (zod: ZodArray<Positions, Items, NonEmpty>) =>
        !min ? zod : zod.min(min),
      (zod: ZodArray<Positions, Items, NonEmpty>) =>
        !max ? zod : zod.max(max),
      (zod: ZodArray<Positions, Items, NonEmpty>) =>
        length === undefined ? zod : zod.length(length)
    )(itemsZod) as ZodArray<Positions, Items, NonEmpty>,
    schema: () => ({
      ...def,
      type: "array",
      of: itemsSchema(),
      validation: flow(
        (rule) => (!nonempty ? rule : rule.min(1)),
        (rule) => (!min ? rule : rule.min(min)),
        (rule) => (!max ? rule : rule.max(max)),
        (rule) => (length === undefined ? rule : rule.length(length)),
        (rule) => validation?.(rule) ?? rule
      ),
    }),
  });

import { flow, fromPairs } from "lodash/fp";
import { z } from "zod";

import type {
  NamedSchemaFields,
  SanityType,
  WithTypedValidation,
} from "../types";
import type { Faker } from "@faker-js/faker";
import type {
  PrepareViewOptions,
  PreviewConfig,
  PreviewValue,
  Schema,
  Rule as UntypedRule,
} from "@sanity/types";
import type { Merge } from "type-fest";

export type FieldOptions<
  Name extends string,
  Zod extends z.ZodTypeAny,
  Optional extends boolean
> = Pick<
  Schema.FieldDefinition,
  "description" | "fieldset" | "group" | "title"
> & {
  name: Name;
  optional?: Optional;
  type: SanityType<
    WithTypedValidation<
      Omit<Schema.FieldDefinition<any>, NamedSchemaFields>,
      z.input<Zod>
    >,
    z.input<Zod>,
    z.output<Zod>
  >;
};

export type FieldsZodObject<
  FieldsArray extends readonly [
    FieldOptions<any, z.ZodTypeAny, any>,
    ...Array<FieldOptions<any, z.ZodTypeAny, any>>
  ]
> = {
  [Name in FieldsArray[number]["name"]]: Extract<
    FieldsArray[number],
    { name: Name }
  >["optional"] extends true
    ? z.ZodOptional<Extract<FieldsArray[number], { name: Name }>["type"]["zod"]>
    : Extract<FieldsArray[number], { name: Name }>["type"]["zod"];
};

export const fieldsZodObject = <
  FieldsArray extends readonly [
    FieldOptions<any, z.ZodTypeAny, any>,
    ...Array<FieldOptions<any, z.ZodTypeAny, any>>
  ]
>(
  fields: FieldsArray
) =>
  fromPairs(
    fields.map(({ name, optional, type: { zod } }) => [
      name,
      optional ? z.optional(zod) : zod,
    ])
  ) as FieldsZodObject<FieldsArray>;

export const fieldsMock =
  <
    Names extends string,
    FieldsArray extends readonly [
      FieldOptions<Names, z.ZodTypeAny, any>,
      ...Array<FieldOptions<Names, z.ZodTypeAny, any>>
    ]
  >(
    fields: FieldsArray
  ) =>
  (faker: Faker, path = "") =>
    fromPairs(
      fields.map(({ name, type: { mock } }) => [
        name,
        mock(faker, `${path}.${name}`),
      ])
    ) as z.input<z.ZodObject<FieldsZodObject<FieldsArray>>>;

export type Preview<
  Value extends Record<string, unknown>,
  Select extends NonNullable<PreviewConfig["select"]>
> =
  | {
      select: PreviewValue;
    }
  | {
      prepare: (
        object: Merge<
          Value,
          {
            [field in keyof Select]: unknown;
          }
        >,
        viewOptions?: PrepareViewOptions
      ) => PreviewValue;
      select?: Select;
    };

export const fieldsSchema = <
  Names extends string,
  FieldsArray extends readonly [
    FieldOptions<Names, z.ZodTypeAny, any>,
    ...Array<FieldOptions<Names, z.ZodTypeAny, any>>
  ],
  Value extends Record<string, unknown>,
  Select extends NonNullable<PreviewConfig["select"]>
>(
  fields: FieldsArray,
  previewDef?: Preview<Value, Select> | undefined
) => {
  const preview: PreviewConfig | undefined = !previewDef
    ? undefined
    : !("prepare" in previewDef)
    ? (previewDef as PreviewConfig)
    : {
        ...(previewDef as Pick<PreviewConfig, "prepare">),
        select: {
          ...fromPairs(fields.map(({ name }) => [name, name])),
          ...previewDef.select,
        },
      };

  return {
    preview,
    fields: fields.map(({ name, type, optional, ...props }) => {
      const schema = type.schema();

      const { validation } = schema;

      return {
        ...schema,
        ...props,
        name,
        validation: flow(
          (rule: UntypedRule) => (optional ? rule : rule.required()),
          (rule) => validation?.(rule) ?? rule
        ),
      };
    }),
  };
};

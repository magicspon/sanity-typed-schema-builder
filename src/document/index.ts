import { z } from "zod";

import { fieldsMock, fieldsSchema, fieldsZodObject } from "../field";
import { createType } from "../types";

import type { FieldOptions, FieldsZodObject, Preview } from "../field";
import type {
  SanityNamedTypeDef,
  SanityType,
  WithTypedValidation,
} from "../types";
import type { Schema } from "@sanity/types";
import type { Merge } from "type-fest";

export interface DocumentType<
  DocumentNames extends string,
  Value,
  ParsedValue
> extends SanityType<
    Merge<
      WithTypedValidation<Schema.DocumentDefinition, Value>,
      {
        name: DocumentNames;
      }
    >,
    Value,
    ParsedValue
  > {
  name: DocumentNames;
}

export const document = <
  DocumentNames extends string,
  Names extends string,
  Zods extends z.ZodTypeAny,
  Optionals extends boolean,
  FieldsArray extends readonly [
    FieldOptions<Names, Zods, Optionals>,
    ...Array<FieldOptions<Names, Zods, Optionals>>
  ],
  Zod extends z.ZodObject<
    Merge<
      FieldsZodObject<FieldsArray>,
      {
        _createdAt: z.ZodType<Date, any, string>;
        _id: z.ZodString;
        _rev: z.ZodString;
        _type: z.ZodLiteral<DocumentNames>;
        _updatedAt: z.ZodType<Date, any, string>;
      }
    >
  >,
  ParsedValue = z.output<Zod>,
  // eslint-disable-next-line @typescript-eslint/ban-types -- All other values assume keys
  Select extends Record<string, string> = {}
>({
  name,
  fields,
  preview: previewDef,
  mock = (faker, path = name) => {
    const createdAt = faker.date
      .between("2021-06-03T03:24:55.395Z", "2022-06-04T18:50:36.539Z")
      .toISOString();

    return {
      ...fieldsMock(fields)(faker, `${path}.${name}`),
      _id: faker.datatype.uuid(),
      _createdAt: createdAt,
      _rev: faker.datatype.string(23),
      _type: name,
      _updatedAt: faker.date
        .between(createdAt, "2022-06-05T18:50:36.539Z")
        .toISOString(),
    } as unknown as z.input<Zod>;
  },
  zod: zodFn = (zod) =>
    zod as unknown as z.ZodType<ParsedValue, any, z.input<Zod>>,
  ...def
}: Merge<
  SanityNamedTypeDef<
    Schema.DocumentDefinition,
    z.input<Zod>,
    ParsedValue,
    z.output<Zod>
  >,
  {
    fields: FieldsArray;
    name: DocumentNames;
    preview?: Preview<z.input<Zod>, Select>;
  }
>): DocumentType<DocumentNames, z.input<Zod>, ParsedValue> => ({
  name,
  ...createType({
    mock,
    zod: zodFn(
      z.object({
        ...fieldsZodObject(fields),
        _createdAt: z.string().transform((v) => new Date(v)),
        _id: z.string().uuid(),
        _rev: z.string(),
        _type: z.literal(name),
        _updatedAt: z.string().transform((v) => new Date(v)),
      }) as unknown as Zod
    ),
    schema: () => ({
      ...def,
      ...fieldsSchema(fields, previewDef),
      name,
      type: "document",
    }),
  }),
});

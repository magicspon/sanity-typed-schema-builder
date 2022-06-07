import { faker } from "@faker-js/faker";

import { preview } from "../fields";

import type {
  FieldOptionKeys,
  FieldsType,
  InferFieldsZod,
  Preview,
} from "../fields";
import type { SanityType } from "../types";
import type { Faker } from "@faker-js/faker";
import type { Schema } from "@sanity/types";
import type { z } from "zod";

interface ObjectType<Fields extends FieldsType<any, any>>
  extends SanityType<
    Omit<Schema.ObjectDefinition, FieldOptionKeys>,
    InferFieldsZod<Fields>
  > {}

export const object = <Fields extends FieldsType<any, any>>(
  def: Omit<
    Schema.ObjectDefinition,
    FieldOptionKeys | "fields" | "preview" | "type"
  > & {
    fields: Fields;
    mock?: (faker: Faker) => z.input<InferFieldsZod<Fields>>;
    preview?: Preview<z.input<InferFieldsZod<Fields>>>;
  }
): ObjectType<Fields> => {
  const {
    preview: previewDef,
    fields: { schema: fieldsSchema, mock: fieldsMock, zod: fieldsZod },
    mock = fieldsMock,
  } = def;
  const zod = fieldsZod as InferFieldsZod<Fields>;

  return {
    zod,
    parse: zod.parse.bind(zod),
    mock: () => mock(faker),
    schema: () => {
      const schemaForFields = fieldsSchema();

      return {
        ...def,
        type: "object",
        fields: schemaForFields,
        preview: preview(previewDef, schemaForFields),
      };
    },
  };
};

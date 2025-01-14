import { faker } from "@faker-js/faker";
import { describe, expect, it } from "@jest/globals";

import { boolean } from "../boolean";
import { string } from "../string";
import { mockRule } from "../test-utils";

import { file } from ".";

import type { SanityFile } from ".";
import type { SanityReference } from "../reference";
import type { ValidateShape } from "../test-utils";
import type {
  InferParsedValue,
  InferResolvedValue,
  InferValue,
} from "../types";
import type { Merge } from "type-fest";

describe("file", () => {
  it("builds a sanity config", () =>
    expect(file().schema()).toEqual({
      type: "file",
    }));

  it("passes through schema values", () =>
    expect(file({ hidden: false }).schema()).toHaveProperty("hidden", false));

  it("parses into an file", () => {
    const type = file();

    const value: ValidateShape<InferValue<typeof type>, SanityFile> = {
      _type: "file",
      asset: {
        _type: "reference",
        _ref: "file-5igDD9UuXffIucwZpyVthr0c",
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      SanityFile
    > = type.parse(value);

    expect(parsedValue).toEqual(value);
  });

  it("resolves into an file", () => {
    const type = file();

    const value: ValidateShape<InferValue<typeof type>, SanityFile> = {
      _type: "file",
      asset: {
        _type: "reference",
        _ref: "file-5igDD9UuXffIucwZpyVthr0c",
      },
    };
    const resolvedValue: ValidateShape<
      InferResolvedValue<typeof type>,
      SanityFile
    > = type.resolve(value);

    expect(resolvedValue).toEqual(value);
  });

  it("adds fields", () => {
    const type = file({
      fields: [
        {
          name: "foo",
          type: boolean(),
        },
        {
          name: "bar",
          optional: true,
          type: boolean(),
        },
      ],
    });

    const schema = type.schema();

    expect(schema).toHaveProperty("fields", [
      {
        name: "foo",
        type: "boolean",
        validation: expect.any(Function),
      },
      {
        name: "bar",
        type: "boolean",
        validation: expect.any(Function),
      },
    ]);

    const value: ValidateShape<
      InferValue<typeof type>,
      Merge<
        SanityFile,
        {
          bar?: boolean;
          foo: boolean;
        }
      >
    > = {
      foo: true,
      _type: "file",
      asset: {
        _type: "reference",
        _ref: "file-5igDD9UuXffIucwZpyVthr0c",
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      Merge<
        SanityFile,
        {
          bar?: boolean;
          foo: boolean;
        }
      >
    > = type.parse(value);

    expect(parsedValue).toEqual(value);
  });

  it("mocks the field values", () =>
    expect(
      file({
        fields: [
          {
            name: "foo",
            type: boolean(),
          },
          {
            name: "bar",
            type: string(),
          },
        ],
      }).mock(faker)
    ).toEqual({
      _type: "file",
      bar: expect.any(String),
      foo: expect.any(Boolean),
      asset: {
        _type: "reference",
        _ref: expect.any(String),
      },
    }));

  it("mocks the same value with the same path", () => {
    expect(file().mock(faker)).toEqual(file().mock(faker));
    expect(file().mock(faker, ".foo")).toEqual(file().mock(faker, ".foo"));

    expect(file().mock(faker, ".foo")).not.toEqual(file().mock(faker));
    expect(file().mock(faker)).not.toEqual(file().mock(faker, ".foo"));
  });

  it("allows defining the mocks", () =>
    expect([
      {
        _type: "file",
        asset: {
          _type: "reference",
          _ref: "file-5igDD9UuXffIucwZpyVthr0c",
        },
        foo: true,
        bar: "foo",
      },
      {
        _type: "file",
        asset: {
          _type: "reference",
          _ref: "file-5igDD9UuXffIucwZpyVthr0c",
        },
        foo: false,
        bar: "bar",
      },
    ] as const).toContainEqual(
      file({
        fields: [
          {
            name: "foo",
            type: boolean(),
          },
          {
            name: "bar",
            type: string(),
          },
        ],
        mock: (faker) =>
          faker.helpers.arrayElement([
            {
              _type: "file",
              asset: {
                _type: "reference",
                _ref: "file-5igDD9UuXffIucwZpyVthr0c",
              },
              foo: true,
              bar: "foo",
            },
            {
              _type: "file",
              asset: {
                _type: "reference",
                _ref: "file-5igDD9UuXffIucwZpyVthr0c",
              },
              foo: false,
              bar: "bar",
            },
          ] as const),
      }).mock(faker)
    ));

  it("allows defining the zod", () => {
    const type = file({
      zod: (zod) => zod.transform((value) => Object.entries(value)),
    });

    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      Array<[string, "file" | SanityReference]>
    > = type.parse({
      _type: "file",
      asset: {
        _type: "reference",
        _ref: "file-5igDD9UuXffIucwZpyVthr0c",
      },
    });

    expect(parsedValue).toEqual(
      expect.arrayContaining([
        ["_type", "file"],
        [
          "asset",
          {
            _type: "reference",
            _ref: "file-5igDD9UuXffIucwZpyVthr0c",
          },
        ],
      ])
    );
  });

  it("types custom validation", () => {
    const type = file({
      fields: [
        {
          name: "foo",
          optional: true,
          type: boolean(),
        },
        {
          name: "bar",
          type: string(),
        },
      ],
      validation: (Rule) =>
        Rule.custom((value) => {
          const file: ValidateShape<
            typeof value,
            | Merge<
                SanityFile,
                {
                  bar: string;
                  foo?: boolean;
                }
              >
            | undefined
          > = value;

          return !file?.bar || "Needs an empty bar";
        }),
    });

    const rule = mockRule();

    type.schema().validation?.(rule);

    expect(rule.custom).toHaveBeenCalledWith(expect.any(Function));
  });
});

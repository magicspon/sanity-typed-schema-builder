import { faker } from "@faker-js/faker";
import { describe, expect, it } from "@jest/globals";

import { boolean } from "../boolean";
import { string } from "../string";
import { mockRule } from "../test-utils";

import { image } from ".";

import type { SanityImage } from ".";
import type { SanityReference } from "../reference";
import type { ValidateShape } from "../test-utils";
import type { InferParsedValue, InferValue } from "../types";
import type { Merge } from "type-fest";

describe("image", () => {
  it("builds a sanity config", () =>
    expect(image().schema()).toEqual({
      type: "image",
      options: {
        hotspot: false,
      },
    }));

  it("passes through schema values", () =>
    expect(image({ hidden: false }).schema()).toHaveProperty("hidden", false));

  it("parses into an image", () => {
    const type = image();

    const value: ValidateShape<InferValue<typeof type>, SanityImage<false>> = {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      SanityImage<false>
    > = type.parse(value);

    expect(parsedValue).toEqual(value);
  });

  it("adds hotspot", () => {
    const type = image({ hotspot: true });

    const value: ValidateShape<InferValue<typeof type>, SanityImage<true>> = {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
      },
      crop: {
        top: 0.028131868131868132,
        bottom: 0.15003663003663004,
        left: 0.01875,
        right: 0.009375000000000022,
      },
      hotspot: {
        x: 0.812500000000001,
        y: 0.27963369963369955,
        height: 0.3248351648351647,
        width: 0.28124999999999994,
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      SanityImage<true>
    > = type.parse(value);

    expect(parsedValue).toEqual(value);
  });

  it("allows undefined hotspot and crop on new images", () => {
    const type = image({ hotspot: true });

    const value: ValidateShape<InferValue<typeof type>, SanityImage<true>> = {
      _type: "image",
      asset: {
        _type: "reference",
        _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      SanityImage<true>
    > = type.parse(value);

    expect(parsedValue).toEqual(value);
  });

  it("passes through hotspot to options object", () => {
    const type = image({ hotspot: true });

    expect(type.schema()).toHaveProperty("options");
    expect(type.schema().options).toHaveProperty("hotspot", true);
  });

  it("adds fields", () => {
    const type = image({
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
        SanityImage<false>,
        {
          bar?: boolean;
          foo: boolean;
        }
      >
    > = {
      foo: true,
      _type: "image",
      asset: {
        _type: "reference",
        _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
      },
    };
    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      Merge<
        SanityImage<false>,
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
      image({
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
      _type: "image",
      bar: expect.any(String),
      foo: expect.any(Boolean),
      asset: {
        _type: "reference",
        _ref: expect.stringMatching(/^image-\w+-\d+x\d+-\w+$/),
      },
    }));

  it("mocks the same value with the same path", () => {
    expect(image().mock(faker)).toEqual(image().mock(faker));
    expect(image().mock(faker, ".foo")).toEqual(image().mock(faker, ".foo"));

    expect(image().mock(faker, ".foo")).not.toEqual(image().mock(faker));
    expect(image().mock(faker)).not.toEqual(image().mock(faker, ".foo"));
  });

  it("allows defining the mocks", () =>
    expect([
      {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
        },
        foo: true,
        bar: "foo",
      },
      {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
        },
        foo: false,
        bar: "bar",
      },
    ] as const).toContainEqual(
      image({
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
              _type: "image",
              asset: {
                _type: "reference",
                _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
              },
              foo: true,
              bar: "foo",
            },
            {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
              },
              foo: false,
              bar: "bar",
            },
          ] as const),
      }).mock(faker)
    ));

  it("allows defining the zod", () => {
    const type = image({
      zod: (zod) => zod.transform((value) => Object.entries(value)),
    });

    const parsedValue: ValidateShape<
      InferParsedValue<typeof type>,
      Array<[string, "image" | SanityReference]>
    > = type.parse({
      _type: "image",
      asset: {
        _type: "reference",
        _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
      },
    });

    expect(parsedValue).toEqual(
      expect.arrayContaining([
        ["_type", "image"],
        [
          "asset",
          {
            _type: "reference",
            _ref: "image-S2od0Kd5mpOa4Y0Wlku8RvXE",
          },
        ],
      ])
    );
  });

  it("types custom validation", () => {
    const type = image({
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
          const image: ValidateShape<
            typeof value,
            | Merge<
                SanityImage<false>,
                {
                  bar: string;
                  foo?: boolean;
                }
              >
            | undefined
          > = value;

          return !image?.bar || "Needs an empty bar";
        }),
    });

    const rule = mockRule();

    type.schema().validation?.(rule);

    expect(rule.custom).toHaveBeenCalledWith(expect.any(Function));
  });
});

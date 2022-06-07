import { faker } from "@faker-js/faker";
import { z } from "zod";

import type { SanityType } from "../types";
import type { Faker } from "@faker-js/faker";
import type { PortableTextBlock } from "@portabletext/types";

interface BlockType
  extends SanityType<BlockFieldDef<any, any>, z.ZodType<PortableTextBlock>> {}

type BlockDef = Omit<BlockFieldDef<any, any>, "description" | "type">;

export const block = (
  def: BlockDef & {
    mock?: (faker: Faker) => PortableTextBlock;
  } = {}
): BlockType => {
  const {
    mock = (): PortableTextBlock => ({
      style: "normal",
      _type: "block",
      markDefs: [],
      children: [
        {
          _type: "span",
          text: faker.lorem.paragraph(),
          marks: [],
        },
      ],
    }),
  } = def;
  // TODO Validate PortableTextBlock somehow
  const zod = z.any();

  return {
    zod,
    parse: zod.parse.bind(zod),
    mock: () => mock(faker),
    schema: () => ({
      ...def,
      type: "block",
    }),
  };
};

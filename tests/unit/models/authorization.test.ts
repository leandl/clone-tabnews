import authorization from "models/authorization";
import { InternalServerError } from "infra/errors";
import { Feature, features } from "models/feature";
import { User } from "@/models/user";

describe("models/authorization", () => {
  describe(".can()", () => {
    test("without `user`", () => {
      expect(() => {
        // @ts-expect-error runtime test
        authorization.can();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        // @ts-expect-error runtime test
        authorization.can(createdUser, features.CREATE.USER);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.can(createdUser, "unknown:feature" as Feature);
      }).toThrow(InternalServerError);
    });

    test("with valid `user` and known `feature`", () => {
      const createdUser = {
        features: [features.CREATE.USER],
      };

      expect(authorization.can(createdUser, features.CREATE.USER)).toBe(true);
    });
  });

  describe(".filterOutput()", () => {
    test("without `user`", () => {
      expect(() => {
        // @ts-expect-error runtime test
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });

    test("without `user.features`", () => {
      const createdUser = {
        username: "UserWithoutFeatures",
      };

      expect(() => {
        // @ts-expect-error runtime test
        authorization.filterOutput(createdUser, features.READ.USER.DEFAULT);
      }).toThrow(InternalServerError);
    });

    test("with unknown `feature`", () => {
      const createdUser = {
        features: [],
      };

      expect(() => {
        authorization.filterOutput(
          createdUser,
          "unknown:feature" as Feature,
          undefined,
        );
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` but no `resource`", () => {
      const createdUser = {
        features: [features.READ.USER.DEFAULT],
      };

      expect(() => {
        // @ts-expect-error runtime test
        authorization.filterOutput(createdUser, features.READ.USER.DEFAULT);
      }).toThrow(InternalServerError);
    });

    test("with valid `user`, known `feature` and `resource`", () => {
      const createdUser = {
        features: [features.READ.USER.DEFAULT],
      };

      const resource: User = {
        id: "1",
        username: "resource",
        email: "resource@resource.com",
        password: "hashed-password",
        features: [features.READ.USER.DEFAULT],
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
      };

      const result = authorization.filterOutput(
        createdUser,
        features.READ.USER.DEFAULT,
        resource,
      );

      expect(result).toEqual({
        id: "1",
        username: "resource",
        features: [features.READ.USER.DEFAULT],
        created_at: resource.created_at,
        updated_at: resource.updated_at,
      });
    });
  });
});

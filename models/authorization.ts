import { Feature } from "./feature";
import { User } from "./user";

export type UserWithFeatures = {
  features: Feature[];
};

function isAuthenticatedUser(user: User | UserWithFeatures): user is User {
  return "id" in user;
}

type ResourceByFeature = {
  "read:activation_token": undefined;
  "create:session": undefined;
  "create:user": undefined;
  "update:user": User;
};

type Resource<F extends Feature> = ResourceByFeature[F];

function can<F extends Feature>(
  user: User | UserWithFeatures,
  feature: F,
  resource?: Resource<F>,
): boolean {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;

    if (isAuthenticatedUser(user)) {
      if (user.id === resource.id) {
        authorized = true;
      }
    }
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;

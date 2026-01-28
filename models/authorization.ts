import { Feature, features } from "./feature";
import { User } from "./user";

export type UserWithFeatures = {
  features: Feature[];
};

function isAuthenticatedUser(user: User | UserWithFeatures): user is User {
  return "id" in user;
}

type ResourceByFeature = {
  // activation_token
  [features.READ.ACTIVATION_TOKEN]: undefined;

  // session
  [features.CREATE.SESSION]: undefined;
  [features.READ.SESSION]: undefined;

  // user
  [features.CREATE.USER]: undefined;
  [features.UPDATE.USER.SELF]: User;
  [features.UPDATE.USER.OTHERS]: undefined;
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

  if (feature === features.UPDATE.USER.SELF && resource) {
    authorized = false;

    if (isAuthenticatedUser(user)) {
      if (user.id === resource.id || can(user, features.UPDATE.USER.OTHERS)) {
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

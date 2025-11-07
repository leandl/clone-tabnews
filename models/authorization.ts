export type UserWithFeatures = {
  features: string[];
};

function can(user: UserWithFeatures, feature: string) {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  return authorized;
}

const authorization = {
  can,
};

export default authorization;

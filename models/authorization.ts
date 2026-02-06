import { RunMigration } from "node-pg-migrate/dist/migration";
import { UserActivationToken } from "./activation";
import { Feature, features } from "./feature";
import { Session } from "./session";
import { User } from "./user";
import { APIStatus } from "./status";

export type UserWithFeatures = {
  features: Feature[];
};

function isAuthenticatedUser(user: User | UserWithFeatures): user is User {
  return "id" in user;
}

type PermissionContextByFeature = {
  // activation_token
  [features.READ.ACTIVATION_TOKEN]: undefined;

  // session
  [features.CREATE.SESSION]: undefined;
  [features.READ.SESSION]: undefined;

  // user
  [features.READ.USER.DEFAULT]: undefined;
  [features.READ.USER.SELF]: undefined;
  [features.CREATE.USER]: undefined;
  [features.UPDATE.USER.DEFAULT]: User;
  [features.UPDATE.USER.OTHERS]: undefined;

  // migration
  [features.READ.MIGRATION]: undefined;
  [features.CREATE.MIGRATION]: undefined;

  // status
  [features.READ.STATUS.DEFAULT]: undefined;
  [features.READ.STATUS.ALL]: undefined;
};

type PermissionContext<F extends Feature> = PermissionContextByFeature[F];

function can<F extends Feature>(
  user: User | UserWithFeatures,
  feature: F,
  resource?: PermissionContext<F>,
): boolean {
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === features.UPDATE.USER.DEFAULT && resource) {
    authorized = false;

    if (isAuthenticatedUser(user)) {
      if (user.id === resource.id || can(user, features.UPDATE.USER.OTHERS)) {
        authorized = true;
      }
    }
  }

  return authorized;
}

type ResourceFilterContextByFeature = {
  // activation_token
  [features.READ.ACTIVATION_TOKEN]: UserActivationToken;

  // session
  [features.CREATE.SESSION]: undefined;
  [features.READ.SESSION]: Session;

  // user
  [features.READ.USER.DEFAULT]: User;
  [features.READ.USER.SELF]: User;
  [features.CREATE.USER]: undefined;
  [features.UPDATE.USER.DEFAULT]: undefined;
  [features.UPDATE.USER.OTHERS]: undefined;

  // migration
  [features.READ.MIGRATION]: RunMigration[];
  [features.CREATE.MIGRATION]: undefined;

  // status
  [features.READ.STATUS.DEFAULT]: APIStatus;
  [features.READ.STATUS.ALL]: undefined;
};

type ResourceFilterContext<F extends Feature> =
  ResourceFilterContextByFeature[F];

function filterOutput<F extends Feature>(
  userSession: User | UserWithFeatures,
  feature: F,
  resource: ResourceFilterContext<F>,
) {
  if (feature === features.READ.USER.DEFAULT) {
    const user = resource as User;
    return {
      id: user.id,
      username: user.username,
      features: user.features,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  }

  if (feature === features.READ.USER.SELF) {
    const user = resource as User;
    if (isAuthenticatedUser(userSession) && userSession.id === user.id) {
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        features: user.features,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    }
  }

  if (feature === features.READ.SESSION) {
    const session = resource as Session;
    if (
      isAuthenticatedUser(userSession) &&
      userSession.id === session.user_id
    ) {
      return {
        id: session.id,
        token: session.token,
        user_id: session.user_id,
        expires_at: session.expires_at,
        created_at: session.created_at,
        updated_at: session.updated_at,
      };
    }
  }

  if (feature === features.READ.ACTIVATION_TOKEN) {
    const userActivationToken = resource as UserActivationToken;
    return {
      id: userActivationToken.id,
      user_id: userActivationToken.user_id,
      expires_at: userActivationToken.expires_at,
      used_at: userActivationToken.used_at,
      created_at: userActivationToken.created_at,
      updated_at: userActivationToken.updated_at,
    };
  }

  if (feature === features.READ.MIGRATION) {
    const migrations = resource as RunMigration[];
    return migrations.map((migration) => ({
      path: migration.path,
      name: migration.name,
      timestamp: migration.timestamp,
    }));
  }

  if (feature === features.READ.STATUS.DEFAULT) {
    const status = resource as APIStatus;

    const databaseMoreDetail = can(userSession, features.READ.STATUS.ALL)
      ? { version: status.dependencies.database.version }
      : {};

    return {
      updated_at: status.updated_at,
      dependencies: {
        database: {
          max_connections: status.dependencies.database.max_connections,
          opened_connections: status.dependencies.database.opened_connections,
          ...databaseMoreDetail,
        },
      },
    };
  }

  return {};
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;

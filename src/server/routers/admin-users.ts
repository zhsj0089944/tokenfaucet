import { createTRPCRouter } from "../server";
import { adminUsersAccessRouter } from "./admin-users-access";
import { adminUsersCrudRouter } from "./admin-users-crud";
import { adminUsersDeleteRouter } from "./admin-users-delete";
import { adminUsersMembershipRouter } from "./admin-users-membership";
import { adminUsersMiscRouter } from "./admin-users-misc";

export const adminUsersRouter = createTRPCRouter({
	...adminUsersCrudRouter._def.procedures,
	...adminUsersAccessRouter._def.procedures,
	...adminUsersDeleteRouter._def.procedures,
	...adminUsersMembershipRouter._def.procedures,
	...adminUsersMiscRouter._def.procedures,
});

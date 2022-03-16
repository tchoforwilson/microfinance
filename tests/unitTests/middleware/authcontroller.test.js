import {
  protect,
  restrictTo,
  hasRight,
} from "./../../../controllers/authController.js";
import * as RandomVal from "./../../testUtilities/GenRandomVal.js";
describe("Middleware_Tests", () => {
  const len = 12;
  describe("Tests_restrictTo", () => {
    const roles = ["manager", "accountant", "collector"];
    it("It should return 403 as user role is invalid", () => {
      // 1. Build the request body with a user role field
      const next = jest.fn();
      const res = {};
      const req = {
        user: {
          role: RandomVal.GenRandomValidString(len),
        },
      };
      // 2. Call method with user
      const result = restrictTo(roles)(req, res, next);
      console.log(next);
    });
  });
});

module.exports = ({ pascal, camel }) => `import { Router } from "express";
import { ${pascal}Controllers } from "./${camel}.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";;
import validateRequest from "../../middleware/validateRequest"
import { ${pascal}Validations } from "./${camel}.validation";
const router = Router();

router.route("/")
 	.post(
		auth(),
		parseBodyMiddleware,
		validateRequest(${pascal}Validations.create${pascal}Schema),
		${pascal}Controllers.create${pascal}
	)
  .get(${pascal}Controllers.get${pascal}s);

router
	.route("/:id")
	.get(${pascal}Controllers.get${pascal}ById)
	.put(
		auth(),
		parseBodyMiddleware,
		validateRequest(${pascal}Validations.update${pascal}Schema),
	    ${pascal}Controllers.update${pascal})
	.delete(${pascal}Controllers.delete${pascal});

export const ${pascal}Routes = router;`;

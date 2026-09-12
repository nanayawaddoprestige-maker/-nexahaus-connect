import {
  type PipeTransform,
  Injectable,
  type ArgumentMetadata,
} from "@nestjs/common";
import { ZodError, type ZodSchema } from "zod";
import { AppError } from "./app-error";

/**
 * Validates a handler argument against a Zod schema from @nexahaus/validation.
 * Usage: `@Body(new ZodValidationPipe(loginSchema)) body: LoginInput`.
 * On failure throws AppError.validation with per-path details (docs/API.md §2).
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (err) {
      if (err instanceof ZodError) {
        throw AppError.validation(
          "One or more fields are invalid.",
          err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        );
      }
      throw err;
    }
  }
}

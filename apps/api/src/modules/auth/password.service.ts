import { Inject, Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import type { AppConfig } from "@nexahaus/config";
import { APP_CONFIG } from "../../config/config.module";

/**
 * Argon2id password hashing with OWASP-tuned parameters from config
 * (docs/SECURITY.md §1). Verification is constant-time (argon2 handles this).
 */
@Injectable()
export class PasswordService {
  private readonly options: argon2.Options;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.options = {
      type: argon2.argon2id,
      memoryCost: config.auth.argon2.memoryKib,
      timeCost: config.auth.argon2.iterations,
      parallelism: config.auth.argon2.parallelism,
    };
  }

  hash(plain: string): Promise<string> {
    return argon2.hash(plain, this.options);
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain, this.options);
    } catch {
      return false;
    }
  }

  /** True when the stored hash was produced with weaker params and should be re-hashed on next login. */
  needsRehash(hash: string): boolean {
    try {
      return argon2.needsRehash(hash, this.options);
    } catch {
      return false;
    }
  }
}

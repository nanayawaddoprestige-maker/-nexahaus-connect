import { permanentRedirect } from "next/navigation";

/**
 * The former marketing landing page now lives at "/". Kept as a permanent
 * redirect (308) so existing links and bookmarks continue to work.
 */
export default function WelcomeRedirect(): never {
  permanentRedirect("/");
}

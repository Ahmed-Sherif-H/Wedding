/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Google Form embed URL (?embedded=true). See RSVP_SETUP.md */
  readonly VITE_GOOGLE_FORM_URL?: string
  /** @deprecated Prefer VITE_GOOGLE_FORM_URL */
  readonly VITE_RSVP_ENDPOINT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

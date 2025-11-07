/// <reference types="vite/client" />

declare module '*.avif' {
  const src: string
  export default src
}

declare module '*.bmp' {
  const src: string
  export default src
}

declare module '*.gif' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.jpeg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.webp' {
  const src: string
  export default src
}

declare module '*.svg' {
  import * as React from 'react'

  export const ReactComponent: React.FunctionComponent<
    React.SVGProps<SVGSVGElement> & { title?: string }
  >

  const src: string
  export default src
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

interface ImportMetaEnv {
  readonly REACT_APP_GAME_NAME?: string
  readonly REACT_APP_GAME_DESCRIPTION?: string
  readonly REACT_APP_WORBOO_REGISTRY?: string
  readonly REACT_APP_WORBOO_TOKEN?: string
  readonly REACT_APP_WORBOO_SHOP?: string
  readonly REACT_APP_RELAYER_HEALTH_URL?: string
  readonly REACT_APP_ASSISTANT_ENABLED?: string
  readonly REACT_APP_ASSISTANT_URL?: string
  readonly REACT_APP_ASSISTANT_MODEL?: string
  readonly REACT_APP_ASSISTANT_HEADERS?: string
  readonly REACT_APP_ASSISTANT_PROMPT_FIRST?: string
  readonly REACT_APP_ASSISTANT_PROMPT_RETRY?: string
  readonly REACT_APP_NETWORK_CHAIN_ID?: string
  readonly REACT_APP_NETWORK_NAME?: string
  readonly REACT_APP_SHOP_DEMO_MODE?: string
  readonly REACT_APP_ZK_PROOFS_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string }
  export default classes
}

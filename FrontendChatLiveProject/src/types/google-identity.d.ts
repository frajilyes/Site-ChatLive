interface GoogleCredentialResponse {
  readonly credential?: string
  readonly select_by?: string
}

interface GoogleIdConfiguration {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  itp_support?: boolean
  ux_mode?: 'popup' | 'redirect'
}

interface GoogleButtonConfiguration {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void
  renderButton: (parent: HTMLElement, config: GoogleButtonConfiguration) => void
  disableAutoSelect: () => void
  cancel: () => void
}

interface GoogleIdentityNamespace {
  readonly accounts: {
    readonly id: GoogleAccountsId
  }
}

interface Window {
  google?: GoogleIdentityNamespace
}

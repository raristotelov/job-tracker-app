/** App-wide route path constants. Use these instead of raw strings in links and redirects. */
export const ROUTES = {
  HOME:               '/',
  LOGIN:              '/login',
  SIGNUP:             '/signup',
  APPLICATIONS:       '/applications',
  APPLICATION_NEW:    '/applications/new',
  SECTIONS:           '/sections',

  /** Returns the path for an application detail page. */
  APPLICATION_DETAIL: (id: string) => `/applications/${id}`,

  /** Returns the path for an application edit page. */
  APPLICATION_EDIT:   (id: string) => `/applications/${id}/edit`,
} as const;

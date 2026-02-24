// Returns a Proxy so any CSS Module class name access returns the class name string itself.
// e.g. styles.button => "button"
const handler: ProxyHandler<Record<string, string>> = {
  get(_target, prop: string) {
    return prop;
  },
};

const styleMock = new Proxy({} as Record<string, string>, handler);

export default styleMock;

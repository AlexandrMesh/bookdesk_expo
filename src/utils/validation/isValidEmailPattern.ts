export default (email: string) => {
  const regex =
    // eslint-disable-next-line max-len, no-useless-escape
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z_\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  return !!email && regex.test(String(email).toLowerCase());
};

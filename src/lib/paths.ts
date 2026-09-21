export function pathWithoutLocale(pathname: string): string {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean === "/sl") return "";
  if (clean.startsWith("/sl/")) return clean.slice(4);
  return clean === "/" ? "" : clean.replace(/^\//, "");
}

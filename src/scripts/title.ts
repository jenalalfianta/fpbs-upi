export function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Fakultas Pendidikan Bahasa dan Sastra - Beranda";
  const words = pathname.replace(/\//g, '').split('-');
  const capitalized = words.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `Fakultas Pendidikan Bahasa dan Sastra - ${capitalized}`;
}
export function getPageTitle(pathname: string): string {
  if (pathname === "/") return "Fakultas Pendidikan Bahasa dan Sastra - Beranda";

  const parts = pathname.split('/').filter(Boolean); // buang '' kosong
  const lastSegment = parts[parts.length - 1]; // ambil bagian terakhir path
  const words = lastSegment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1));
  const label = words.join(' ');

  return `Fakultas Pendidikan Bahasa dan Sastra - ${label}`;
}

export const tabIdMapIdToEn = {
  'profil': 'profile',
  'akreditasi': 'accreditation',
  'dosen': 'faculty-members',
  'pengembangan-akademik': 'academic-development',
  'fasilitas': 'facilities',
  'kurikulum': 'curriculum',
  'pmb': 'admissions',
  'visi-plo-s2': 'visi-plo-s2',
  'visi-plo-s3': 'visi-plo-s3',
};
export const tabIdMapEnToId = Object.fromEntries(
  Object.entries(tabIdMapIdToEn).map(([idKey, enKey]) => [enKey, idKey])
);

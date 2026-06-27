import fs from 'fs';
fetch('https://raw.githubusercontent.com/NikhilGoral28/SwasthPath/main/lib/screens/admin/sub_dist/auth_apply_scheme.dart')
  .then(r => r.text())
  .then(t => fs.writeFileSync('temp.dart', t));

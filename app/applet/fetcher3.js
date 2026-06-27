const fs = require('fs');
fetch('https://raw.githubusercontent.com/NikhilGoral28/SwasthPath/main/lib/screens/admin/sub_dist/admin_home.dart')
  .then(r => r.text())
  .then(t => { fs.writeFileSync('/app/applet/admin_home.dart', t); console.log("Done"); });

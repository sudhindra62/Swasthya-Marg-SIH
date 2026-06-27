const urls = [
  'lib/screens/admin/sub_dist/admin_report.dart',
  'lib/screens/admin/sub_dist/certificate_screen.dart',
  'lib/screens/admin/dist_state/ds_alert_page.dart',
  'lib/screens/admin/super/super_admin_banner.dart',
  'lib/screens/admin/super/super_admin_report.dart'
];
Promise.all(urls.map(u => fetch('https://raw.githubusercontent.com/NikhilGoral28/SwasthPath/main/' + u).then(r => r.text()).then(t => console.log('=== ' + u + ' ===\n' + t.substring(0, 1000) + '\n'))));

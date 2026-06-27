fetch('https://api.github.com/repos/NikhilGoral28/SwasthPath/git/trees/main?recursive=1').then(r=>r.json()).then(d => d.tree.forEach(f => console.log(f.path)));

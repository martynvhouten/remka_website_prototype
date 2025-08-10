(function(){
  const brands = [
    { name:'3M', slug:'3m', image:'/assets/images/Brands/3M_logo.jpg' },
    { name:'BD', slug:'bd', image:'/assets/images/Brands/BD_logo.jpg' },
    { name:'HEINE', slug:'heine', image:'/assets/images/Brands/HEINE_logo.jpg' },
    { name:'Johnson & Johnson', slug:'johnson-johnson', image:'/assets/images/Brands/Johnson_Johnson_logo.jpg' },
    { name:'KAI Medical', slug:'kai-medical', image:'/assets/images/Brands/KAI_Medical_logo.jpg' },
    { name:'Mada', slug:'mada', image:'/assets/images/Brands/Mada_logo.jpg' },
    { name:'Medipharchem', slug:'medipharchem', image:'/assets/images/Brands/Medipharchem_logo.jpg' },
    { name:'Mölnlycke', slug:'molnlycke', image:'/assets/images/Brands/Molnlycke_logo.jpg' },
    { name:'Orphi Farma', slug:'orphi-farma', image:'/assets/images/Brands/Orphi_Farma_logo.jpg' },
    { name:'Roche', slug:'roche', image:'/assets/images/Brands/Roche_logo.jpg' },
    { name:'Schülke', slug:'schulke', image:'/assets/images/Brands/Schulke_logo.jpg' },
    { name:'seca', slug:'seca', image:'/assets/images/Brands/seca_logo.jpg' },
    { name:'Servoprax', slug:'servoprax', image:'/assets/images/Brands/Servoprax_logo.jpg' },
    { name:'Welch Allyn', slug:'welch-allyn', image:'/assets/images/Brands/Welch_Allyn_logo.jpg' },
  ];

  function renderCarousel(){
    const track = document.getElementById('brandsTrack'); if(!track) return;
    track.innerHTML = '';
    const itemClass = 'snap-start shrink-0 w-[190px] md:w-[220px]';
    brands.forEach(b=>{
      const li = document.createElement('li');
      li.className = itemClass;
      const a = document.createElement('a');
      a.href = `/brand-${b.slug}.html`;
      a.className = 'block card card--hover p-4 h-[120px] flex items-center justify-center group';
      const img = document.createElement('img');
      img.src = b.image;
      img.alt = b.name;
      img.loading = 'lazy';
      img.className = 'max-h-16 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity';
      img.onerror = () => { img.src = '/assets/images/placeholder-square.svg'; img.classList.add('border','border-light','rounded'); };
      a.appendChild(img);
      li.appendChild(a); track.appendChild(li);
    });
    const host = document.getElementById('brandsCarousel');
    const prev = document.querySelector('[data-brands-prev]');
    const next = document.querySelector('[data-brands-next]');
    if(host && prev && next){
      // Prevent vertical wheel from navigating browser history when hovering carousel
      host.addEventListener('wheel', (e) => {
        if(Math.abs(e.deltaX) < Math.abs(e.deltaY)){
          e.preventDefault();
          host.scrollBy({ left: e.deltaY, behavior: 'auto' });
        }
      }, { passive: false });
      const step = 200;
      prev.addEventListener('click', ()=> host.scrollBy({ left: -step, behavior: 'smooth' }));
      next.addEventListener('click', ()=> host.scrollBy({ left: step, behavior: 'smooth' }));
    }
  }

  function renderGrid(){
    const grid = document.getElementById('brandsGrid'); if(!grid) return;
    const azHost = document.getElementById('azNav');
    const search = document.getElementById('brandSearch');

    // Build A–Z
    const letters = Array.from(new Set(brands.map(b=> (b.name[0]||'').toUpperCase()))).sort();
    if(azHost){
      letters.forEach(l=>{
        const btn = document.createElement('button');
        btn.className = 'px-2 py-1 text-sm rounded-md border border-light bg-white hover:bg-light/40';
        btn.textContent = l; btn.setAttribute('data-letter', l);
        azHost.appendChild(btn);
      });
    }

    const draw = () => {
      const q = (search && search.value || '').trim().toLowerCase();
      const activeBtn = document.querySelector('[data-letter].active');
      const activeLetter = activeBtn ? activeBtn.getAttribute('data-letter') : 'all';
      grid.innerHTML = '';
      let list = brands.slice();
      if(q) list = list.filter(b => b.name.toLowerCase().includes(q));
      if(activeLetter && activeLetter !== 'all') list = list.filter(b => (b.name[0]||'').toUpperCase() === activeLetter);
      list.sort((a,b)=> a.name.localeCompare(b.name, 'nl'));
      list.forEach(b=>{
        const a = document.createElement('a');
        a.href = `/brand-${b.slug}.html`;
        a.className = 'card card--hover p-4 flex items-center justify-center h-[150px]';
        a.id = b.slug;
        const img = document.createElement('img');
        img.src = b.image; img.alt = b.name; img.loading = 'lazy';
        img.className = 'max-h-20 w-auto object-contain opacity-90 hover:opacity-100 transition-opacity';
        img.onerror = () => { img.src = '/assets/images/placeholder-square.svg'; img.classList.add('border','border-light','rounded'); };
        a.appendChild(img);
        grid.appendChild(a);
      });
    };

    // Interactions
    if(search) search.addEventListener('input', draw);
    const allBtn = document.querySelector('[data-letter="all"]');
    if(allBtn){
      allBtn.addEventListener('click', ()=>{ document.querySelectorAll('[data-letter]').forEach(b=>b.classList.remove('active')); allBtn.classList.add('active'); draw(); });
      allBtn.classList.add('active');
    }
    azHost && azHost.querySelectorAll('button').forEach(btn => btn.addEventListener('click', ()=>{ document.querySelectorAll('[data-letter]').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); draw(); }));

    draw();
  }

  function init(){ renderCarousel(); renderGrid(); }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

  // Ensure rendering after partials are injected
  document.addEventListener('partials:loaded', init);
})();



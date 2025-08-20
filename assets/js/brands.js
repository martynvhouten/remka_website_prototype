(function(){
  const brands = [
    { name:'3M', slug:'3m', image:'/assets/images/Brands/3M_logo.webp' },
    { name:'BD', slug:'bd', image:'/assets/images/Brands/BD_logo.webp' },
    { name:'HEINE', slug:'heine', image:'/assets/images/Brands/HEINE_logo.webp' },
    { name:'Johnson & Johnson', slug:'johnson-johnson', image:'/assets/images/Brands/Johnson_Johnson_logo.webp' },
    { name:'KAI Medical', slug:'kai-medical', image:'/assets/images/Brands/KAI_Medical_logo.webp' },
    { name:'Mada', slug:'mada', image:'/assets/images/Brands/Mada_logo.webp' },
    { name:'Medipharchem', slug:'medipharchem', image:'/assets/images/Brands/Medipharchem_logo.webp' },
    { name:'Mölnlycke', slug:'molnlycke', image:'/assets/images/Brands/Molnlycke_logo.webp' },
    { name:'Orphi Farma', slug:'orphi-farma', image:'/assets/images/Brands/Orphi_Farma_logo.webp' },
    { name:'Roche', slug:'roche', image:'/assets/images/Brands/Roche_logo.webp' },
    { name:'Schülke', slug:'schulke', image:'/assets/images/Brands/Schulke_logo.webp' },
    { name:'seca', slug:'seca', image:'/assets/images/Brands/seca_logo.webp' },
    { name:'Servoprax', slug:'servoprax', image:'/assets/images/Brands/Servoprax_logo.webp' },
    { name:'Welch Allyn', slug:'welch-allyn', image:'/assets/images/Brands/Welch_Allyn_logo.webp' },
  ];

  function renderCarousel(){
    const track = document.getElementById('brandsTrack'); if(!track) return;
    track.innerHTML = '';
    brands.forEach(b=>{
      const li = document.createElement('li');
      li.className = 'slider__slide';
      const a = document.createElement('a');
      a.href = `/brand-${b.slug}.html`;
      a.className = 'block p-4 h-[110px] flex items-center justify-center group border border-light rounded-[0.75rem] bg-white';
      const img = document.createElement('img');
      img.src = b.image;
      img.alt = b.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.fetchPriority = 'low';
      img.width = 160; img.height = 48;
      // Intrinsic sizes only; no srcset variants to avoid 404s (assets not present)
      img.sizes = '(min-width: 1024px) 10vw, (min-width: 768px) 16vw, 40vw';
      a.appendChild(img);
      img.className = 'max-h-12 w-auto object-contain opacity-90 group-hover:opacity-100 transition-opacity';
      img.onerror = () => { img.src = '/assets/images/placeholder-square.svg'; img.classList.add('border','border-light','rounded'); };
      li.appendChild(a); track.appendChild(li);
    });
    // Slider behavior, arrows, snap, keyboard, autoplay are handled by the generic slider initializer via [data-slider]
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



/* ============================================================
   CLEARCARE — CONNECT PAGE JS
   Handles filter UI and will call HRSA + Google Places in production
   ============================================================ */

let activeFilters = { type: 'all', insurance: 'any_ins' };

function toggleFilter(el, category) {
  const group = el.parentElement.querySelectorAll('.filter-pill');
  group.forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  activeFilters[category] = el.dataset.val || el.textContent.trim().toLowerCase().replace(/\s+/g, '_');
  // TODO: re-run search with updated filters
}

function searchResources() {
  const location = document.getElementById('locationInput').value.trim();
  if (!location) {
    document.getElementById('locationInput').focus();
    document.getElementById('locationInput').style.borderColor = 'var(--red)';
    return;
  }
  document.getElementById('locationInput').style.borderColor = '';

  // TODO: In production, call HRSA API + Google Places API
  // GET https://findahealthcenter.hrsa.gov/api/search?address={location}&pageSize=10
  // Then filter results by activeFilters

  const area = document.getElementById('resultsArea');
  area.innerHTML = `<div style="text-align:center;padding:40px;color:var(--gray-500);">Searching near <strong>${location}</strong>…</div>`;

  setTimeout(() => {
    area.innerHTML = `
      <div style="font-size:13px;color:var(--gray-500);margin-bottom:20px;">3 results near ${location} · Connect your HRSA API key to see real results</div>
      <div class="clinic-card">
        <div class="clinic-dot"></div>
        <div style="flex:1;">
          <div class="clinic-name">Community Health Center of ${location}</div>
          <div class="clinic-meta">1.4 miles · Open today 8am–6pm · English, Spanish</div>
          <div class="clinic-chips">
            <span class="chip chip-ok">Free / sliding scale</span>
            <span class="chip" style="background:var(--blue-mist);color:var(--blue-deep);">Uninsured welcome</span>
          </div>
        </div>
        <a href="#" class="btn btn-outline" style="flex-shrink:0;">Directions</a>
      </div>
      <div class="clinic-card">
        <div class="clinic-dot" style="background:var(--blue-mid);"></div>
        <div style="flex:1;">
          <div class="clinic-name">Neighborhood Urgent Care</div>
          <div class="clinic-meta">2.9 miles · Open today 9am–9pm · English</div>
          <div class="clinic-chips">
            <span class="chip" style="background:var(--amber-light);color:#92400E;">Sliding scale</span>
            <span class="chip" style="background:var(--blue-mist);color:var(--blue-deep);">Accepts Medicaid</span>
            <span class="chip" style="background:var(--blue-mist);color:var(--blue-deep);">Telehealth</span>
          </div>
        </div>
        <a href="#" class="btn btn-outline" style="flex-shrink:0;">Directions</a>
      </div>
    `;
  }, 1500);
}

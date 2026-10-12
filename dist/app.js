const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
function closeMenu() { navigation.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }
menu.addEventListener('click', () => { const open = navigation.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && navigation.classList.contains('open')) { closeMenu(); menu.focus(); } });
document.querySelectorAll('[data-programme]').forEach(link => link.addEventListener('click', () => { document.querySelector('#programme').value = link.dataset.programme; }));
document.querySelector('#enquiry-form').addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const subject = `Belhaven enquiry: ${data.get('programme')}`;
  const body = `Hello Belhaven Montessori School,\n\nMy name is ${String(data.get('name')).trim()}. I am interested in ${data.get('programme')}.\n\n${String(data.get('message')).trim()}\n\nKind regards,\n${String(data.get('name')).trim()}`;
  window.location.href = `mailto:alameen9825@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  document.querySelector('#form-status').textContent = 'Your email draft is ready to open. If no email app opens, write to alameen9825@gmail.com or call 024 491 9825. Your enquiry has not been sent by this website.';
});
const dialog = document.querySelector('#photo-dialog');
document.querySelectorAll('[data-image]').forEach(button => button.addEventListener('click', () => { const photo = document.querySelector('#expanded-photo'); photo.src = button.dataset.image; photo.alt = button.dataset.caption; document.querySelector('#photo-caption').textContent = button.dataset.caption; dialog.showModal(); }));
document.querySelector('#close-photo').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
document.querySelector('#year').textContent = new Date().getFullYear();

const bannerPhotos = [
  ['assets/community.jpg', 'Belhaven pupils learning together outdoors among the school trees', 'Learning and growing together'],
  ['assets/hero.jpg', 'Belhaven quiz team at the Junior Science and Maths Quiz', 'Confidence on the national stage'],
  ['assets/primary.jpg', 'Primary school life at Belhaven', 'A foundation for lifelong learning']
];
let bannerIndex = 0;
function changeBanner(direction) {
  bannerIndex = (bannerIndex + direction + bannerPhotos.length) % bannerPhotos.length;
  const [src, alt, caption] = bannerPhotos[bannerIndex];
  const image = document.querySelector('#banner-image'); image.src = src; image.alt = alt;
  document.querySelector('#slide-caption').textContent = caption;
}
document.querySelector('.previous').addEventListener('click', () => changeBanner(-1));
document.querySelector('.next').addEventListener('click', () => changeBanner(1));

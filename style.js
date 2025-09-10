const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
menuToggle.addEventListener("click", () => {
navLinks.classList.toggle("active");});
    const pricingBoxes = document.querySelectorAll('.pricing-box');
    pricingBoxes.forEach(box => {
      box.addEventListener('click', () => {
        pricingBoxes.forEach(b => b.classList.remove('active'));
        box.classList.add('active');
      });
    });
        document.querySelectorAll('.pricing-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.preventDefault();
        const targetId = btn.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
          behavior: 'smooth'
        });
      });
    });
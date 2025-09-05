// Import your Firebase config
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyBNaxvvv_w3DimTJHIbLWRNpGyZDR9ET70",
    authDomain: "robodex-4f848.firebaseapp.com",
    projectId: "robodex-4f848",
    storageBucket: "robodex-4f848.firebasestorage.app",
    messagingSenderId: "28240235204",
    appId: "1:28240235204:web:2e7c3cdbb59dd6aa139791",
    measurementId: "G-BRWP89KCJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Reference to members container
const membersContainer = document.querySelector(".members-grid");

async function fetchMembers() {
  const membersSnapshot = await getDocs(collection(db, "members"));
  const members = [];

  membersSnapshot.forEach(doc => {
    members.push(doc.data());
  });
  
  // Sort so president card goes on top
  const president = members.find(m => m.isPresident);
  const others = members.filter(m => !m.isPresident);

  if (president) {
    const prezCard = createMemberCard(president, true, 0);
    membersContainer.appendChild(prezCard);
  }

  others.forEach((member, index) => {
    const card = createMemberCard(member, false, index + 1);
    membersContainer.appendChild(card);
  });
}

function createMemberCard(member, isPresident, index) {
  const card = document.createElement("div");
  card.className = isPresident ? "member-card prez" : "member-card";
  card.style.backgroundImage = `url(${member.imageURL})`;
  card.dataset.index = index;
  return card;
}

// Run fetch on load
fetchMembers();
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const navMenu = document.querySelector('.navbar ul');
  
  if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenuToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    document.querySelectorAll('.navbar ul a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuToggle.classList.remove('active');
        navMenu.classList.remove('active');
      });
    });
  }
});

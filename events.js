// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase config
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

// Reference to the grid container
const eventsContainer = document.querySelector(".members-grid");

// Fetch and render events
async function fetchEvents() {
  console.log("Fetching events...");

  try {
    const querySnapshot = await getDocs(collection(db, "events"));
    let index = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Event data:", data);

      const card = createEventCard(data, index++);
      eventsContainer.appendChild(card);
    });

  } catch (error) {
    console.error("Error fetching events:", error);
  }
}

// Create individual event card
function createEventCard(event, index) {
  const card = document.createElement("div");
  card.className = "member-card";
  card.style.backgroundImage = `url(${event.imageURL})`;
  card.dataset.index = index;

  card.onclick = () => {
    window.open(event.link, "_blank");
  };

  const info = document.createElement("div");
  info.className = "member-info";
  info.innerHTML = `
    <div>${event.name}</div>
    <div class="role">${event.date}</div>
  `;

  card.appendChild(info);
  return card;
}

// Start
fetchEvents();
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


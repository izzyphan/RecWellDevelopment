function r_e(id) {
  return document.querySelector(`#${id}`);
}

function toggleNavbar() {
  var navbarLinks = document.getElementById("navbar-links");
  if (navbarLinks.style.display === "block") {
    navbarLinks.style.display = "none";
  } else {
    navbarLinks.style.display = "block";
  }
}

// message bar popup
function configure_message_bar(message) {
  r_e("message_bar").classList.remove("is-hidden");

  r_e("message_bar").innerHTML = message;

  // hide the message bar
  setTimeout(() => {
    r_e("message_bar").classList.add("is-hidden");
    // clear values in bar
    r_e("message_bar").innerHTML = "";
  }, 5000);
}

// burger js
function toggleMenu() {
  var menu = document.getElementById("menu");
  menu.classList.toggle("active");
}

// change html of main content when you click directory
// Get the link element with the class directory
var directoryLink = r_e("directory");

// Get the div element with the ID main-content
var mainContentDiv = r_e("main-content");

// Add click event listener to the link
directoryLink.addEventListener("click", function (event) {
  // Prevent default link behavior
  event.preventDefault();

  // Change the HTML content of the div
  mainContentDiv.innerHTML = "<p>This is the new content.</p>";
});

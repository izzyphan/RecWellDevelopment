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

// // burger js
// function toggleMenu() {
//   var menu = document.getElementById("menu");
//   menu.classList.toggle("active");
// }

// // When you click directory, the html in div main-content will change to html from directory.html
// document
//   .getElementById("directory")
//   .addEventListener("click", function (event) {
//     event.preventDefault(); // Prevent default link behavior

//     // Fetch the HTML content from a separate file
//     fetch("directory.html")
//       .then((response) => {
//         if (!response.ok) {
//           throw new Error("Network response was not ok");
//         }
//         return response.text(); // Get the response text
//       })
//       .then((html) => {
//         console.log("HTML content fetched successfully:", html);
//         // Set the innerHTML of the element with id "new-content" to the fetched HTML content
//         document.getElementById("main-content").innerHTML = html;
//         document.getElementById("main-content").style.display = "block";
//       })
//       .catch((error) => console.error("Error fetching HTML:", error));
//   });

// // When you click talent turnstile, the html in div main-content will change to html from talent.html
// document.getElementById("talent").addEventListener("click", function (event) {
//   event.preventDefault(); // Prevent default link behavior

//   // Fetch the HTML content from a separate file
//   fetch("talent.html")
//     .then((response) => response.text()) // Get the response text
//     .then((html) => {
//       // Set the innerHTML of the element with id "main-content" to the fetched HTML content
//       r_e("main-content").style.display = "block";
//       document.getElementById("main-content").innerHTML = html;
//     })
//     .catch((error) => console.error("Error fetching HTML:", error));
// });

// // When you click my account, the html in div main-content will change to html from myaccount.html
// document
//   .getElementById("myaccount")
//   .addEventListener("click", function (event) {
//     event.preventDefault(); // Prevent default link behavior

//     // Fetch the HTML content from a separate file
//     fetch("myaccount.html")
//       .then((response) => response.text()) // Get the response text
//       .then((html) => {
//         // Set the innerHTML of the element with id "main-content" to the fetched HTML content
//         document.getElementById("main-content").innerHTML = html;
//       })
//       .catch((error) => console.error("Error fetching HTML:", error));
//   });

// // When you click points, the html in div main-content will change to html from points.html
// document.getElementById("points").addEventListener("click", function (event) {
//   event.preventDefault(); // Prevent default link behavior

//   // Fetch the HTML content from a separate file
//   fetch("points.html")
//     .then((response) => response.text()) // Get the response text
//     .then((html) => {
//       // Set the innerHTML of the element with id "main-content" to the fetched HTML content
//       document.getElementById("main-content").innerHTML = html;
//     })
//     .catch((error) => console.error("Error fetching HTML:", error));
// });

// // When you click the rec well logo, the html in div main-content will change to html from home.html
// document.getElementById("logo").addEventListener("click", function (event) {
//   event.preventDefault(); // Prevent default link behavior

//   // Fetch the HTML content from a separate file
//   fetch("home.html")
//     .then((response) => response.text()) // Get the response text
//     .then((html) => {
//       // Create a temporary element to hold the fetched HTML
//       var tempElement = document.createElement("div");
//       tempElement.innerHTML = html;

//       // Extract the content of the main-content div
//       var mainContentHtml =
//         tempElement.querySelector("#main-content").innerHTML;

//       // Set the innerHTML of the current page's main-content div to the fetched HTML content
//       document.getElementById("main-content").innerHTML = mainContentHtml;
//     })
//     .catch((error) => console.error("Error fetching HTML:", error));
// });

// Function to fetch and load HTML content dynamically
function loadContent(url) {
  // Fetch the HTML content from the specified URL
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text(); // Get the response text
    })
    .then((html) => {
      // Set the innerHTML of the main-content div to the fetched HTML content
      document.getElementById("main-content").innerHTML = html;
    })
    .catch((error) => console.error("Error fetching HTML:", error));
}

// Event listener for clicks on the document
document.addEventListener("click", function (event) {
  console.log("Clicked element:", event.target);

  // Check if the clicked element is a link with one of the specified IDs
  if (event.target.matches("#directory, #talent, #myaccount, #points")) {
    event.preventDefault(); // Prevent default link behavior

    // Get the ID of the clicked element
    var id = event.target.id;

    console.log("Clicked link ID:", id);

    // Define the corresponding URL based on the clicked element's ID
    var url;
    switch (id) {
      case "directory":
        url = "directory.html";
        break;
      case "talent":
        url = "talent.html";
        break;
      case "myaccount":
        url = "myaccount.html";
        break;
      case "points":
        url = "points.html";
        break;
      case "logo":
        url = "home.html";
        break;
    }

    console.log("Loading URL:", url);

    // Load the content corresponding to the clicked link
    loadContent(url);
  } else if (event.target.matches("#logo")) {
    event.preventDefault(); // Prevent default link behavior

    console.log("Clicked logo");

    // Load the home content
    loadContent("home.html");
  } else if (!event.target.closest(".modal")) {
    // If the click is not within the modal or a link, hide the modal
    console.log("Clicked outside modal or link");
    // r_e("modal-hidden").style.display = "none";
    // document.getElementById("modal-hidden").classList.add("modal-hidden");
  }
});

// Show modal when the page loads
// window.addEventListener("load", function () {
//   toggleModal(); // Show modal
// });

// Firebase Sign Up and Log In
document
  .getElementById("loginform")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    // Get form input values
    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    // Determine which button was clicked
    var submitButtonValue = event.submitter.value;

    if (submitButtonValue === "Log In") {
      // Perform login logic here
      auth.signInWithEmailAndPassword(username, password).then((cred) => {
        const modal = document.getElementById("loginModal");
        document.getElementById("loginform").reset();

        r_e("loginModal").style.display = "none";
        r_e("main-content").style.display = "block";
      });
    } else if (submitButtonValue === "Sign Up") {
      // Perform sign-up logic here
      auth.createUserWithEmailAndPassword(username, password).then((cred) => {
        const modal = document.getElementById("loginModal");
        document.getElementById("loginform").reset();

        r_e("loginModal").style.display = "none";
        r_e("main-content").style.display = "block";
      });
    }
  });

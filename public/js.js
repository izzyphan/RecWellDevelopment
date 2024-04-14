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
  var messageBar = r_e("message_bar");

  // Display the message and set its content
  messageBar.style.display = "block";
  messageBar.innerHTML = message;

  // Hide the message bar after 5 seconds
  setTimeout(() => {
    messageBar.innerHTML = ""; // Clear the message content
  }, 5000);
}

// Function to fetch and load HTML content dynamically
function loadContent(url, options = {}) {
  // Hide the modal
  hideModal();

  // Fetch the HTML content from the specified URL
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text(); // Get the response text
    })
    .then((html) => {
      // Exclude modal content if loading home.html
      if (url !== "home.html") {
        // Set the innerHTML of the main-content div to the fetched HTML content
        document.getElementById("main-content").innerHTML = html;
      } else {
        // Extract the main content from the loaded HTML
        var tempElement = document.createElement("div");
        tempElement.innerHTML = html;
        var mainContentHtml =
          tempElement.querySelector("#main-content").innerHTML;
        document.getElementById("main-content").innerHTML = mainContentHtml;
        // Check if a message is provided in the options
        if (options.message) {
          // Configure and display the message bar with the provided message
          configure_message_bar(options.message);
        }
      }
    })
    .catch((error) => console.error("Error fetching HTML:", error));
}

// Event listener for clicks on the document
document.addEventListener("click", function (event) {
  // Check if the clicked element is a link with one of the specified IDs
  if (
    event.target.matches(
      "#directory, #talent, #myaccount, #points, #home-logo, #admin"
    )
  ) {
    event.preventDefault(); // Prevent default link behavior

    // Get the ID of the clicked element
    var id = event.target.id;

    // Define the corresponding URL based on the clicked element's ID
    var url;
    switch (id) {
      case "directory":
        url = "directory.html";
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;

            checkAdminStatusAndHideElement(userEmail, "admin-status");
          }
        });

        loadDirectory();
        break;
      case "talent":
        url = "talent.html";
        displayMostRecentBlog();
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;
            var blogForm = "blogContainer";
            checkAdminStatusAndHideElement(userEmail, blogForm);
            checkAdminStatusAndHideElement(userEmail, "admin-status");
          }
          adminDropdown();
        });

        break;
      case "myaccount":
        url = "myaccount.html";
        // Load user data when "My Account" link is clicked
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userId = user.uid;
            loadUserData(userId); // Load user data into the form

            // Set the URL after loading user data (e.g., redirect to myaccount.html)
            url = "myaccount.html";
            // Save the current URL to localStorage
            saveStateToStorage({ url });
            // Load the content corresponding to the clicked link
            // loadContent(url);
          } else {
            console.log("User is not authenticated.");
          }
        });
        break;
      case "points":
        url = "points.html";
        // Call checkAdminStatusAndHideElement when loading points.html and talent.html
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;
            var elementIdToHide = "penalty_container"; // Replace with ID of the element to hide

            checkAdminStatusAndHideElement(userEmail, elementIdToHide);
            checkAdminStatusAndHideElement(userEmail, "admin-status");
          }
        });
        break;
      case "home-logo":
        url = "home.html";
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;
            var elementIdToHide = "admin-status"; // Replace with ID of the element to hide

            checkAdminStatusAndHideElement(userEmail, elementIdToHide);
          }
        });
        break;
    }
    // Save the current URL to localStorage
    saveStateToStorage({ url });
    // Load the content corresponding to the clicked link
    loadContent(url);
  }
});
// Call loadLastVisitedUrl when the page loads or is refreshed
window.addEventListener("load", loadLastVisitedUrl);

// Function to handle login form submission
function handleLoginFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var username = document.getElementById("l_username").value;
  var password = document.getElementById("l_password").value;

  // Determine which button was clicked
  var submitButtonValue = event.submitter.value;

  if (submitButtonValue === "Log In") {
    // Check if the username exists in Firestore
    db.collection("employees")
      .where("email", "==", username)
      .get()
      .then((querySnapshot) => {
        if (querySnapshot.empty) {
          // Username doesn't exist, show "create account" message
          document.querySelector(".error_message1").innerHTML =
            "Create An Account!";
        } else {
          // Username exists, try to sign in with Firebase Authentication
          auth
            .signInWithEmailAndPassword(username, password)
            .then((cred) => {
              document.getElementById("loginform").reset();
              hideModal();
              showMainContent();

              // Redirect user to home page after successful login
              loadContent("home.html", {
                message: username + " " + "is now logged in.",
              });
              checkAdminStatusAndHideElement(username, "admin-status");
              if (window.location.pathname.endsWith("/points.html")) {
                checkAdminStatusAndHideElement(username, "penalty_container");
              }
            })
            .catch((error) => {
              let errorMessage = error.message;
              document.querySelector(".error_message1").innerHTML =
                "Incorrect Password";

              // Keep the modal visible on incorrect password
              showModal();
            });
        }
      })
      .catch((error) => {
        console.error("Error checking username in Firestore:", error);
      });
  }
}

/// Function to handle signup form submission
function handleSignupFormSubmission(event) {
  event.preventDefault();
  // Get form input values
  var s_username = document.getElementById("s_username").value;
  var s_password = document.getElementById("s_password").value;
  var firstName = document.getElementById("f_name").value;
  var lastName = document.getElementById("l_name").value;

  // Perform sign-up logic here
  auth
    .createUserWithEmailAndPassword(s_username, s_password)
    .then((cred) => {
      // Get the authenticated user
      var user = cred.user;

      // Store user information in Firestore
      return db.collection("employees").doc(user.uid).set({
        firstName: firstName,
        email: s_username,
        lastName: lastName,
        // Add more employee details as needed
      });
    })
    .then(() => {
      // Reset the signup form
      document.getElementById("signupform").reset();
      // Show main content
      showMainContent();
      // Redirect user to home page after successful login
      loadContent("home.html", {
        message: s_username + " " + "is now logged in.",
      });
      checkAdminStatusAndHideElement(s_username, "admin-status");
      // Hide the modal
      hideModal();
    })
    .catch((error) => {
      // Handle authentication errors
      console.error("Error creating user:", error);
      // Check if the error is due to email already existing
      if (error.code === "auth/email-already-in-use") {
        // Display error message
        document.querySelector(".error_message2").innerHTML =
          "Email already in use. Please use a different email.";
      } else {
        // Display generic error message
        document.querySelector(".error_message2").innerHTML =
          "Error creating user";
      }
    });
}

// // Function to save state information in localStorage
function saveStateToStorage(stateData) {
  localStorage.setItem("currentState", JSON.stringify(stateData));
}

// Function to load state information from localStorage
function loadStateFromStorage() {
  const storedState = localStorage.getItem("currentState");
  return storedState ? JSON.parse(storedState) : null;
}

// Function to load the last visited URL from localStorage
function loadLastVisitedUrl() {
  const stateData = loadStateFromStorage();
  if (stateData && stateData.url) {
    loadContent(stateData.url);
    // Check if the last visited URL ends with "talent.html" and call displayMostRecentBlog
    if (stateData.url.endsWith("talent.html")) {
      displayMostRecentBlog();
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var userEmail = user.email;
          var blogForm = "blogContainer";

          checkAdminStatusAndHideElement(userEmail, blogForm);
          checkAdminStatusAndHideElement(userEmail, "admin-status");
        }
      });
      adminDropdown();
    }
    if (stateData.url.endsWith("points.html")) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var userEmail = user.email;
          var elementIDToHide = "penalty_container"; // Replace with ID of the element to hide on points.html
          checkAdminStatusAndHideElement(userEmail, elementIDToHide);
        }
      });
    }
    if (stateData.url.endsWith("directory.html")) {
      loadDirectory();
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var userEmail = user.email;

          checkAdminStatusAndHideElement(userEmail, "admin-status");
        }
      });
    }
    if (stateData.url.endsWith("home.html")) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var userEmail = user.email;
          var elementIDToHide = "admin-status"; // Replace with ID of the element to hide/show on the home page
          checkAdminStatusAndHideElement(userEmail, elementIDToHide);
        }
      });
    }
    if (stateData.url.endsWith("myaccount.html")) {
      firebase.auth().onAuthStateChanged(function (user) {
        if (user) {
          var userId = user.uid;
          loadUserData(userId); // Load user data into the form
        }
      });
    }
  } else {
    // Default action (e.g., load home page)
    loadContent("home.html");
  }
}

// Attach event listeners to login and signup forms
document
  .getElementById("loginform")
  .addEventListener("submit", handleLoginFormSubmission);
document
  .getElementById("signupform")
  .addEventListener("submit", handleSignupFormSubmission);

function showMainContent() {
  r_e("main-content").style.display = "block";
}

// Function to hide the main content
function hideMainContent() {
  r_e("main-content").style.display = "none";
}

// Function to show the modal
function showModal() {
  r_e("loginModal").style.display = "block";
  r_e("signupModal").style.display = "none";
}

// Function to hide the modal
function hideModal() {
  r_e("loginModal").style.display = "none";
  r_e("signupModal").style.display = "none";
}

// Function to check the authentication state on page load
function checkAuthState() {
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in
      showMainContent();
      hideModal();

      // Get the authenticated user's ID
      var userId = user.uid;
    } else {
      // User is signed out, show the modal
      showModal();
      hideMainContent();
    }
  });
}

// Function to handle logout
function handleLogout() {
  auth.signOut().then(() => {
    // Reload the page to trigger the onAuthStateChanged listener
    window.location.href = "home.html";
    saveStateToStorage("home.html");
    window.location.reload();
  });
}

// Attach the event listener using event delegation
document.addEventListener("click", function (event) {
  if (event.target.id === "signout") {
    handleLogout();
  }
});

// Call the function to check authentication state on page load
checkAuthState();

document.addEventListener("DOMContentLoaded", function () {
  const loginModal = document.getElementById("loginModal");
  const signupModal = document.getElementById("signupModal");
  const newUserButton = document.getElementById("new_user");
  const oldUserButton = document.getElementById("old_user");

  // Show signup modal and hide login modal
  newUserButton.addEventListener("click", function () {
    loginModal.style.display = "none";
    signupModal.style.display = "block";
  });

  // Show login modal and hide signup modal
  oldUserButton.addEventListener("click", function () {
    loginModal.style.display = "block";
    signupModal.style.display = "none";
  });
});

// Function to load user data into the table
function loadUserData(userId) {
  var userRef = db.collection("employees").doc(userId);
  userRef.get().then(function (doc) {
    if (doc.exists) {
      var userData = doc.data();
      var firstName = userData.firstName;
      var lastName = userData.lastName;
      var capitalizedFirstName =
        firstName.charAt(0).toUpperCase() + firstName.slice(1);

      var position = userData.position;
      var department = userData.department;
      var phoneNumber = userData.phoneNumber;
      var email = userData.email;
      var biography = userData.biography;
      var status = userData.isAdmin;

      // Check if the elements exist before accessing them
      var nameHeader = document.getElementById("NameHeader");
      var account_fname = document.getElementById("account_fname");
      var account_lname = document.getElementById("account_lname");
      var account_position = document.getElementById("position");
      var account_department = document.getElementById("department");
      var account_phoneNumber = document.getElementById("phoneNumber");
      var account_email = document.getElementById("email");
      var account_biography = document.getElementById("biography");
      var adminAccount_fname = document.getElementById("adminAccount_fname");
      var adminAccount_lname = document.getElementById("adminAccount_lname");
      var adminAccount_email = document.getElementById("adminAccount_email");
      var adminAccount_status = document.getElementById("adminAccount_status");

      if (nameHeader && account_fname && account_lname) {
        // Change value of elements
        // Update the inner HTML of nameHeader with the modified firstName
        nameHeader.innerHTML = capitalizedFirstName + "'s Account";
        account_fname.value = firstName;
        account_lname.value = lastName;
        account_position.value = position;
        account_department.value = department;
        account_phoneNumber.value = phoneNumber;
        account_email.innerHTML = email; // Update the inner HTML of account_email with the email
        account_biography.value = biography;
        adminAccount_fname.value = firstName;
        adminAccount_lname.value = lastName;
        adminAccount_email.value = email;
        adminAccount_status.value = status;
        // Update image preview if imageUrl exists in userData
        if (userData.imageUrl) {
          imagePreview.src = userData.imageUrl;
        }
      }
      // Add event listener for "SaveAccount" button click
      document.addEventListener("click", (e) => {
        // Check if the clicked element is the "SaveAccount" button
        if (e.target.id === "SaveAccount") {
          handleFormSubmission(e); // Call handleFormSubmission function
        }
      }); // Add event listener for image upload change
      const imageUpload = document.getElementById("imageUpload");
      imageUpload.addEventListener("change", function () {
        const file = this.files[0]; // Get the selected file
        if (file) {
          const reader = new FileReader(); // Create a FileReader object
          reader.onload = function (e) {
            imagePreview.src = e.target.result; // Set the preview image source
          };
          reader.readAsDataURL(file); // Read the selected file as a data URL
        } else {
          imagePreview.src = ""; // Clear the preview if no file is selected
        }
      });
    }
  });
}

function handleFormSubmission(event) {
  event.preventDefault(); // Prevent the default form submission behavior

  // Get form input values
  var firstName = document.getElementById("account_fname").value;
  var lastName = document.getElementById("account_lname").value;
  var position = document.getElementById("position").value;
  var department = document.getElementById("department").value;
  var phoneNumber = document.getElementById("phoneNumber").value;
  var email = document.getElementById("email").value;
  var biography = document.getElementById("biography").value;

  // Check if first name or last name is empty or email is being changed
  if (firstName.trim() === "" || lastName.trim() === "") {
    alert("First name and last name cannot be empty.");
    return;
  }

  // Get the user ID of the authenticated user
  var userId = firebase.auth().currentUser.uid;

  // Reference the user's document in Firestore
  var userRef = db.collection("employees").doc(userId);

  // Check if an image file is selected
  var imageFile = document.getElementById("imageUpload").files[0];
  if (imageFile) {
    // Create a storage reference for the image file
    var storageRef = firebase
      .storage()
      .ref()
      .child("user_images/" + userId + "/" + imageFile.name);

    // Upload the image file to Firebase Storage
    storageRef.put(imageFile).then(function (snapshot) {
      // Get the download URL of the uploaded image
      storageRef.getDownloadURL().then(function (imageUrl) {
        // Update the user data in Firestore, including imageUrl
        userRef
          .set(
            {
              firstName: firstName,
              lastName: lastName,
              position: position,
              department: department,
              phoneNumber: phoneNumber,

              biography: biography,
              imageUrl: imageUrl, // Add imageUrl to the update data
            },
            { merge: true } // Merge the new data with existing data
          )
          .then(() => {
            configure_message_bar("Account Has Been Saved!");
            // Scroll to the message bar
            document
              .getElementById("message_bar")
              .scrollIntoView({ behavior: "smooth" });
          })
          .catch((error) => {
            console.error("Error updating user data:", error);
            // Optionally, display an error message to the user
          });
      });
    });
  } else {
    // Update the user data in Firestore without imageUrl
    userRef
      .set(
        {
          firstName: firstName,
          lastName: lastName,
          position: position,
          department: department,
          phoneNumber: phoneNumber,

          biography: biography,
        },
        { merge: true } // Merge the new data with existing data
      )
      .then(() => {
        configure_message_bar("Account Has Been Saved!");
        // Scroll to the message bar
        document
          .getElementById("message_bar")
          .scrollIntoView({ behavior: "smooth" });
      })
      .catch((error) => {
        console.error("Error updating user data:", error);
        // Optionally, display an error message to the user
      });
  }
}

//Confirm Matching Passwords
function checkPasswordMatch() {
  var password = document.getElementById("s_password").value;
  var confirmPassword = document.getElementById("c_s_password").value;

  if (password == confirmPassword) {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords match";
  } else {
    document.getElementById("passwordMatchMessage").innerHTML =
      "Passwords don't match";
  }
}

function makeAdmin() {
  var firstName = document.getElementById("adminAccount_fname").value.trim();
  var lastName = document.getElementById("adminAccount_lname").value.trim();
  var email = document.getElementById("adminAccount_email").value.trim();
  var keyword = document.getElementById("adminAccount_keyword").value.trim();

  if (!firstName || !lastName || !email) {
    alert("First name, last name, and email are required.");
    return;
  }

  if (keyword !== "admin2024") {
    alert("Incorrect keyword. Admin privileges cannot be granted.");
    return;
  }

  // Query Firestore for the user with the given first name, last name, and email
  db.collection("employees")
    .where("firstName", "==", firstName)
    .where("lastName", "==", lastName)
    .where("email", "==", email)
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        console.log(
          "No user found with the provided information:",
          firstName,
          lastName,
          email
        );
        return;
      }

      // Get the first matching document
      const userDoc = querySnapshot.docs[0];

      // Check if the user is already an admin
      const isAdmin = userDoc.data().isAdmin;
      if (isAdmin) {
        alert("This user is already an admin.");
        return;
      }

      // Update the user's isAdmin field to true
      db.collection("employees")
        .doc(userDoc.id)
        .update({
          isAdmin: true,
        })
        .then(() => {
          alert("User successfully made an admin:", firstName, lastName, email);
          // Optionally, update the UI to reflect the change
        })
        .catch((error) => {
          console.error("Error updating user admin status:", error);
        });
    })
    .catch((error) => {
      console.error("Error fetching users:", error);
    });
}

async function handlePostBlogClick(event) {
  // Check if the clicked element is the "postBlog" button
  if (event.target.id === "postBlog") {
    event.preventDefault(); // Prevent default form submission behavior

    // Code for handling PDF uploads
    const pdfInput = document.getElementById("pdfFile");
    const file = pdfInput.files[0];

    if (!file) {
      console.error("No file selected.");
      return;
    }

    // Display an alert message when the button is clicked
    configure_message_bar("PDF upload in progress...");

    try {
      // Upload the PDF file to Firebase Storage
      const storageRef = firebase.storage().ref("pdfs/" + file.name); // Specify the path in Storage
      const uploadTask = storageRef.put(file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // Handle upload progress if needed
        },
        (error) => {
          console.error("Error uploading PDF to Storage:", error);
        },
        async () => {
          // Get the download URL of the uploaded file
          const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
          const publishDate = new Date();
          const author = document.getElementById("employeeSelect").value;
          const title = document.getElementById("title").value;

          // Add the PDF details to Firestore
          await db.collection("Blog").add({
            content: downloadURL, // Store the download URL
            publishDate: publishDate,
            author: author,
            title: title,
            // Add other attributes as needed (e.g., authorId, blogId)
          });
          configure_message_bar("New Blog Post Successfully Added!");

          // Update the embed element with the new PDF URL
          const embedElement = document.getElementById("output");
          embedElement.src = downloadURL;

          // Optionally, fetch and display the most recent blog post after upload
          await displayMostRecentBlog();
        }
      );
    } catch (error) {
      console.error("Error uploading PDF:", error);
    }
  }
}

document.addEventListener("click", (e) => {
  // Check if the clicked element is the "SaveAccount" button
  if (e.target.id === "postBlog") {
    handlePostBlogClick(e); // Call handleFormSubmission function
  }
});

// Reference to the Firestore collection
const blogRef = db.collection("Blog");

// Function to fetch and display the most recent blog post
async function displayMostRecentBlog() {
  try {
    // Query Firestore to get the most recent blog post
    const querySnapshot = await blogRef
      .orderBy("publishDate", "desc")
      .limit(1)
      .get();

    // Check if there are any documents in the query snapshot
    if (!querySnapshot.empty) {
      // Get the data of the most recent blog post
      const blogPost = querySnapshot.docs[0].data();

      // Update the HTML content of the "output" div with the blog post information
      const outputDiv = document.getElementById("output");
      outputDiv.innerHTML = `
      <h2>${blogPost.title}</h2>
      <h3>Published By: ${blogPost.author}</h3>
      
      <embed id="embedPdf" src="${blogPost.content}" type="application/pdf" width="100%" height="600px" />
      <!-- Add other fields as needed -->
      `;
    } else {
      console.log("No blog posts found.");
    }
  } catch (error) {
    console.error("Error fetching blog posts:", error);
  }
}
// Check if the current page URL contains "talent.html" before calling the function
if (window.location.href.includes("talent.html")) {
  displayMostRecentBlog();
}
function adminDropdown() {
  db.collection("employees")
    .where("isAdmin", "==", true)
    .get()
    .then((response) => {
      let mydocs = response.docs;
      let all_names = [];
      mydocs.forEach((doc) => {
        let firstName = doc.data().firstName;
        let lastName = doc.data().lastName;
        if (firstName !== "" && lastName !== "") {
          // Concatenate first name and last name
          let fullName = `${firstName} ${lastName}`;
          all_names.push(fullName);
        }
      });
      // Get the dropdown element
      let employee_dropdown = document.getElementById("employeeSelect");

      // Clear existing options
      employee_dropdown.innerHTML = "";

      // Loop through all names to add option values
      all_names.forEach(function (item) {
        let option = document.createElement("option");
        option.text = item;
        option.value = item;
        employee_dropdown.appendChild(option);
      });
    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
    });
}

// dynamic directory loading

// function formatPhoneNumber() {}

// Function to check admin status and hide/show element based on isAdmin field
function checkAdminStatusAndHideElement(userEmail, elementId) {
  const employeesRef = db.collection("employees");
  employeesRef
    .where("email", "==", userEmail)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        const isAdmin = querySnapshot.docs[0].data().isAdmin;
        const element = document.getElementById(elementId);
        if (isAdmin && element) {
          element.style.display = "block"; // Show the element
        } else {
          element.style.display = "none"; // Hide the element
        }
      }
    });
}

//dynamic directory loading
function loadDirectory() {
  db.collection("employees")
    .get()
    .then((res) => {
      let data = res.docs;
      let html = ``;
      data.forEach((d) => {
        let phoneNumber = formatPhoneNumber(d.data().phoneNumber);
        // let headshot = getimage(d.data().firstName, d.data().lastName);
        imageType = d.data().imageUrl;
        if (typeof imageType === "undefined") {
          headshot = "placeholder-headshot.jpg";
        } else {
          headshot = imageType;
        }

        html += `<div class="EmployeeCard" id="${d.id}"> 
          <img src="${headshot}" alt="${headshot}" class="employee-image"/> 
          <div class="employee-name">${d.data().firstName} ${
          d.data().lastName
        }</div>
          <div class="employee-phone card-hidden">Phone Number: ${
            d.data().phoneNumber
          }</div>
          <div class="employee-department card-hidden">Department: ${
            d.data().department
          }</div>
          <div class="employee-position card-hidden">Position: ${
            d.data().position
          }</div>
          <div class="employee-bio card-hidden">Biography: ${
            d.data().biography
          }</div>
          <button class="expand-button" onclick="expandCard('${
            d.data().email
          }')">Expand</button>
          <button class="delete-button" id="delete_${
            d.data().email
          }" onclick="deleteEmployee('${d.data().email}')">X</button>
        </div>`;
        html += `<div class="EmployeeCard" id="${d.id}"> 
        <img src="${headshot}" alt="${headshot}" class="employee-image"/> 
    <div class="employee-name">${d.data().firstName} ${d.data().lastName}</div>
    <div class="employee-phone">${phoneNumber}</div></div>`;
      });
      document.querySelector("#employee_directory").innerHTML += html;
    });
}

function expandCard(email) {
  let card = document.getElementById(email);
  let phoneNumber = card.querySelector(".employee-phone");
  let bio = card.querySelector(".employee-bio");
  let department = card.querySelector(".employee-department");
  let position = card.querySelector(".employee-position");
  let allCards = document.querySelectorAll(".card");

  allCards.forEach((c) => {
    if (c.id !== email && c.classList.contains("expanded")) {
      c.classList.remove("expanded");
      c.querySelector(".employee-phone").classList.add("card-hidden");
      c.querySelector(".employee-bio").classList.add("card-hidden");

      c.querySelector(".employee-department").classList.add("card-hidden");
      c.querySelector(".employee-position").classList.add("card-hidden");
    }
  });

  card.classList.toggle("expanded");
  phoneNumber.classList.toggle("card-hidden");
  department.classList.toggle("card-hidden");
  position.classList.toggle("card-hidden");
  bio.classList.toggle("card-hidden");
}

function formatPhoneNumber(phoneNumber) {
  phoneNumber = String(phoneNumber);
  if (phoneNumber === undefined || phoneNumber.trim() === "") {
    return "";
  }
  // Remove all non-digit characters from the phone number
  phoneNumber = phoneNumber.replace(/\D/g, "");
  if (phoneNumber.length === 10) {
    return phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
  } else {
    return "";
  }
}

function findStaff() {
  let inputSearch = document.getElementById("searchStaff").value.toLowerCase();
  let trueNames = [];
  db.collection("employees")
    .get()
    .then((res) => {
      let data = res.docs;
      data.forEach((d) => {
        let firstName = d.data().firstName;
        if (firstName !== undefined) {
          firstName = firstName.toLowerCase();
          if (firstName.includes(inputSearch)) {
            trueNames.push(d.id);
          }
        }
      });
      db.collection("employees")
        .get()
        .then((res) => {
          let data = res.docs;
          data.forEach((d) => {
            let lastName = d.data().lastName;
            if (lastName !== undefined) {
              lastName = lastName.toLowerCase();
              if (lastName.includes(inputSearch)) {
                trueNames.push(d.id);
              }
            }
          });
          // Remove duplicates
          trueNames = Array.from(new Set(trueNames));
          //duplicate names arent hidden the 2nd time

          let allStaffArray = document.getElementsByClassName("EmployeeCard");

          let idList = [];
          for (let i = 0; i < allStaffArray.length; i++) {
            idList.push(allStaffArray[i].id);
          }
          idList = Array.from(new Set(idList));
          for (let i = 0; i < idList.length; i++) {
            let testName = idList[i];
            document.getElementById(testName).style.display = "none";
          }
          for (let i = 0; i < trueNames.length; i++) {
            let testName = trueNames[i];
            document.getElementById(testName).style.display = "block";
          }
        });
    });
}

async function deleteEmployee(email) {
  if (
    confirm(
      `Are you sure you want to delete the employee with email: ${email}?`
    )
  ) {
    try {
      // Step 1: Delete employee data from Firestore
      const querySnapshot = await db
        .collection("employees")
        .where("email", "==", email)
        .get();

      if (!querySnapshot.empty) {
        querySnapshot.forEach(async (doc) => {
          await doc.ref.delete();
          // Step 2: Delete associated data from Firebase Storage
          const storageRef = firebase.storage().ref();
          const employeeImagesRef = storageRef.child(`images/${email}`);

          // Delete all files under the employee's images folder
          employeeImagesRef.listAll().then((res) => {
            res.items.forEach((itemRef) => {
              itemRef
                .delete()
                .then(() => {
                  console.log("Associated image deleted successfully.");
                })
                .catch((error) => {
                  console.error("Error deleting associated image:", error);
                });
            });
          });

          // Step 3: Delete user from Firebase Authentication
          // const user = firebase.auth().currentUser;

          // if (user) {
          //   user
          //     .delete()
          //     .then(() => {
          //       console.log("User deleted from Firebase Authentication.");
          //     })
          //     .catch((error) => {
          //       console.error(
          //         "Error deleting user from Firebase Authentication:",
          //         error
          //       );
          //     });
          // }

          // Display success message and scroll to message bar
          configure_message_bar(
            `Employee with email ${email} deleted successfully.`
          );
          location.reload();
          alert("Employee Deleted");
          document
            .getElementById("message_bar")
            .scrollIntoView({ behavior: "smooth" });
        });
      } else {
        console.error("No employee found with the email:", email);
      }
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  }
}

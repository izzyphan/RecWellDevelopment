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

// Function to scroll the message bar into view
function scrollMessageBarIntoView() {
  const messageBar = document.getElementById("message_bar");
  if (messageBar) {
    messageBar.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Function to configure and display the home message bar with a given message
function home_message_bar(message) {
  var messageBar = document.getElementById("message_bar");
  if (messageBar) {
    // Display the message and set its content
    messageBar.style.display = "block";
    messageBar.innerHTML = message;

    // Hide the message bar after 5 seconds
    setTimeout(() => {
      messageBar.style.display = "none"; // Hide the message bar
      messageBar.innerHTML = ""; // Clear the message content
    }, 7000);
  }
}

// Function to configure and display the message bar with a given message
function configure_message_bar(message) {
  var messageBar = document.getElementById("message_bar");
  if (messageBar) {
    // Display the message and set its content
    messageBar.style.display = "block";
    messageBar.innerHTML = message;

    scrollMessageBarIntoView(); // Scroll the message bar into view

    // Hide the message bar after 5 seconds
    setTimeout(() => {
      messageBar.style.display = "none"; // Hide the message bar
      messageBar.innerHTML = ""; // Clear the message content
    }, 5000);
  }
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
          home_message_bar(options.message);
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
          } else {
            console.log("User is not authenticated.");
          }
        });
        break;
      case "points":
        url = "points.html";
        employeeDropdown();

        // Call checkAdminStatusAndHideElement when loading points.html and talent.html
        firebase.auth().onAuthStateChanged(function (user) {
          if (user) {
            var userEmail = user.email;
            var elementIdToHide = "penalty_container";
            loadUserPoints(userEmail);
            loadUserRewards(userEmail);
            updatePointHeaderByEmail(userEmail);
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
            var elementIdToHide = "admin-status";

            checkAdminStatusAndHideElement(userEmail, elementIdToHide);
          }
        });
        loadEmployeeShoutouts();
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
        biography: "",
        department: "",
        phoneNumber: "",
        position: "",
        isAdmin: false,
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
          var elementIDToHide = "penalty_container";
          checkAdminStatusAndHideElement(userEmail, elementIDToHide);
          checkAdminStatusAndHideElement(userEmail, "admin-status");
          updatePointHeaderByEmail(userEmail);
          loadUserPoints(userEmail);
          loadUserRewards(userEmail);
        }
        employeeDropdown();
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
          var elementIDToHide = "admin-status";
          checkAdminStatusAndHideElement(userEmail, elementIDToHide);
        }
      });
      loadEmployeeShoutouts();
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
        account_email.innerHTML = email;
        account_biography.value = biography;
        adminAccount_fname.value = firstName;
        adminAccount_lname.value = lastName;
        adminAccount_email.value = email;
        adminAccount_status.textContent = status;
        // Update image preview if imageUrl exists in userData
        if (userData.imageUrl) {
          imagePreview.src = userData.imageUrl;
        }
      }
      // Add event listener for "SaveAccount" button click
      document.addEventListener("click", (e) => {
        // Check if the clicked element is the "SaveAccount" button
        if (e.target.id === "SaveAccount") {
          handleFormSubmission(e);
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
      const storageRef = firebase.storage().ref("pdfs/" + file.name);
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

        html += `<div class="EmployeeCard" id="${d.data().email}"> 
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
          <div id="expand-delete">
          <button class="expand-button" onclick="expandCard('${
            d.data().email
          }')">Expand</button>
          <button class="delete-button" id="delete_${
            d.data().email
          }" onclick="deleteEmployee('${d.data().email}')">X</button></div>
        </div>`;
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
  document
    .getElementById("searchStaff")
    .addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
  let inputSearch = document.getElementById("searchStaff").value.toLowerCase();
  let positionSearch = document.getElementById("directoryPosition").value;
  let departmentSearch = document.getElementById("directoryDepartment").value;
  let trueNames = [];
  db.collection("employees")
    .get()
    .then((res) => {
      let data = res.docs;
      data.forEach((d) => {
        let firstName = d.data().firstName;
        let lastName = d.data().lastName;
        let position = d.data().position + " Any";
        let department = d.data().department + " Any";
        console.log(position);
        if (
          firstName !== undefined &&
          lastName !== undefined &&
          position !== undefined
        ) {
          firstName = firstName.toLowerCase();
          lastName = lastName.toLowerCase();
          if (
            (firstName.includes(inputSearch) ||
              lastName.includes(inputSearch)) &&
            position.includes(positionSearch) &&
            department.includes(departmentSearch)
          ) {
            trueNames.push(d.data().email);
          }
        }
        // Remove duplicates
        trueNames = Array.from(new Set(trueNames));
        //duplicate names arent hidden the 2nd time
        let allStaffArray = document.getElementsByClassName("EmployeeCard");
        let idList = [];
        for (let i = 0; i < allStaffArray.length; i++) {
          //Returns the id of the divs, which is the user email
          idList.push(allStaffArray[i].id);
        }
        idList = Array.from(new Set(idList));
        for (let i = 0; i < idList.length; i++) {
          //this list contains every persons name that matches the serach string. Hides Everything
          let testName = idList[i];
          document.getElementById(testName).style.display = "none";
        }
        for (let i = 0; i < trueNames.length; i++) {
          // Shows everything where the email is in the truenames list
          let testName = trueNames[i];
          document.getElementById(testName).style.display = "block";
        }
      });
    });
}

async function deleteEmployee(email) {
  if (
    confirm(
      `Are you sure you want to delete the employee with email: ${email}? Doing so will prevent them from logging in or making an account with this email.`
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

function employeeDropdown() {
  db.collection("employees")
    .get()
    .then((response) => {
      let mydocs = response.docs;
      let all_names = [];
      mydocs.forEach((doc) => {
        let email = doc.data().email;
        let firstName = doc.data().firstName;
        let lastName = doc.data().lastName;
        if (firstName !== "" && lastName !== "") {
          // Concatenate first name and last name
          let fullName = `${firstName} ${lastName}`;

          all_names.push({ name: fullName, email: email }); // Store both name and email
        }
      });

      // Get the dropdown elements

      let employeeDropdown1 = document.getElementById("employee_names");
      let employeeDropdown2 = document.getElementById("employee_name2");

      // Clear existing options
      employeeDropdown1.innerHTML = "";
      employeeDropdown2.innerHTML = "";

      // Loop through all names to add option values for both dropdowns
      all_names.forEach(function (item) {
        let option1 = document.createElement("option");
        let option2 = document.createElement("option");

        option1.text = item.name;
        option1.value = item.email; // Set the value to the email
        employeeDropdown1.appendChild(option1);

        option2.text = item.name;
        option2.value = item.email; // Set the value to the email
        employeeDropdown2.appendChild(option2);
      });
    })
    .catch((error) => {
      console.log("Error getting documents: ", error);
    });
}

function updatePointHeaderByEmail(email) {
  // Fetch the employee document corresponding to the provided email
  db.collection("employees")
    .where("email", "==", email)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Get the first document (assuming email is unique)
        const employeeDoc = querySnapshot.docs[0];
        // Get the name from the employee document
        const employeeName =
          employeeDoc.data().firstName + " " + employeeDoc.data().lastName;
        // Update the pointHeader element with the employee's name
        let pointHeader = document.getElementById("point_header");
        pointHeader.innerHTML = `${employeeName}'s Points and Rewards`;
      } else {
        console.log("Employee not found.");
      }
    })
    .catch((error) => console.error("Error fetching employee data:", error));
}

// Function to add penalty points to the database
function addPenaltyPoints() {
  // Get the values from the form
  let employeeEmail = document.getElementById("employee_names").value;
  let employeeName =
    document.getElementById("employee_names").options[
      document.getElementById("employee_names").selectedIndex
    ].text;

  let date = document.getElementById("date1").value;
  let reason = document.getElementById("penalty_name").value;
  let moreInfo = document.getElementById("moreinfo").value;
  let weight = document.getElementById("penaltyWeight").value;

  // Check if all required fields are filled
  if (employeeEmail == "" || date == "" || reason == "" || weight == "") {
    alert(
      "Please fill employee name, date, reason, and weight for this penalty point."
    );
    return;
  }
  // Check if the selected date is in the future
  let selectedDate = new Date(date);
  let currentDate = new Date();
  if (selectedDate > currentDate) {
    alert("Please select a date that has already occurred.");
    return;
  }

  // Get the user's email based on the selected employee name
  db.collection("employees")
    .where("email", "==", employeeEmail)
    .get()
    .then((querySnapshot) => {
      if (!querySnapshot.empty) {
        // Assuming there's only one document matching the query
        let userDoc = querySnapshot.docs[0];
        let userEmail = userDoc.data().email;

        // Add the penalty points to the Firestore collection "points"
        return db.collection("points").add({
          employeeEmail: employeeEmail,
          date: date,
          employeeName: employeeName,
          reason: reason,
          moreInfo: moreInfo,
          penaltyWeight: weight,
        });
      } else {
        throw new Error("Employee not found.");
      }
    })
    .then(() => {
      // Clear the form after submission
      document.getElementById("employee_names").value = "";
      document.getElementById("date1").value = "";
      document.getElementById("penalty_name").value = "";
      document.getElementById("moreinfo").value = "";
      document.getElementById("penaltyWeight").value = "";
      configure_message_bar("Penalty Point Has Been Added");
    })
    .catch((error) => {
      console.error("Error adding penalty points: ", error);
    });
}

// Attach the event listener using event delegation
document.addEventListener("click", function (event) {
  if (event.target.id == "penaltyButton") {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Call the addPenaltyPoints function
    addPenaltyPoints();
  }
});

function loadUserPoints(userEmail) {
  // Get the points data for the logged-in user
  db.collection("points")
    .where("employeeEmail", "==", userEmail)
    .get()
    .then((querySnapshot) => {
      let pointsDisplay = document.getElementById("pointsDisplay");
      let totalWeightDisplay = document.getElementById("pointTotal");
      pointsDisplay.innerHTML = ""; // Clear previous content
      totalWeightDisplay.innerHTML = ""; // Clear previous total weight

      let totalWeight = 0; // Initialize total weight variable

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          let pointsData = doc.data();
          let pointDate = pointsData.date;
          let pointReason = pointsData.reason;
          let pointWeight = parseFloat(pointsData.penaltyWeight);

          let pointEmployee = pointsData.employeeName;

          // Add the point weight to the total weight if it's a valid number
          if (!isNaN(pointWeight)) {
            totalWeight += pointWeight;
          }
          // Create a card-like display for each point
          let pointCard = document.createElement("div");
          pointCard.classList.add("point-card");
          pointCard.innerHTML = `
            <div class="point-info">
            <div>Employee: ${pointEmployee}</div>
              <div>Date: ${pointDate}</div>
              <div>Reason: ${pointReason}</div>
              <div>Weight: ${pointWeight}</div>
            </div>
          `;
          pointsDisplay.appendChild(pointCard);
        });

        // Display the total weight if it's not undefined
        if (totalWeight !== undefined) {
          totalWeightDisplay.innerHTML = `Total Weight: ${totalWeight}`;
        }
      } else {
        // No points data found for the user
        pointsDisplay.innerHTML = "No points found.";
      }
    })
    .catch((error) => {
      console.error("Error loading user points: ", error);
    });
}

function addRewardPoints(currentUserEmail) {
  return new Promise((resolve, reject) => {
    // Get the values from the form
    let employeeEmail = document.getElementById("employee_name2").value;
    let employeeName =
      document.getElementById("employee_name2").options[
        document.getElementById("employee_name2").selectedIndex
      ].text;

    let date = document.getElementById("date2").value;
    let reason = document.getElementById("reward_name").value;
    let moreInfo = document.getElementById("rewardinfo").value;

    // Check if all required fields are filled
    if (employeeEmail == "" || date == "" || reason == "") {
      alert("Please fill in all required fields.");
      return;
    }

    // Check if the selected date is in the future
    let selectedDate = new Date(date);
    let currentDate = new Date();
    if (selectedDate > currentDate) {
      alert("Please select a date that has already occurred.");
      return;
    }

    // Get the user's email based on the selected employee name
    db.collection("employees")
      .where("email", "==", employeeEmail)
      .get()
      .then((querySnapshot) => {
        if (!querySnapshot.empty) {
          // Assuming there's only one document matching the query
          let userDoc = querySnapshot.docs[0];
          let userEmail = userDoc.data().email;

          // Add the reward points to the Firestore collection "points"
          return db.collection("rewards").add({
            employeeEmail: employeeEmail, // Use the user's email instead of name
            date: date,
            employeeName: employeeName,
            reason: reason,
            moreInfo: moreInfo,
            submissionDate: currentDate,
            loggedInUserEmail: currentUserEmail, // Add the logged-in user's email
          });
        } else {
          throw new Error("Employee not found.");
        }
      })
      .then(() => {
        // Clear the form after submission
        document.getElementById("employee_name2").value = "";
        document.getElementById("date2").value = "";
        document.getElementById("reward_name").value = "";
        document.getElementById("rewardinfo").value = "";
        configure_message_bar("Reward Point Has Been Added");
        resolve();
      })
      .catch((error) => {
        console.error("Error adding reward points: ", error);
      });
  });
}

// submission event listener for rewards
document.addEventListener("click", function (event) {
  if (event.target.id == "rewardButton") {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the current user's email using getCurrentUserEmail()
    const currentUserEmail = getCurrentUserEmail();

    // Check if currentUserEmail is not null or undefined before proceeding
    if (currentUserEmail) {
      // Destroy the old chart before adding new reward points
      if (window.rewardDonutChart) {
        window.rewardDonutChart.destroy();
      }
      // Call the addRewardPoints function with the current user's email
      addRewardPoints(currentUserEmail)
        .then(() => {
          // After adding reward points successfully, load and display the updated rewards
          loadUserRewards(currentUserEmail);
        })
        .catch((error) => {
          console.error("Error adding reward points: ", error);
        });
    } else {
      console.log("No user signed in.");
    }
  }
});

function rewardLimit(userEmail) {
  const today = new Date(); // Get the current date
  const currentMonth = today.getMonth(); // Get the current month (0-indexed)
  const currentYear = today.getFullYear(); // Get the current year

  // Create a timestamp for the start of the current month
  const startOfMonth = new Date(currentYear, currentMonth, 1);

  // Create a timestamp for the start of next month
  const startOfNextMonth = new Date(currentYear, currentMonth + 1, 1);

  db.collection("rewards")
    .where("loggedInUserEmail", "==", userEmail)
    .where("submissionDate", ">=", startOfMonth)
    .where("submissionDate", "<", startOfNextMonth)
    .get()
    .then((querySnapshot) => {
      // Check if the number of rewards submitted this month is less than 10
      if (querySnapshot.size < 10) {
        let rewardsCount = querySnapshot.size; // Get the count of rewards

        updateDonutChart(rewardsCount);

        document.getElementById(
          "NumSubmission"
        ).innerHTML = `You have submitted ${rewardsCount} rewards this month.`;
      } else {
        // Display a message indicating the limit has been reached
        document.getElementById(
          "NumSubmission"
        ).innerHTML = `You have reached the limit of 10 rewards submissions for this month.`;
      }
    });
}

function loadUserRewards(userEmail) {
  // Get the rewards data for the logged-in user
  db.collection("rewards")
    .where("employeeEmail", "==", userEmail)
    .get()
    .then((querySnapshot) => {
      let rewardsDisplay = document.getElementById("shoutoutDisplay");

      rewardsDisplay.innerHTML = ""; // Clear previous content

      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          let rewardsData = doc.data();
          let rewardDate = rewardsData.date;
          let rewardReason = rewardsData.reason;
          let rewardEmployee = rewardsData.employeeName;
          let fromEmployee = rewardsData.loggedInUserEmail;
          let moreInfo = rewardsData.moreInfo;
          // Create a card-like display for each reward
          let rewardCard = document.createElement("div");
          rewardCard.classList.add("reward-card");
          rewardCard.innerHTML = `
            <div class="reward-info">
            <div>To: ${rewardEmployee}</div>
            <div>From: ${fromEmployee}</div>
              <div>Date: ${rewardDate}</div>
              <div>Reason: ${rewardReason}</div>
              <div>Description: ${moreInfo}</div>
            </div>
          `;
          rewardsDisplay.appendChild(rewardCard);
        });
      } else {
        // No rewards data found for the user
        rewardsDisplay.innerHTML = "No rewards found.";
      }
      // Update the donut chart with the rewards count
      rewardLimit(userEmail);
    })
    .catch((error) => {
      console.error("Error loading user rewards: ", error);
    });
}
function getCurrentUserEmail() {
  // Check if there is a currently signed-in user
  const user = auth.currentUser;
  if (user) {
    // Return the user's email
    return user.email;
  } else {
    // Handle the case when there is no signed-in user
    console.log("No user signed in.");
    return null;
  }
}

// function to show top 15 most recent employee rewards on home page
function loadEmployeeShoutouts() {
  // Get the rewards data for all employees within the specified date range
  db.collection("rewards")
    .orderBy("date", "desc") // Order by date in descending order (most recent first)
    .limit(10) // Limit to the top 15 most recent shoutouts
    .get()
    .then((querySnapshot) => {
      let shoutoutsContainer = document.getElementById("shoutouts");

      // Clear previous content
      shoutoutsContainer.innerHTML = "";

      if (!querySnapshot.empty) {
        // Iterate through the query results
        querySnapshot.forEach((doc) => {
          let rewardsData = doc.data();
          let rewardDate = rewardsData.date;
          let rewardReason = rewardsData.reason;
          let rewardEmployee = rewardsData.employeeName;
          let fromEmployee = rewardsData.loggedInUserEmail;
          let moreInfo = rewardsData.moreInfo;

          // Create a card-like display for each shoutout
          let shoutoutCard = document.createElement("div");
          shoutoutCard.classList.add("shoutout-card");
          shoutoutCard.innerHTML = `
            
            <p>${rewardDate}, ${rewardEmployee}: ${rewardReason}</p>
            ${moreInfo ? `<p>Description: ${moreInfo}</p>` : ""}
            <hr>
          `;
          shoutoutsContainer.appendChild(shoutoutCard);
        });
      } else {
        // No shoutouts found within the specified date range
        shoutoutsContainer.innerHTML = "No shoutouts found.";
      }
    })
    .catch((error) => {
      console.error("Error loading employee shoutouts: ", error);
    });
}

// Placeholder data for the chart
const defaultChartData = {
  labels: ["Submitted", "Remaining"],
  datasets: [
    {
      data: [0, 10], // Initial values (0 submitted, 10 remaining as per your limit)
      backgroundColor: ["#36a2eb", "#ff6384"],
    },
  ],
};

// Function to update the donut chart
function updateDonutChart(rewardsCount) {
  const donutChartCanvas = document
    .getElementById("rewardChart")
    .getContext("2d");

  destroyChart();

  // Calculate the displayed rewards count (limited to 10)
  const displayedRewardsCount = Math.min(rewardsCount, 10);

  const donutChart = new Chart(donutChartCanvas, {
    type: "doughnut",
    data: {
      labels: ["Submitted", "Remaining"],
      datasets: [
        {
          data: [displayedRewardsCount, 10 - displayedRewardsCount], // Assuming the limit is 10
          backgroundColor: ["#36a2eb", "#ff6384"],
        },
      ],
    },
    options: {
      // responsive: false,
      // maintainAspectRatio: false,
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Reward Submissions",
      },
    },
  });
  // Store the chart instance in the myDonutChart variable
  myDonutChart = donutChart;
}

let myDonutChart; // Variable to store the chart instance

// Function to destroy the existing chart
function destroyChart() {
  if (myDonutChart) {
    myDonutChart.destroy(); // Destroy the chart if it exists
  }
}

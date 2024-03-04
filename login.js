// log in modal

function r_e(id) {
  return document.querySelector(`#${id}`);
}
// Add event listener to login form submission
r_e("loginform").addEventListener("submit", function (event) {
  event.preventDefault();

  // Get form input values
  var username = document.getElementById("username").value;
  var password = document.getElementById("password").value;

  // Log form input values to the console
  console.log("Username:", username);
  console.log("Password:", password);

  auth.createUserWithEmailAndPassword(username, password).then((cred) => {
    console.log(cred);
  });
});

console.log("hi");

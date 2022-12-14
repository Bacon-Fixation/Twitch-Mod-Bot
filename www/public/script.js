document.body.addEventListener("click", (e) => {
  if (e.target.getAttribute("type") == "checkbox") {
    generate();
  }
});

function generate() {
  var force_verify = "false";
  const scopes = [];
  var checks = document.getElementsByTagName("input");
  for (var x = 0; x < checks.length; x++) {
    if (checks[x].getAttribute("type") == "checkbox") {
      //   console.log(x, checks[x].checked, checks[x].getAttribute("name"));
      if (checks[x].checked) {
        if (checks[x].getAttribute("name") == "force_verify") {
          force_verify = "true";
        } else {
          scopes.push(checks[x].getAttribute("name"));
        }
      }
    }
  }

  var url = `https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}&force_verify=${force_verify}&state=${state}&scope=`;
  url += scopes.join("+");
  document.getElementById("auth_url").setAttribute("href", url);
}
generate();

function auth() {
  document.getElementById("authForm").hidden = true;

  if (document.location.hash && document.location.hash != "") {
    const parsedHash = new URLSearchParams(window.location.hash.slice(1));
    if (parsedHash.get("access_token")) {
      var access_token = parsedHash.get("access_token");
      document
        .getElementById("access_token")
        .setAttribute("value", access_token);
      document
        .getElementById("authForm")
        .setAttribute("action", "token?" + parsedHash);
      document.getElementById("authForm").hidden = false;
    }
  } else if (document.location.search && document.location.search != "") {
    const parsedParams = new URLSearchParams(window.location.search);
    if (parsedParams.get("error_description")) {
      document.getElementById("access_token").textContent =
        parsedParams.get("error") +
        " - " +
        parsedParams.get("error_description");
    }
  }
}
auth();

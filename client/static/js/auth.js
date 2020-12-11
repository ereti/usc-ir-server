const login = document.forms.login;
const register = document.forms.register;

if(location.protocol != "https:")
{
    $("#register-form").prepend($(`<div class="form-group">
        <span style="color: red;">Note: server is not using HTTPS. You should definitely not use a password that you use anywhere else.</span>
    </div>`))
}

function error({error, invalid}, form)
{
    document.getElementById(form + "-feedback").innerText = error;
    document.getElementById(invalid + "-" + form).setCustomValidity(error);
}


if(login) login.onsubmit = _ => {
    fetch("/auth/login", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: login.username.value,
            password: login.password.value
        }),
        credentials: "same-origin"
    }).then(res => {
        if(!res.ok) res.json().then(json => error(json, "login"));
        else window.location.reload(true);
    })

    return false;
}

if(register) register.onsubmit = _ => {
    fetch("/auth/register", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            username: register.username.value,
            password: register.password.value
        }),
        credentials: "same-origin"
    }).then(res => {
        if(!res.ok) res.json().then(json => error(json, "register"));
        else window.location.reload(true);
    })

    return false;
}

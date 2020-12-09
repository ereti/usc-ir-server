const login = document.forms.login;
const register = document.forms.register;

function error({error}, form)
{
    document.getElementById(form + "-feedback").innerText = error;
    document.getElementById(form).setCustomValidity(error);
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

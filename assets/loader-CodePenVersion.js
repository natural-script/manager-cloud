var temp = location.host.split('.').reverse();
var root_domain = temp[1] + '.' + temp[0];
if (root_domain == 'codepen.io') {
    function JSScriptsExec(node) {
        if (node.tagName === 'SCRIPT') {
            setTimeout(function () {
                window.eval(node.innerHTML);
            }, 100);
        } else {
            var i = 0;
            var children = node.childNodes;
            while (i < children.length) {
                JSScriptsExec(children[i++]);
            }
        }
    }
    var request = new XMLHttpRequest();
    request.open('GET', 'https://jste-manager.herokuapp.com/framework-LiveVersion.min.html', false);

    request.onload = function () {
        if (request.status >= 200 && request.status < 400) {
            var pageLoadingChecker = setInterval(function () {
                if (document.getElementsByTagName("CONTENTS").length > 0) {
                    clearInterval(pageLoadingChecker);
                }
            }, 1);
            setTimeout(function () {
                document.getElementsByTagName("HEAD")[0].innerHTML += request.responseText;
                JSScriptsExec(document.getElementsByTagName("HEAD")[0]);
            }, 1000);
        }
    };
    request.send();
}